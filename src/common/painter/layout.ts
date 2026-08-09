import { LayoutError } from "@common/error";
import type { CanvasRenderingContext2D } from "canvas";
import type z from "zod/v4";
import type { PainterModule } from "./painter";
import type { Theme, ThemeManager } from "./theme";

export interface LayoutBounds {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface ModuleMeasurement<State = unknown> {
    /** Logical bounds relative to the element's authored x/y origin. */
    bounds: LayoutBounds;
    /** Prepared data cached during measurement and passed back to draw(). */
    state?: State;
}

export interface ResolvedModuleLayout<State = unknown> {
    /** Absolute logical bounds after resolving anchors. */
    bounds?: LayoutBounds;
    canvas: {
        width: number;
        height: number;
    };
    measurement?: ModuleMeasurement<State>;
    translation: {
        x: number;
        y: number;
    };
}

export interface ResolvedPainterLayout {
    canvas: {
        width: number;
        height: number;
    };
    elements: ResolvedModuleLayout[];
}

type LayoutElement = z.infer<typeof ThemeManager.ELEMENT>;
type LayoutThemeContent = z.infer<typeof ThemeManager.BASE_THEME> & {
    elements: LayoutElement[];
};
type Axis = "x" | "y";
type ResolutionState = "visiting" | "resolved";

const CANVAS_ID = "$canvas";

function getAxisStart(bounds: LayoutBounds, axis: Axis) {
    return axis === "x" ? bounds.left : bounds.top;
}

function getAxisSize(bounds: LayoutBounds, axis: Axis) {
    return axis === "x" ? bounds.width : bounds.height;
}

function getAnchorFactor(anchor: string) {
    switch (anchor) {
        case "left":
        case "top":
            return 0;
        case "center":
            return 0.5;
        case "right":
        case "bottom":
            return 1;
        default:
            return 0;
    }
}

function validateMeasurement(element: LayoutElement, measurement: ModuleMeasurement): ModuleMeasurement {
    const { bounds } = measurement;
    const values = [bounds.left, bounds.top, bounds.width, bounds.height];
    if (!values.every(Number.isFinite) || bounds.width < 0 || bounds.height < 0) {
        throw new LayoutError(`Element "${element.id ?? element.type}" returned invalid measurement bounds.`, {
            elementId: element.id,
            elementType: element.type,
            bounds,
        });
    }
    return measurement;
}

export async function resolvePainterLayout(
    measurementCtx: CanvasRenderingContext2D,
    theme: Theme<LayoutThemeContent>,
    modules: Readonly<Record<string, PainterModule>>,
    painterCtx: unknown,
): Promise<ResolvedPainterLayout> {
    const { content } = theme;
    const elements = content.elements;
    const elementIndexById = new Map<string, number>();

    for (const [index, element] of elements.entries()) {
        if (element.id === undefined) continue;
        if (elementIndexById.has(element.id)) {
            throw new LayoutError(`Element ID "${element.id}" is duplicated.`, { elementId: element.id });
        }
        elementIndexById.set(element.id, index);
    }

    const fitWidth = content.layout?.canvas.width;
    const fitHeight = content.layout?.canvas.height;
    const measurements = new Map<number, ModuleMeasurement>();
    const requiredMeasurements = new Set<number>();

    const requireElementById = (id: string, reason: string) => {
        const index = elementIndexById.get(id);
        if (index === undefined) {
            throw new LayoutError(`Cannot find element ID "${id}" referenced by ${reason}.`, { elementId: id, reason });
        }
        requiredMeasurements.add(index);
        return index;
    };

    for (const [index, element] of elements.entries()) {
        for (const axis of ["x", "y"] as const) {
            const reference = element.layout?.[axis];
            if (reference === undefined) continue;
            requiredMeasurements.add(index);
            if (reference.to !== CANVAS_ID) requireElementById(reference.to, `the ${axis}-axis anchor of "${element.id ?? element.type}"`);
        }
    }
    for (const contributor of fitWidth?.contributors ?? []) requireElementById(contributor, "canvas width contributors");
    for (const contributor of fitHeight?.contributors ?? []) requireElementById(contributor, "canvas height contributors");

    for (const index of requiredMeasurements) {
        const element = elements[index];
        const module = modules[element.type];
        let measurement: ModuleMeasurement | undefined;
        if (module?.measure !== undefined) {
            measurement = await module.measure(measurementCtx, theme, element as never, painterCtx);
        } else if (element.layout?.bounds !== undefined) {
            measurement = { bounds: element.layout.bounds };
        }
        if (measurement === undefined) {
            throw new LayoutError(`Element "${element.id ?? element.type}" must implement measure() or declare layout.bounds.`, {
                elementId: element.id,
                elementType: element.type,
            });
        }
        measurements.set(index, validateMeasurement(element, measurement));
    }

    const origins = {
        x: new Map<number, number>(),
        y: new Map<number, number>(),
    };
    const states = {
        x: new Map<number, ResolutionState>(),
        y: new Map<number, ResolutionState>(),
    };

    const resolveAxis = (index: number, axis: Axis): number => {
        const state = states[axis].get(index);
        if (state === "resolved") return origins[axis].get(index) as number;
        const element = elements[index];
        if (state === "visiting") {
            throw new LayoutError(`A dependency cycle was found while resolving the ${axis}-axis anchor of "${element.id ?? element.type}".`, {
                axis,
                elementId: element.id,
                elementType: element.type,
            });
        }

        states[axis].set(index, "visiting");
        const reference = element.layout?.[axis];
        let origin = element[axis];
        if (reference !== undefined) {
            const selfMeasurement = measurements.get(index);
            if (selfMeasurement === undefined) {
                throw new LayoutError(`Element "${element.id ?? element.type}" has a ${axis}-axis anchor but no measurement.`, {
                    axis,
                    elementId: element.id,
                });
            }

            let targetCoordinate: number;
            if (reference.to === CANVAS_ID) {
                const fitAxis = axis === "x" ? fitWidth : fitHeight;
                if (fitAxis !== undefined) {
                    throw new LayoutError(`Element "${element.id ?? element.type}" cannot reference $canvas on a fit-content ${axis}-axis.`, {
                        axis,
                        elementId: element.id,
                    });
                }
                const canvasSize = axis === "x" ? content.width : content.height;
                targetCoordinate = canvasSize * getAnchorFactor(reference.targetAnchor);
            } else {
                const targetIndex = requireElementById(reference.to, `the ${axis}-axis anchor of "${element.id ?? element.type}"`);
                const targetMeasurement = measurements.get(targetIndex);
                if (targetMeasurement === undefined) {
                    throw new LayoutError(`Anchor target "${reference.to}" has no measurement.`, { axis, elementId: reference.to });
                }
                const targetOrigin = resolveAxis(targetIndex, axis);
                const targetBounds = targetMeasurement.bounds;
                targetCoordinate =
                    targetOrigin + getAxisStart(targetBounds, axis) + getAxisSize(targetBounds, axis) * getAnchorFactor(reference.targetAnchor);
            }

            const selfBounds = selfMeasurement.bounds;
            const selfAnchor = getAxisStart(selfBounds, axis) + getAxisSize(selfBounds, axis) * getAnchorFactor(reference.selfAnchor);
            origin = targetCoordinate + reference.offset - selfAnchor;
        }

        origins[axis].set(index, origin);
        states[axis].set(index, "resolved");
        return origin;
    };

    for (const index of elements.keys()) {
        resolveAxis(index, "x");
        resolveAxis(index, "y");
    }

    const resolvedElements: ResolvedModuleLayout[] = elements.map((element, index) => {
        const originX = origins.x.get(index) as number;
        const originY = origins.y.get(index) as number;
        const measurement = measurements.get(index);
        return {
            bounds:
                measurement === undefined
                    ? undefined
                    : {
                          left: originX + measurement.bounds.left,
                          top: originY + measurement.bounds.top,
                          width: measurement.bounds.width,
                          height: measurement.bounds.height,
                      },
            canvas: {
                width: content.width,
                height: content.height,
            },
            measurement,
            translation: {
                x: originX - element.x,
                y: originY - element.y,
            },
        };
    });

    const resolveCanvasAxis = (axis: Axis) => {
        const fitAxis = axis === "x" ? fitWidth : fitHeight;
        const baseSize = axis === "x" ? content.width : content.height;
        if (fitAxis === undefined) return baseSize;

        let extent = 0;
        for (const contributor of fitAxis.contributors) {
            const index = elementIndexById.get(contributor) as number;
            const bounds = resolvedElements[index].bounds as LayoutBounds;
            if (bounds.left < 0 || bounds.top < 0) {
                throw new LayoutError(`Fit-content contributor "${contributor}" extends above or to the left of the canvas origin.`, {
                    elementId: contributor,
                    bounds,
                });
            }
            extent = Math.max(extent, getAxisStart(bounds, axis) + getAxisSize(bounds, axis));
        }

        const minimum = fitAxis.min ?? baseSize;
        const size = Math.ceil(Math.max(minimum, extent + fitAxis.padding));
        if (fitAxis.max !== undefined && size > fitAxis.max) {
            throw new LayoutError(`The resolved canvas ${axis === "x" ? "width" : "height"} ${size} exceeds the maximum ${fitAxis.max}.`, {
                axis,
                maximum: fitAxis.max,
                resolvedSize: size,
            });
        }
        return size;
    };

    const canvas = {
        width: resolveCanvasAxis("x"),
        height: resolveCanvasAxis("y"),
    };
    for (const resolvedElement of resolvedElements) resolvedElement.canvas = canvas;

    return {
        canvas,
        elements: resolvedElements,
    };
}
