import { globalLogger } from "@saltcute/logger";
import { Canvas, type CanvasRenderingContext2D } from "canvas";
import z from "zod/v4";
import type { Bounds, PainterModule } from "./painter";
import { type Theme, ThemeManager } from "./theme";

const logger = globalLogger.child().withPrefix(`[${["maidraw", "painter", "layout"].join("/")}]`);

const ORIGIN = { x: 0, y: 0 } as const;

const LAYOUT_ELEMENT = z.object({
    type: z.string(),
    id: z.string().optional(),
    anchor: ThemeManager.ANCHOR.optional(),
});

const LAYOUT_CONTENT = z.object({
    elements: z.array(z.unknown()).default([]),
});

export interface ResolvedElement {
    /**
     * The element as it is declared in the theme.
     */
    element: unknown;
    type: string;
    /**
     * Position of the anchor of the element. The element draws relative to it.
     */
    offset: { x: number; y: number };
}

export interface ResolvedLayout {
    width: number;
    height: number;
    /**
     * Elements in the order they are declared in the theme.
     */
    elements: ResolvedElement[];
}

function getAnchorPoint(bounds: Bounds, location: z.infer<typeof ThemeManager.ANCHOR_LOCATION>) {
    return {
        x: location === "top_right" || location === "bottom_right" ? bounds.x + bounds.width : bounds.x,
        y: location === "bottom_left" || location === "bottom_right" ? bounds.y + bounds.height : bounds.y,
    };
}

/**
 * Resolve the dimensions of the canvas and the position of the anchor of every element.
 *
 * Only elements referenced as an anchor or as a layout contributor are measured,
 * themes that use neither resolve without calling into any module.
 */
export async function resolveLayout({
    theme,
    modules,
    painterCtx,
    size,
    contributors = [],
}: {
    theme: Theme<unknown>;
    modules: Record<string, PainterModule>;
    painterCtx: unknown;
    /**
     * Minimum dimensions of the canvas, as declared in the theme.
     */
    size: { width: number; height: number };
    contributors?: string[];
}): Promise<ResolvedLayout> {
    const elements = LAYOUT_CONTENT.safeParse(theme.content).data?.elements ?? [];
    const metadata = elements.map((element) => LAYOUT_ELEMENT.safeParse(element).data);

    const indexById = new Map<string, number>();
    metadata.forEach((element, index) => {
        const id = element?.id;
        if (id === undefined || id === ThemeManager.CANVAS_ANCHOR_ID || indexById.has(id)) return;
        indexById.set(id, index);
    });

    let measureContext: CanvasRenderingContext2D | undefined;
    const measurements = new Map<number, Promise<{ bounds: Bounds; minimumBounds: Bounds }>>();
    function measure(index: number) {
        const cached = measurements.get(index);
        if (cached) return cached;
        const measurement = (async () => {
            const empty = { bounds: { ...ORIGIN, width: 0, height: 0 }, minimumBounds: { ...ORIGIN, width: 0, height: 0 } };
            const type = metadata[index]?.type;
            const module = type === undefined ? undefined : modules[type];
            if (!module) return empty;
            measureContext ??= new Canvas(1, 1).getContext("2d");
            try {
                return {
                    bounds: await module.getBounds(measureContext, theme, elements[index], painterCtx),
                    minimumBounds: await module.getMinimumBounds(measureContext, theme, elements[index], painterCtx),
                };
            } catch (e) {
                logger.withError(e).error(`Failed to measure the bounds of the ${type} element at index ${index}.`);
                return empty;
            }
        })();
        measurements.set(index, measurement);
        return measurement;
    }

    let growthX = 0;
    let growthY = 0;
    for (const contributor of contributors) {
        const index = indexById.get(contributor);
        if (index === undefined) continue;
        const { bounds, minimumBounds } = await measure(index);
        growthX += Math.max(0, bounds.width - minimumBounds.width);
        growthY += Math.max(0, bounds.height - minimumBounds.height);
    }
    const canvas: Bounds = { ...ORIGIN, width: size.width + growthX, height: size.height + growthY };

    const offsets = new Map<number, { x: number; y: number }>();
    const resolving = new Set<number>();
    async function resolveOffset(index: number): Promise<{ x: number; y: number }> {
        const cached = offsets.get(index);
        if (cached) return cached;

        const anchor = metadata[index]?.anchor;
        const offset = await (async () => {
            if (anchor === undefined) return ORIGIN;
            const target = anchor.id === ThemeManager.CANVAS_ANCHOR_ID ? undefined : indexById.get(anchor.id);
            if (target === undefined) {
                if (anchor.id !== ThemeManager.CANVAS_ANCHOR_ID) {
                    logger.error(`Cannot anchor the element at index ${index} to the unknown id ${anchor.id}. Anchoring it to the canvas instead.`);
                    return ORIGIN;
                }
                return getAnchorPoint(canvas, anchor.location);
            }
            if (resolving.has(target)) {
                logger.error(`Cannot anchor the element at index ${index} to the id ${anchor.id}, the anchors form a cycle.`);
                return ORIGIN;
            }
            resolving.add(index);
            const targetOffset = await resolveOffset(target);
            resolving.delete(index);
            const { bounds } = await measure(target);
            return getAnchorPoint(
                {
                    x: targetOffset.x + bounds.x,
                    y: targetOffset.y + bounds.y,
                    width: bounds.width,
                    height: bounds.height,
                },
                anchor.location,
            );
        })();

        offsets.set(index, offset);
        return offset;
    }

    const resolved: ResolvedElement[] = [];
    for (let index = 0; index < elements.length; ++index) {
        const type = metadata[index]?.type;
        if (type === undefined) continue;
        resolved.push({
            element: elements[index],
            type,
            offset: await resolveOffset(index),
        });
    }

    return {
        width: canvas.width,
        height: canvas.height,
        elements: resolved,
    };
}
