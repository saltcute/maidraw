import { drawText } from "@common/utils/textDraw/drawText";
import { color } from "@common/utils/zod";
import type { CanvasRenderingContext2D } from "canvas";
import Color from "color";
import z from "zod/v4";
import { PainterModule } from "../painter";
import { ThemeManager } from "../theme";

export interface TextModulePainterContext {
    variables?: Record<string, string>;
}

export class TextModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("text"),
        size: z.number().min(1),
        content: z.string(),
        width: z.number().min(1).optional(),
        height: z.number().min(1).optional(),
        linebreak: z.boolean().optional(),
        align: z.enum(["left", "center", "right"]).optional(),
        color: color().optional(),
        borderColor: color().optional(),
        font: z.string().optional(),
    });
    private readonly dateFormat = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
    });
    private readonly timeFormat = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        timeStyle: "medium",
        hourCycle: "h23",
    });
    public async draw(
        ctx: CanvasRenderingContext2D,
        _: unknown,
        element: z.infer<typeof TextModule.SCHEMA>,
        painterCtx: TextModulePainterContext = {},
    ) {
        const date = new Date();
        const builtinVariables: Record<string, string> = {
            date: this.dateFormat.format(date),
            time: this.timeFormat.format(date),
            dateTime: `${this.dateFormat.format(date)} ${this.timeFormat.format(date)} JST`,
        };
        drawText(ctx, element.content, element.x, element.y, element.size, element.size / 3.5, {
            maxWidth: element.width || Infinity,
            textAlign: element.align,
            mainColor: element.color || "#FFFFFF",
            borderColor: element.borderColor
                ? element.borderColor
                : Color.rgb(element.color || "#FFFFFF")
                      .darken(0.3)
                      .hex(),
            font: element.font,
            lineBreakSuffix: element.linebreak ? "" : "...",
            widthConstraintType: element.linebreak ? "break-lines" : "cut",
            templateVariables: {
                ...builtinVariables,
                ...painterCtx.variables,
            },
        });
    }
}
