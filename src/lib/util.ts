import { Database } from "@maidraw/mai/chart/database";
import {
    CanvasGradient,
    CanvasPattern,
    CanvasRenderingContext2D,
    TextMetrics,
} from "canvas";
import _ from "lodash";
import { fillTextWithTwemoji } from "node-canvas-with-twemoji-and-discord-emoji";
import { parse } from "upath";

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
        for (let i = 1; i < original.length; ++i) {
            let cur = original.slice(0, original.length - i);
            if (ctx.measureText(cur + lineBreakSuffix).width <= maxWidth) {
                while (cur[cur.length - 1] == "　") {
                    cur = cur.substring(0, cur.length - 1);
                }
                return cur.trim() + lineBreakSuffix;
            }
        }
        return original;
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
        /**
         * Max width of the text block.
         */
        maxWidth: number,
        textAlign: "left" | "center" | "right" = "left",
        mainColor: string | CanvasGradient | CanvasPattern = "white",
        borderColor: string | CanvasGradient | CanvasPattern = "black",
        font: string = `"standard-font-title-latin", "standard-font-title-jp"`,
        lineBreakSuffix = "..."
    ) {
        ctx.font = `${fontSize}px ${font}`;
        str = this.findMaxFitString(ctx, str, maxWidth, lineBreakSuffix);
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
    export namespace Maimai {
        export class Version {
            static readonly DX = {
                name: "maimai でらっくす",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 0,
                },
            };
            static readonly DX_PLUS = {
                name: "maimai でらっくす PLUS",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 5,
                },
            };
            static readonly SPLASH = {
                name: "maimai でらっくす Splash",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 10,
                },
            };
            static readonly SPLASH_PLUS = {
                name: "maimai でらっくす Splash PLUS",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 15,
                },
            };
            static readonly UNIVERSE = {
                name: "maimai でらっくす UNiVERSE",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 20,
                },
            };
            static readonly UNIVERSE_PLUS = {
                name: "maimai でらっくす UNiVERSE PLUS",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 25,
                },
            };
            static readonly FESTIVAL = {
                name: "maimai でらっくす FESTiVAL",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 30,
                },
            };
            static readonly FESTIVAL_PLUS = {
                name: "maimai でらっくす FESTiVAL PLUS",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 35,
                },
            };
            static readonly BUDDIES = {
                name: "maimai でらっくす BUDDiES",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 40,
                },
            };
            static readonly BUDDIES_PLUS = {
                name: "maimai でらっくす BUDDiES PLUS",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 45,
                },
            };
            static readonly PRISM = {
                name: "maimai でらっくす PRiSM",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 50,
                },
            };
            static readonly PRISM_PLUS = {
                name: "maimai でらっくす PRiSM PLUS",
                gameVersion: {
                    isDX: true,
                    major: 1,
                    minor: 55,
                },
            };
            private static versions: Database.IVersion[] = [
                Version.DX,
                Version.DX_PLUS,
                Version.SPLASH,
                Version.SPLASH_PLUS,
                Version.UNIVERSE,
                Version.UNIVERSE_PLUS,
                Version.FESTIVAL,
                Version.FESTIVAL_PLUS,
                Version.BUDDIES,
                Version.BUDDIES_PLUS,
                Version.PRISM,
                Version.PRISM_PLUS,
            ];
            static getNextVersion(version: Database.IVersion) {
                const index = _.findIndex(Version.versions, (v) => {
                    return (
                        _.isEqual(
                            v.gameVersion.isDX,
                            version.gameVersion.isDX
                        ) &&
                        _.isEqual(
                            v.gameVersion.major,
                            version.gameVersion.major
                        ) &&
                        _.isEqual(
                            v.gameVersion.minor,
                            version.gameVersion.minor
                        )
                    );
                });
                if (index == -1) {
                    return version;
                } else if (index == this.versions.length - 1) {
                    return this.versions[index];
                }
                return this.versions[index + 1];
            }
            static getPreviousVersion(version: Database.IVersion) {
                const index = _.findIndex(Version.versions, (v) => {
                    return _.isEqual(v.gameVersion, version.gameVersion);
                });
                if (index == -1) {
                    return version;
                } else if (index == 0) {
                    return this.versions[index];
                }
                return this.versions[index - 1];
            }
            static toEventVersion(version: Database.IVersion) {
                const event = {
                    ...version,
                    region: "DX",
                };
                event.gameVersion.release = 0;
                return event as Database.IEventVersion;
            }
        }
    }
}
