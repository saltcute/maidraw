import { safeLoadImage } from "@common/utils/loadImage";
import type { CanvasRenderingContext2D } from "canvas";
import z from "zod/v4";
import { PainterModule } from "../painter";
import { type Theme, ThemeManager } from "../theme";

export class ImageModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("image"),
        width: z.number().min(1).optional(),
        height: z.number().min(1).optional(),
        anchor: z
            .literal([
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
            ])
            .optional(),
        path: z.string(),
    });
    public async draw(ctx: CanvasRenderingContext2D, theme: Theme<unknown>, element: z.infer<typeof ImageModule.SCHEMA>) {
        const img = await safeLoadImage(theme.getFile(element.path));
        const { width: imgWidth, height: imgHeight } = img;
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
        ctx.save();
        switch (element.anchor) {
            case "ct":
            case "mt":
                ctx.translate(-width / 2, 0);
                break;
            case "rt":
                ctx.translate(-width, 0);
                break;
            case "lc":
            case "lm":
                ctx.translate(0, -height / 2);
                break;
            case "cc":
            case "mc":
            case "cm":
            case "mm":
                ctx.translate(-width / 2, -height / 2);
                break;
            case "rm":
                ctx.translate(-width, -height / 2);
                break;
            case "lb":
                ctx.translate(0, -height);
                break;
            case "mb":
            case "cb":
                ctx.translate(-width / 2, -height);
                break;
            case "rb":
                ctx.translate(-width, -height);
                break;
        }
        ctx.drawImage(img, element.x, element.y, width, height);
        ctx.restore();
    }
}
