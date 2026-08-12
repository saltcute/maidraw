import { safeLoadImage } from "@common/utils/loadImage";
import type { CanvasRenderingContext2D, Image } from "canvas";
import z from "zod/v4";
import { type Bounds, PainterModule } from "../painter";
import { type Theme, ThemeManager } from "../theme";

const ALIGNMENT = z.literal([
    "lt",
    "ct",
    "rt",
    "lc",
    "cc",
    "rc",
    "lb",
    "cb",
    "rb",
    // Center vs Middle
    "mt",
    "mc",
    "mb",
    "lm",
    "cm",
    "rm",
    "mm",
]);

export class ImageModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("image"),
        width: z.number().min(1).optional(),
        height: z.number().min(1).optional(),
        /**
         * Corner of the image placed at the position of the element. Defaults to the top left corner.
         */
        align: ALIGNMENT.optional(),
        path: z.string(),
    });
    private getAlignOffset(align: z.infer<typeof ALIGNMENT> | undefined, width: number, height: number) {
        switch (align) {
            case "ct":
            case "mt":
                return { x: -width / 2, y: 0 };
            case "rt":
                return { x: -width, y: 0 };
            case "lc":
            case "lm":
                return { x: 0, y: -height / 2 };
            case "cc":
            case "mc":
            case "cm":
            case "mm":
                return { x: -width / 2, y: -height / 2 };
            case "rm":
                return { x: -width, y: -height / 2 };
            case "lb":
                return { x: 0, y: -height };
            case "mb":
            case "cb":
                return { x: -width / 2, y: -height };
            case "rb":
                return { x: -width, y: -height };
            default:
                return { x: 0, y: 0 };
        }
    }
    private async getImage(theme: Theme<unknown>, element: z.infer<typeof ImageModule.SCHEMA>): Promise<Bounds & { image: Image }> {
        const image = await safeLoadImage(theme.getFile(element.path));
        const { width: imgWidth, height: imgHeight } = image;
        const aspectRatio = imgWidth / imgHeight;
        let width: number, height: number;
        if (element.width && element.height) {
            width = element.width;
            height = element.height;
        } else if (element.width) {
            width = element.width;
            height = width / aspectRatio;
        } else if (element.height) {
            height = element.height;
            width = height * aspectRatio;
        } else {
            width = imgWidth;
            height = imgHeight;
        }
        const offset = this.getAlignOffset(element.align, width, height);
        return {
            image,
            x: element.x + offset.x,
            y: element.y + offset.y,
            width,
            height,
        };
    }
    public async draw(ctx: CanvasRenderingContext2D, theme: Theme<unknown>, element: z.infer<typeof ImageModule.SCHEMA>) {
        const { image, x, y, width, height } = await this.getImage(theme, element);
        ctx.drawImage(image, x, y, width, height);
    }
    public async getBounds(_ctx: CanvasRenderingContext2D, theme: Theme<unknown>, element: z.infer<typeof ImageModule.SCHEMA>): Promise<Bounds> {
        const { x, y, width, height } = await this.getImage(theme, element);
        return { x, y, width, height };
    }
    public async getMinimumBounds(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ImageModule.SCHEMA>,
    ): Promise<Bounds> {
        return this.getBounds(ctx, theme, element);
    }
}
