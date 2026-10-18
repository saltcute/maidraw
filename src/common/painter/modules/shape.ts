import { wrapContext } from "@common/utils/ctxWrapper";
import { color } from "@common/utils/zod";
import type { CanvasRenderingContext2D } from "canvas";
import z from "zod/v4";
import { type Bounds, type DrawLayout, PainterModule } from "../painter";
import { type Theme, ThemeManager } from "../theme";

/**
 * A fixed length, or `canvas` to extend from the position of the element to the edge of the canvas.
 */
const EXTENT = z.union([z.number().min(0), z.literal("canvas")]);

const POINT = z.object({
    x: z.number(),
    y: z.number(),
});

export class ShapeModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("shape"),
        fill: color().optional(),
        stroke: z
            .object({
                color: color(),
                width: z.number().min(0),
            })
            .optional(),
        opacity: z.number().min(0).max(1).optional(),
        shape: z.discriminatedUnion("kind", [
            /**
             * The position of the element is the top left corner.
             */
            z.object({
                kind: z.literal("rectangle"),
                width: EXTENT,
                height: EXTENT,
                radius: z.number().min(0).optional(),
            }),
            /**
             * The position of the element is the center.
             */
            z.object({
                kind: z.literal("circle"),
                radius: z.number().min(0),
            }),
            /**
             * The position of the element is the center.
             */
            z.object({
                kind: z.literal("ellipse"),
                radiusX: z.number().min(0),
                radiusY: z.number().min(0),
            }),
            /**
             * Drawn from the position of the element to `to`, relative to the position of the element. Only stroked.
             */
            z.object({
                kind: z.literal("line"),
                to: POINT,
            }),
            /**
             * Points relative to the position of the element.
             */
            z.object({
                kind: z.literal("polygon"),
                points: z.array(POINT).min(3),
            }),
        ]),
    });
    private resolveExtent(extent: z.infer<typeof EXTENT>, position: number, offset?: number, canvas?: number) {
        if (extent !== "canvas") return extent;
        if (offset === undefined || canvas === undefined) return 0;
        return Math.max(0, canvas - (offset + position));
    }
    private getShapeBounds(element: z.infer<typeof ShapeModule.SCHEMA>, layout?: DrawLayout): Bounds {
        const shape = element.shape;
        switch (shape.kind) {
            case "rectangle":
                return {
                    x: element.x,
                    y: element.y,
                    width: this.resolveExtent(shape.width, element.x, layout?.offset.x, layout?.canvas.width),
                    height: this.resolveExtent(shape.height, element.y, layout?.offset.y, layout?.canvas.height),
                };
            case "circle":
                return { x: element.x - shape.radius, y: element.y - shape.radius, width: shape.radius * 2, height: shape.radius * 2 };
            case "ellipse":
                return { x: element.x - shape.radiusX, y: element.y - shape.radiusY, width: shape.radiusX * 2, height: shape.radiusY * 2 };
            case "line":
            case "polygon": {
                const points = shape.kind === "line" ? [{ x: 0, y: 0 }, shape.to] : shape.points;
                const xs = points.map((point) => point.x);
                const ys = points.map((point) => point.y);
                const minX = Math.min(...xs);
                const minY = Math.min(...ys);
                return { x: element.x + minX, y: element.y + minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
            }
        }
    }
    private tracePath(ctx: CanvasRenderingContext2D, element: z.infer<typeof ShapeModule.SCHEMA>, layout?: DrawLayout) {
        const shape = element.shape;
        ctx.beginPath();
        switch (shape.kind) {
            case "rectangle": {
                const { x, y, width, height } = this.getShapeBounds(element, layout);
                if (shape.radius) ctx.roundRect(x, y, width, height, shape.radius);
                else ctx.rect(x, y, width, height);
                return;
            }
            case "circle":
                ctx.arc(element.x, element.y, shape.radius, 0, Math.PI * 2);
                return;
            case "ellipse":
                ctx.ellipse(element.x, element.y, shape.radiusX, shape.radiusY, 0, 0, Math.PI * 2);
                return;
            case "line":
                ctx.moveTo(element.x, element.y);
                ctx.lineTo(element.x + shape.to.x, element.y + shape.to.y);
                return;
            case "polygon": {
                const [first, ...rest] = shape.points;
                ctx.moveTo(element.x + first.x, element.y + first.y);
                for (const point of rest) ctx.lineTo(element.x + point.x, element.y + point.y);
                ctx.closePath();
                return;
            }
        }
    }
    public async draw(
        ctx: CanvasRenderingContext2D,
        _theme: Theme<unknown>,
        element: z.infer<typeof ShapeModule.SCHEMA>,
        _painterCtx?: unknown,
        layout?: DrawLayout,
    ) {
        wrapContext(ctx, () => {
            if (element.opacity !== undefined) ctx.globalAlpha = element.opacity;
            this.tracePath(ctx, element, layout);
            if (element.fill && element.shape.kind !== "line") {
                ctx.fillStyle = element.fill;
                ctx.fill();
            }
            if (element.stroke && element.stroke.width > 0) {
                ctx.strokeStyle = element.stroke.color;
                ctx.lineWidth = element.stroke.width;
                ctx.stroke();
            }
        });
    }
    /**
     * An extent of `canvas` is measured as 0, the canvas is not resolved yet while measuring.
     */
    public async getBounds(_ctx: CanvasRenderingContext2D, _theme: Theme<unknown>, element: z.infer<typeof ShapeModule.SCHEMA>): Promise<Bounds> {
        return this.getShapeBounds(element);
    }
    public async getMinimumBounds(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ShapeModule.SCHEMA>,
    ): Promise<Bounds> {
        return this.getBounds(ctx, theme, element);
    }
}
