import {
    CanvasGradient,
    CanvasPattern,
    CanvasRenderingContext2D,
    loadImage,
    TextMetrics,
} from "canvas";
import _ from "lodash";
import Color from "color";
import Bunyan from "bunyan";
import { fillTextWithTwemoji } from "node-canvas-with-twemoji-and-discord-emoji";

import { z as zod } from "zod/v4";
import sharp from "sharp";

export class Util {
    /**
     * Pretty much ignores percision loss.
     */
    static truncate(payload: number, percision: number): string {
        const str = payload.toString();
        let [int, dec] = str.split(".");
        if (!int) int = "";
        if (!dec) dec = "";
        if (percision <= 0) return int;
        return `${int}.${dec.substring(0, percision).padEnd(percision, "0")}`;
    }
    static truncateNumber(payload: number, percision: number): number {
        return parseFloat(this.truncate(payload, percision));
    }
    /**
     * Dirty implementation, pretty much ignores percision loss.
     */
    static ceilWithPercision(payload: number, percision: number): string {
        const str = payload.toString();
        let [int, dec] = str.split(".");
        if (!int) int = "";
        if (!dec) {
            if (percision <= 0) return int + "";
            else return `${int}.${"0".repeat(percision)}`;
        } else {
            if (percision <= 0) return parseInt(int) + 1 + "";
            else {
                if (dec.length < percision)
                    return `${int}.${dec.padEnd(percision, "0")}`;
                const result = Math.ceil(
                    parseFloat(
                        `${int}${dec.substring(0, percision)}.${dec.substring(percision)}`
                    )
                ).toString();
                if (result.length < percision) return result;
                return `${result.substring(
                    0,
                    result.length - percision
                )}.${result.substring(result.length - percision)}`;
            }
        }
    }

    static findMaxFitString(
        ctx: CanvasRenderingContext2D,
        original: string,
        maxWidth: number,
        lineBreakSuffix = "..."
    ): string {
        const metrics = ctx.measureText(original);
        if (metrics.width <= maxWidth) return original;
        for (let i = original.length; i >= 0; --i) {
            let cur = original.slice(0, i);
            if (ctx.measureText(cur + lineBreakSuffix).width <= maxWidth) {
                // Trim full-width spaces.
                while (cur[cur.length - 1] == "　") {
                    cur = cur.substring(0, cur.length - 1);
                }
                while (cur[0] == "　") {
                    cur = cur.substring(1, cur.length);
                }
                return cur.trim() + lineBreakSuffix;
            }
        }
        return original;
    }
    static async loadImage(src: Buffer) {
        let safeImage: Buffer;
        try {
            safeImage = await sharp(src).png().toBuffer();
        } catch {
            const unitSize = 16,
                unitCount = 8,
                channels = 4;
            safeImage = Buffer.alloc(
                unitSize * unitSize * unitCount * unitCount * channels
            );
            for (let i = 0; i < unitCount; ++i) {
                for (let j = 0; j < unitCount; ++j) {
                    for (let x = i * unitSize; x < (i + 1) * unitSize; ++x) {
                        for (
                            let y = j * unitSize;
                            y < (j + 1) * unitSize;
                            ++y
                        ) {
                            const idx =
                                (y * unitSize * unitCount + x) * channels;
                            if ((i + j) % 2 == 0) {
                                safeImage[idx + 0] = 0xff;
                                safeImage[idx + 1] = 0x00;
                                safeImage[idx + 2] = 0xff;
                            } else {
                                safeImage[idx + 0] = 0x00;
                                safeImage[idx + 1] = 0x00;
                                safeImage[idx + 2] = 0x00;
                            }
                            safeImage[idx + 3] = 0xff;
                        }
                    }
                }
            }
            safeImage = await sharp(safeImage, {
                raw: {
                    width: unitSize * unitCount,
                    height: unitSize * unitCount,
                    channels: channels,
                },
            })
                .png()
                .toBuffer();
        }
        return loadImage(safeImage);
    }
    static drawText(
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
        }: {
            maxWidth?: number;
            textAlign?: "left" | "center" | "right";
            mainColor?: string | CanvasGradient | CanvasPattern;
            borderColor?: string | CanvasGradient | CanvasPattern;
            font?: string;
            lineBreakSuffix?: string;
            widthConstraintType?: "cut" | "shrink";
            shrinkAnchor?: "top" | "center" | "bottom";
        }
    ) {
        ctx.font = `${fontSize}px ${font}`;
        if (widthConstraintType == "cut")
            str = this.findMaxFitString(ctx, str, maxWidth, lineBreakSuffix);
        if (widthConstraintType == "shrink") {
            for (let fs = fontSize; fs >= 4; fs--) {
                const measurement = this.measureText(
                    ctx,
                    str,
                    fs,
                    Infinity,
                    font
                );
                if (measurement.width <= maxWidth) {
                    const originalMesurement = this.measureText(
                        ctx,
                        str,
                        fontSize,
                        Infinity,
                        font
                    );
                    const originalHeight =
                        originalMesurement.actualBoundingBoxAscent +
                        originalMesurement.actualBoundingBoxDescent;
                    const newHeight =
                        measurement.actualBoundingBoxAscent +
                        measurement.actualBoundingBoxDescent;
                    if (shrinkAnchor == "top") {
                        y -= originalHeight;
                        y += newHeight;
                    } else if (shrinkAnchor == "center") {
                        y -= (originalHeight - newHeight) / 2;
                    }
                    fontSize = fs;
                    break;
                }
            }
        }
        if (linewidth > 0) {
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = linewidth;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.textAlign = textAlign;
            ctx.strokeText(str, x, y);
        }
        ctx.fillStyle = mainColor;
        ctx.font = `${fontSize}px ${font}`;
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
    static drawVerticalText(
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
        font: string = `"standard-font-title-latin", "standard-font-title-jp"`
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
                Util.drawText(ctx, char, curX, curY, fontSize, linewidth, {
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
                Util.drawText(
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
                    }
                );
                ctx.restore();
                curY += width + verticalSpacing;
            }
        }
    }
    static async drawEmojiOrGlyph(
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
        lineBreakSuffix = "..."
    ) {
        ctx.font = `${fontSize}px ${font}`;
        str = this.findMaxFitString(ctx, str, maxWidth, lineBreakSuffix);

        ctx.textDrawingMode = "glyph";
        ctx.fillStyle = mainColor;
        ctx.font = `${fontSize}px ${font}`;
        ctx.textAlign = textAlign;
        await fillTextWithTwemoji(ctx, str, x, y);
        ctx.textDrawingMode = "path";
    }
    static measureText(
        ctx: CanvasRenderingContext2D,
        original: string,
        fontSize: number,
        maxWidth: number,
        font: string = `"standard-font-title-latin", "standard-font-title-jp"`
    ): TextMetrics {
        ctx.font = `${fontSize}px ${font}`;
        const metrics = ctx.measureText(
            Util.findMaxFitString(ctx, original, maxWidth, "...")
        );
        return metrics;
    }
    static visibleLength(str: string) {
        return [...new Intl.Segmenter().segment(str)].length;
    }
    static capitalize(str: string) {
        const strarr = [...str];
        strarr[0] = strarr[0].toUpperCase();
        return strarr.join("");
    }

    static buildLogger(name: string[]) {
        return new Bunyan({
            name: name.join("."),
            streams: [
                {
                    stream: process.stdout,
                    level: (() => {
                        switch (process.env.LOG_LEVEL) {
                            case "trace":
                                return Bunyan.TRACE;
                            case "debug":
                                return Bunyan.DEBUG;
                            case "info":
                                return Bunyan.INFO;
                            case "warn":
                                return Bunyan.WARN;
                            case "error":
                                return Bunyan.ERROR;
                            case "fatal":
                                return Bunyan.FATAL;
                            default:
                                return Bunyan.INFO;
                        }
                    })(),
                },
                {
                    stream: process.stderr,
                    level: Bunyan.ERROR,
                },
            ],
        });
    }
}
export namespace Util {
    export class HalfFullWidthConvert {
        private static readonly charsets = {
            latin: { halfRE: /[!-~]/g, fullRE: /[！-～]/g, delta: 0xfee0 },
            hangul1: { halfRE: /[ﾡ-ﾾ]/g, fullRE: /[ᆨ-ᇂ]/g, delta: -0xedf9 },
            hangul2: { halfRE: /[ￂ-ￜ]/g, fullRE: /[ᅡ-ᅵ]/g, delta: -0xee61 },
            kana: {
                delta: 0,
                half: "｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ",
                full:
                    "。「」、・ヲァィゥェォャュョッーアイウエオカキクケコサシ" +
                    "スセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン゛゜",
            },
            extras: {
                delta: 0,
                half: "¢£¬¯¦¥₩\u0020|←↑→↓■°",
                full: "￠￡￢￣￤￥￦\u3000￨￩￪￫￬￭￮",
            },
        };
        // @ts-ignore
        private static readonly toFull = (set) => (c) =>
            set.delta
                ? String.fromCharCode(c.charCodeAt(0) + set.delta)
                : [...set.full][[...set.half].indexOf(c)];
        // @ts-ignore
        private static readonly toHalf = (set) => (c) =>
            set.delta
                ? String.fromCharCode(c.charCodeAt(0) - set.delta)
                : [...set.half][[...set.full].indexOf(c)];
        // @ts-ignore
        private static readonly re = (set, way) =>
            set[way + "RE"] || new RegExp("[" + set[way] + "]", "g");
        private static readonly sets = Object.values(this.charsets);
        // @ts-ignore
        static toFullWidth = (str0) =>
            this.sets.reduce(
                (str, set) =>
                    str.replace(this.re(set, "half"), this.toFull(set)),
                str0
            );
        // @ts-ignore
        static toHalfWidth = (str0) =>
            this.sets.reduce(
                (str, set) =>
                    str.replace(this.re(set, "full"), this.toHalf(set)),
                str0
            );
    }

    export type ResponseOf<M extends Record<string, unknown>> = {
        [K in keyof M]: { status: K; message: string; data: M[K] };
    }[keyof M];

    export type MergeExtraTypes<
        Base extends Record<string, Record<string, unknown>>,
        Extra extends Partial<Record<keyof Base, Record<string, unknown>>>,
    > = {
        [K in keyof Base]: Base[K] &
            (Extra[K] extends Record<string, unknown> ? Extra[K] : {});
    };

    export namespace z {
        export function color() {
            return zod.string().refine((str) => {
                try {
                    new Color(str);
                    return true;
                } catch {
                    return false;
                }
            });
        }
    }
}

export default Util;
