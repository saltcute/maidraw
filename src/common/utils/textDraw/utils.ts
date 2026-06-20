import type { CanvasRenderingContext2D, TextMetrics } from "canvas";
import { wrapContext } from "../ctxWrapper";

export function measureText(
    ctx: CanvasRenderingContext2D,
    original: string,
    fontSize: number,
    maxWidth: number,
    font: string = `"standard-font-title-latin", "standard-font-title-jp"`,
): TextMetrics {
    return wrapContext(ctx, () => {
        ctx.font = `${fontSize}px ${font}`;
        const metrics = ctx.measureText(findMaxFitString(ctx, original, maxWidth, "..."));
        return metrics;
    });
}
export function visibleLength(str: string) {
    return [...new Intl.Segmenter().segment(str)].length;
}
export function capitalize(str: string) {
    const strarr = [...str];
    strarr[0] = strarr[0].toUpperCase();
    return strarr.join("");
}
export function findMaxFitString(ctx: CanvasRenderingContext2D, original: string, maxWidth: number, lineBreakSuffix = "..."): string {
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
