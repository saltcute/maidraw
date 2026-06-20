import type { CanvasGradient, CanvasPattern, CanvasRenderingContext2D, CanvasTextAlign, CanvasTextBaseline } from "canvas";
import LineBreaker from "linebreak";
import stringFormat from "string-template";
import { wrapContext } from "../ctxWrapper";
import { findMaxFitString, measureText } from "./utils";

export function drawText(
    ctx: CanvasRenderingContext2D,
    content: string,
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
        templateVariables = {},
        textBaseLine = "alphabetic",
    }: {
        maxWidth?: number;
        textAlign?: CanvasTextAlign;
        mainColor?: string | CanvasGradient | CanvasPattern;
        borderColor?: string | CanvasGradient | CanvasPattern;
        font?: string;
        lineBreakSuffix?: string;
        widthConstraintType?: "break-lines" | "shrink-cut" | "cut" | "shrink" | "none";
        shrinkAnchor?: "top" | "center" | "bottom";
        shrinkMinFontSize?: number;
        templateVariables?: Record<string, string>;
        textBaseLine?: CanvasTextBaseline;
    },
) {
    return wrapContext(ctx, () => {
        ctx.textBaseline = textBaseLine;

        let filledContent = stringFormat(content, templateVariables);
        if (widthConstraintType === "shrink" || widthConstraintType === "shrink-cut") {
            let fs = fontSize;
            for (; fs >= shrinkMinFontSize; fs--) {
                const measurement = measureText(ctx, filledContent, fs, Infinity, font);
                if (measurement.width <= maxWidth) break;
            }
            const measurement = measureText(ctx, filledContent, fs, Infinity, font);
            const originalMesurement = measureText(ctx, filledContent, fontSize, Infinity, font);
            const originalHeight = originalMesurement.actualBoundingBoxAscent + originalMesurement.actualBoundingBoxDescent;
            const newHeight = measurement.actualBoundingBoxAscent + measurement.actualBoundingBoxDescent;
            if (shrinkAnchor === "top") {
                y -= originalHeight;
                y += newHeight;
            } else if (shrinkAnchor === "center") {
                y -= (originalHeight - newHeight) / 2;
            }
            fontSize = fs;
        }
        if (widthConstraintType === "cut" || widthConstraintType === "shrink-cut") {
            filledContent = findMaxFitString(ctx, filledContent, maxWidth, lineBreakSuffix);
        }
        ctx.font = `${fontSize}px ${font}`;
        const lines: string[] = [];
        if (widthConstraintType === "break-lines") {
            const breaker = new LineBreaker(filledContent);
            let lastPossibleBreak = 0,
                lastBreak = 0;
            for (let bk = breaker.nextBreak(); bk; ) {
                const cur = filledContent.substring(lastBreak, bk.position);
                if (ctx.measureText(cur).width > maxWidth) {
                    lines.push(filledContent.substring(lastBreak, lastPossibleBreak).trim());
                    lastBreak = lastPossibleBreak;
                } else {
                    lastPossibleBreak = bk.position;
                    bk = breaker.nextBreak();
                }
            }
            lines.push(filledContent.substring(lastBreak).trim());
        } else if (widthConstraintType !== "none") {
            const naiveLines = filledContent.split("\n");
            for (const originalContent of naiveLines) {
                lines.push(findMaxFitString(ctx, originalContent, maxWidth || Infinity).trim());
            }
        } else {
            lines.push(filledContent);
        }
        for (let i = 0; i < lines.length; ++i) {
            const line = lines[i];
            const curY = y + i * fontSize * 1.3;
            if (linewidth > 0) {
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = linewidth;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.textAlign = textAlign;
                ctx.strokeText(line, x, curY);
            }
            ctx.fillStyle = mainColor;
            ctx.textAlign = textAlign;
            ctx.fillText(line, x, curY);
            if (linewidth > 0) {
                ctx.strokeStyle = mainColor;
                ctx.lineWidth = linewidth / 8;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.font = `${fontSize}px ${font}`;
                ctx.textAlign = textAlign;
                ctx.strokeText(line, x, curY);
            }
        }
    });
}
