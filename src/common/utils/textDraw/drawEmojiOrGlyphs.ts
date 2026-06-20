import type { CanvasGradient, CanvasPattern, CanvasRenderingContext2D, CanvasTextAlign, CanvasTextBaseline } from "canvas";
import { fillTextWithTwemoji } from "node-canvas-with-twemoji-and-discord-emoji";
import { findMaxFitString } from "./utils";
export async function drawEmojiOrGlyph(
    ctx: CanvasRenderingContext2D,
    str: string,
    x: number,
    y: number,
    fontSize: number,
    {
        maxWidth = Infinity,
        textAlign = "left",
        textBaseline = "alphabetic",
        mainColor = "white",
        font = `"standard-font-title-latin", "standard-font-title-jp"`,
        lineBreakSuffix = "...",
    }: {
        maxWidth?: number;
        textAlign?: CanvasTextAlign;
        textBaseline?: CanvasTextBaseline;
        mainColor?: string | CanvasGradient | CanvasPattern;
        font?: string;
        lineBreakSuffix?: string;
    },
) {
    ctx.font = `${fontSize}px ${font}`;
    str = findMaxFitString(ctx, str, maxWidth, lineBreakSuffix);

    ctx.textBaseline = textBaseline;
    ctx.textDrawingMode = "glyph";
    ctx.fillStyle = mainColor;
    ctx.font = `${fontSize}px ${font}`;
    ctx.textAlign = textAlign;
    await fillTextWithTwemoji(ctx, str, x, y);
    ctx.textDrawingMode = "path";
}
