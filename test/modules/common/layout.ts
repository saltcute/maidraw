import { resolveLayout } from "@common/painter/layout";
import { ImageModule } from "@common/painter/modules/image";
import { TextModule } from "@common/painter/modules/text";
import { type Bounds, Painter, PainterModule } from "@common/painter/painter";
import { Theme, ThemeManager } from "@common/painter/theme";
import { wrapTranslate } from "@common/utils/ctxWrapper";
import { logger, moduleTestWrapper } from "@utils/util";
import type { CanvasRenderingContext2D } from "canvas";
import { join } from "upath";
import z from "zod/v4";

/**
 * Stands in for a module drawing more than the dimensions declared in the theme.
 */
class GrowingBoxModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("growing-box"),
        width: z.number().min(1),
        height: z.number().min(1),
        growth: z.object({
            width: z.number().min(0),
            height: z.number().min(0),
        }),
    });
    public async getBounds(
        _ctx: CanvasRenderingContext2D,
        _theme: Theme<unknown>,
        element: z.infer<typeof GrowingBoxModule.SCHEMA>,
    ): Promise<Bounds> {
        return {
            x: element.x,
            y: element.y,
            width: element.width + element.growth.width,
            height: element.height + element.growth.height,
        };
    }
    public async draw(ctx: CanvasRenderingContext2D, theme: Theme<unknown>, element: z.infer<typeof GrowingBoxModule.SCHEMA>) {
        const bounds = await this.getBounds(ctx, theme, element);
        ctx.save();
        ctx.fillStyle = "#2f6feb99";
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(element.x, element.y, element.width, element.height);
        ctx.restore();
    }
}

const theme = new Theme(join(__dirname, "..", "..", "..", "assets", "themes", "maimai", "best50", "circleplus"), {
    name: "layout-test",
    displayName: "Layout test",
    width: 640,
    height: 320,
    layout: {
        contributors: ["box"],
    },
    elements: [
        {
            type: "growing-box",
            id: "box",
            x: 32,
            y: 32,
            width: 320,
            height: 160,
            growth: { width: 160, height: 80 },
        },
        {
            type: "text",
            x: 0,
            y: 36,
            size: 28,
            content: "bottom left of the box",
            anchor: { id: "box", location: "bottom_left" },
        },
        {
            type: "image",
            x: 16,
            y: 0,
            height: 96,
            path: "assets/logo.webp",
            anchor: { id: "box", location: "top_right" },
        },
        {
            type: "text",
            x: -16,
            y: -16,
            size: 24,
            align: "right",
            content: "bottom right of the canvas",
            anchor: { id: ThemeManager.CANVAS_ANCHOR_ID, location: "bottom_right" },
        },
        {
            type: "text",
            x: 544,
            y: 200,
            size: 24,
            content: "no anchor",
        },
    ],
});

const modules: Record<string, PainterModule> = {
    "growing-box": new GrowingBoxModule(),
    text: new TextModule(),
    image: new ImageModule(),
};

(async () => {
    Painter.registerFonts("assets");

    const layout = await resolveLayout({
        theme,
        modules,
        painterCtx: {},
        size: { width: theme.content.width, height: theme.content.height },
        contributors: theme.content.layout.contributors,
    });

    logger.info(`Declared ${theme.content.width}x${theme.content.height}, resolved ${layout.width}x${layout.height}`);
    for (const { type, offset } of layout.elements) {
        logger.info(`${type} anchored at (${offset.x}, ${offset.y})`);
    }

    await moduleTestWrapper(layout.width, layout.height, true, async (canvas) => {
        const ctx = canvas.getContext("2d");
        for (const { element, type, offset } of layout.elements) {
            const module = modules[type];
            if (!module) continue;
            await wrapTranslate(ctx, offset.x, offset.y, () => module.draw(ctx, theme, element, {}));
        }
        return canvas;
    });
})();
