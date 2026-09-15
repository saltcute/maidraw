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
            const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
            let lastBreak = 0;
            let line = "";
            for (let bk = breaker.nextBreak(); bk; bk = breaker.nextBreak()) {
                const segment = filledContent.substring(lastBreak, bk.position);
                lastBreak = bk.position;
                // The iterator does not mark a hard break at the end of the input as required.
                const hardBreak = bk.required || /[\n\r\v\f\u0085\u2028\u2029]$/u.test(segment);
                const text = segment.replace(/[\n\r\v\f\u0085\u2028\u2029]+$/u, "");
                if (ctx.measureText((line + text).trim()).width <= maxWidth) {
                    line += text;
                } else {
                    if (line.trim()) {
                        lines.push(line.trim());
                    }
                    line = "";
                    // Split oversized words without splitting emoji or combining sequences.
                    // A grapheme wider than maxWidth occupies a line on its own.
                    for (const { segment: grapheme } of segmenter.segment(text.trimStart())) {
                        if (line && ctx.measureText(line + grapheme).width > maxWidth) {
                            lines.push(line.trim());
                            line = "";
                        }
                        line += grapheme;
                    }
                }
                if (hardBreak) {
                    lines.push(line.trim());
                    line = "";
                }
            }
            lines.push(line.trim());
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
