import type {
    CanvasGradient,
    CanvasPattern,
    CanvasRenderingContext2D,
    TextMetrics,
} from "canvas";
import { fillTextWithTwemoji } from "node-canvas-with-twemoji-and-discord-emoji";

export function drawText(
    ctx: CanvasRenderingContext2D,
    str: string,
    x: number,
    y: number,
    fontSize: number,
    /**
     * Line width of the text stroke.
     */
    linewidth: number,
    {
        /**
         * Max width of the text block.
         */
        maxWidth = Infinity,
        textAlign = "left",
        mainColor = "white",
        borderColor = "black",
        font = `"standard-font-title-latin", "standard-font-title-jp"`,
        lineBreakSuffix = "...",
        widthConstraintType = "cut",
        shrinkAnchor = "bottom",
        shrinkMinFontSize = 4,
    }: {
        maxWidth?: number;
        textAlign?: "left" | "center" | "right";
        mainColor?: string | CanvasGradient | CanvasPattern;
        borderColor?: string | CanvasGradient | CanvasPattern;
        font?: string;
        lineBreakSuffix?: string;
        widthConstraintType?: "shrink-cut" | "cut" | "shrink" | "none";
        shrinkAnchor?: "top" | "center" | "bottom";
        shrinkMinFontSize?: number;
    },
) {
    ctx.font = `${fontSize}px ${font}`;
    if (
        widthConstraintType === "shrink" ||
        widthConstraintType === "shrink-cut"
    ) {
        let fs = fontSize;
        for (; fs >= shrinkMinFontSize; fs--) {
            const measurement = measureText(ctx, str, fs, Infinity, font);
            if (measurement.width <= maxWidth) break;
        }
        const measurement = measureText(ctx, str, fs, Infinity, font);
        const originalMesurement = measureText(
            ctx,
            str,
            fontSize,
            Infinity,
            font,
        );
        const originalHeight =
            originalMesurement.actualBoundingBoxAscent +
            originalMesurement.actualBoundingBoxDescent;
        const newHeight =
            measurement.actualBoundingBoxAscent +
            measurement.actualBoundingBoxDescent;
        if (shrinkAnchor === "top") {
            y -= originalHeight;
            y += newHeight;
        } else if (shrinkAnchor === "center") {
            y -= (originalHeight - newHeight) / 2;
        }
        fontSize = fs;
    }
    ctx.font = `${fontSize}px ${font}`;
    if (widthConstraintType === "cut" || widthConstraintType === "shrink-cut")
        str = findMaxFitString(ctx, str, maxWidth, lineBreakSuffix);
    if (linewidth > 0) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = linewidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.textAlign = textAlign;
        ctx.strokeText(str, x, y);
    }
    ctx.fillStyle = mainColor;
    ctx.textAlign = textAlign;
    ctx.fillText(str, x, y);
    if (linewidth > 0) {
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = linewidth / 8;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.font = `${fontSize}px ${font}`;
        ctx.textAlign = textAlign;
        ctx.strokeText(str, x, y);
    }
}
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
            drawText(
                ctx,
                char,
                width * (3 / 16),
                width * (3 / 16),
                fontSize,
                linewidth,
                {
                    textAlign: "left",
                    mainColor,
                    borderColor,
                    font,
                },
            );
            ctx.restore();
            curY += width + verticalSpacing;
        }
    }
}
export async function drawEmojiOrGlyph(
    ctx: CanvasRenderingContext2D,
    str: string,
    x: number,
    y: number,
    fontSize: number,
    /**
     * Line width of the text stroke.
     */
    maxWidth: number,
    textAlign: "left" | "center" | "right" = "left",
    mainColor: string | CanvasGradient | CanvasPattern = "white",
    font: string = `"standard-font-title-latin", "standard-font-title-jp"`,
    lineBreakSuffix = "...",
) {
    ctx.font = `${fontSize}px ${font}`;
    str = findMaxFitString(ctx, str, maxWidth, lineBreakSuffix);

    ctx.textDrawingMode = "glyph";
    ctx.fillStyle = mainColor;
    ctx.font = `${fontSize}px ${font}`;
    ctx.textAlign = textAlign;
    await fillTextWithTwemoji(ctx, str, x, y);
    ctx.textDrawingMode = "path";
}
export function measureText(
    ctx: CanvasRenderingContext2D,
    original: string,
    fontSize: number,
    maxWidth: number,
    font: string = `"standard-font-title-latin", "standard-font-title-jp"`,
): TextMetrics {
    ctx.font = `${fontSize}px ${font}`;
    const metrics = ctx.measureText(
        findMaxFitString(ctx, original, maxWidth, "..."),
    );
    return metrics;
}
export function visibleLength(str: string) {
    return [...new Intl.Segmenter().segment(str)].length;
}
export function capitalize(str: string) {
    const strarr = [...str];
    strarr[0] = strarr[0].toUpperCase();
    return strarr.join("");
}
export function findMaxFitString(
    ctx: CanvasRenderingContext2D,
    original: string,
    maxWidth: number,
    lineBreakSuffix = "...",
): string {
    const metrics = ctx.measureText(original);
    if (metrics.width <= maxWidth) return original;
    for (let i = original.length; i >= 0; --i) {
        let cur = original.slice(0, i);
        if (ctx.measureText(cur + lineBreakSuffix).width <= maxWidth) {
            // Trim full-width spaces.
            while (cur[cur.length - 1] === "　") {
                cur = cur.substring(0, cur.length - 1);
            }
            while (cur[0] === "　") {
                cur = cur.substring(1, cur.length);
            }
            return cur.trim() + lineBreakSuffix;
        }
    }
    return original;
}
