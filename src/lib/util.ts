import {
    CanvasGradient,
    CanvasPattern,
    CanvasRenderingContext2D,
} from "canvas";

export class Util {
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
}
