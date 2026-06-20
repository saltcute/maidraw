import type { CanvasGradient, CanvasPattern, CanvasRenderingContext2D } from "canvas";
import { drawText } from "./drawText";

export function drawVerticalText(
    ctx: CanvasRenderingContext2D,
    str: string,
    x: number,
    y: number,
    fontSize: number,
    /**
     * Line width of the text stroke.
     */
    linewidth: number,
    mainColor: string | CanvasGradient | CanvasPattern = "white",
    borderColor: string | CanvasGradient | CanvasPattern = "black",
    font: string = `"standard-font-title-latin", "standard-font-title-jp"`,
) {
    let curX = x,
        curY = y;
    const verticalSpacing = -6;
    const horizontalSpacing = 10;
    for (let i = 0; i < str.length; i++) {
        const char = str.slice(i, i + 1).toString();
        if (char === "\n") {
            curY = y;
            curX -= fontSize + horizontalSpacing;
            continue;
        }
        if (!char.match(/[0-9a-zA-Z「」ー～…]/)) {
            ctx.save();
            ctx.textBaseline = "top";
            drawText(ctx, char, curX, curY, fontSize, linewidth, {
                textAlign: "left",
                mainColor,
                borderColor,
                font,
            });
            ctx.restore();
            curY += ctx.measureText(char).width + verticalSpacing;
        } else {
            ctx.save();
            ctx.translate(curX, curY);
            ctx.rotate((90 * Math.PI) / 180);
            ctx.textBaseline = "bottom";
            const width = ctx.measureText(char).width;
            drawText(ctx, char, width * (3 / 16), width * (3 / 16), fontSize, linewidth, {
                textAlign: "left",
                mainColor,
                borderColor,
                font,
            });
            ctx.restore();
            curY += width + verticalSpacing;
        }
    }
}
