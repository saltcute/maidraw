import fs from "fs";
import upath from "upath";
import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    ESyncTypes,
    IScore,
} from "@maidraw/mai/type";
import {
    IThemeImageElement,
    IThemeManifest,
    IThemeProfileElement,
    IThemeScoreElement,
    IThemeTextElement,
} from "./type";
import {
    Canvas,
    Image,
    registerFont,
    CanvasRenderingContext2D,
    CanvasGradient,
    CanvasPattern,
} from "canvas";
import Color from "color";
import sharp from "sharp";
import { globSync } from "glob";
import ScoreTrackerAdapter from "./lib";
import { Chart } from "../chart";
import { LXNS } from "./lib/lxns";
import { KamaiTachi } from "./lib/kamaiTachi";
import { DivingFish } from "./lib/divingFish";
import stringFormat from "string-template";

class HalfFullWidthConvert {
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
            (str, set) => str.replace(this.re(set, "half"), this.toFull(set)),
            str0
        );
    // @ts-ignore
    static toHalfWidth = (str0) =>
        this.sets.reduce(
            (str, set) => str.replace(this.re(set, "full"), this.toHalf(set)),
            str0
        );
}

interface ITheme {
    manifest: IThemeManifest;
    path: string;
}

export class Best50 {
    static LXNS = LXNS;
    static KamaiTachi = KamaiTachi;
    static DivingFish = DivingFish;

    static readonly RATING_CONSTANTS = {
        [EAchievementTypes.D]: {
            [0.4]: 6.4,
            [0.3]: 4.8,
            [0.2]: 3.2,
            [0.1]: 1.6,
            [0]: 0,
        },
        [EAchievementTypes.C]: 13.6,
        [EAchievementTypes.B]: 13.6,
        [EAchievementTypes.BB]: 13.6,
        [EAchievementTypes.BBB]: 13.6,
        [EAchievementTypes.A]: 13.6,
        [EAchievementTypes.AA]: 15.2,
        [EAchievementTypes.AAA]: 16.8,
        [EAchievementTypes.S]: 20.0,
        [EAchievementTypes.SP]: 20.3,
        [EAchievementTypes.SS]: 20.8,
        [EAchievementTypes.SSP]: 21.1,
        [EAchievementTypes.SSS]: 21.6,
        [EAchievementTypes.SSSP]: 22.4,
    };
    static readonly RANK_BORDERS = {
        [EAchievementTypes.D]: [0.0, 0.1, 0.2, 0.3, 0.4],
        [EAchievementTypes.C]: 0.5,
        [EAchievementTypes.B]: 0.6,
        [EAchievementTypes.BB]: 0.7,
        [EAchievementTypes.BBB]: 0.75,
        [EAchievementTypes.A]: 0.8,
        [EAchievementTypes.AA]: 0.9,
        [EAchievementTypes.AAA]: 0.94,
        [EAchievementTypes.S]: 0.97,
        [EAchievementTypes.SP]: 0.98,
        [EAchievementTypes.SS]: 0.99,
        [EAchievementTypes.SSP]: 0.995,
        [EAchievementTypes.SSS]: 1.0,
        [EAchievementTypes.SSSP]: 1.005,
    };

    private static readonly DEFAULT_THEME = "jp-prism-landscape";

    private static get assetsPath() {
        return upath.join(__dirname, "..", "..", "..", "assets");
    }
    private static themes: Record<string, string> = {};
    static hasTheme(name: string): boolean {
        return !!this.themes[name];
    }
    static {
        const manifests = globSync(
            upath.join(
                this.assetsPath,
                "themes",
                "maimai",
                "**",
                "manifest.json"
            )
        );
        for (const manifestPath of manifests) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
            if (this.validateManifest(manifest, upath.dirname(manifestPath))) {
                this.themes[manifest.name] = upath.dirname(manifestPath);
            }
        }
        const loadThemeResult = this.loadTheme(this.DEFAULT_THEME);
        if (!loadThemeResult) {
            console.error("Failed to load default theme.");
        }
        registerFont(
            upath.join(
                this.assetsPath,
                "fonts",
                "gen-jyuu-gothic",
                "GenJyuuGothic-Bold.ttf"
            ),
            {
                family: "standard-font-title-jp",
            }
        );
        registerFont(
            upath.join(
                this.assetsPath,
                "fonts",
                "comfortaa",
                "Comfortaa-Bold.ttf"
            ),
            {
                family: "standard-font-title-latin",
                weight: "regular",
            }
        );
        registerFont(
            upath.join(
                this.assetsPath,
                "fonts",
                "seurat-db",
                "FOT-Seurat Pro DB.otf"
            ),
            {
                family: "standard-font-username",
                weight: "regular",
            }
        );
    }

    private static validateManifest(
        payload: any,
        path: string
    ): payload is IThemeManifest {
        function isFileExist(p: any): boolean {
            if (isString(p)) return fs.existsSync(upath.join(path, p));
            else return false;
        }
        function isOneOf(p: any, ...args: any[]): boolean {
            return args.includes(p);
        }
        function isString(p: any): p is string {
            return typeof p == "string";
        }
        function isNumber(p: any): p is number {
            return typeof p == "number";
        }
        function isArray(p: any): p is any[] {
            return Array.isArray(p);
        }
        function isObject(p: any): p is object {
            return typeof p == "object";
        }
        function isHexColor(p: any): p is string {
            if (isString(p)) return /^(?:#[0-9A-F]{6}|#[0-9A-F]{8})$/i.test(p);
            else return false;
        }
        function isUndefined(p: any): p is undefined {
            return typeof p == "undefined";
        }
        function isBoolean(p: any): p is boolean {
            return typeof p == "boolean";
        }
        if (
            isString(payload.displayName) &&
            isString(payload.name) &&
            isNumber(payload.width) &&
            isNumber(payload.height) &&
            isObject(payload.sprites) &&
            isObject(payload.sprites.achievement) &&
            isFileExist(payload.sprites.achievement.d) &&
            isFileExist(payload.sprites.achievement.c) &&
            isFileExist(payload.sprites.achievement.b) &&
            isFileExist(payload.sprites.achievement.bb) &&
            isFileExist(payload.sprites.achievement.bbb) &&
            isFileExist(payload.sprites.achievement.a) &&
            isFileExist(payload.sprites.achievement.aa) &&
            isFileExist(payload.sprites.achievement.aaa) &&
            isFileExist(payload.sprites.achievement.s) &&
            isFileExist(payload.sprites.achievement.sp) &&
            isFileExist(payload.sprites.achievement.ss) &&
            isFileExist(payload.sprites.achievement.ssp) &&
            isFileExist(payload.sprites.achievement.sss) &&
            isFileExist(payload.sprites.achievement.sssp) &&
            isObject(payload.sprites.mode) &&
            isFileExist(payload.sprites.mode.standard) &&
            isFileExist(payload.sprites.mode.dx) &&
            isObject(payload.sprites.milestone) &&
            isFileExist(payload.sprites.milestone.ap) &&
            isFileExist(payload.sprites.milestone.app) &&
            isFileExist(payload.sprites.milestone.fc) &&
            isFileExist(payload.sprites.milestone.fcp) &&
            isFileExist(payload.sprites.milestone.fdx) &&
            isFileExist(payload.sprites.milestone.fdxp) &&
            isFileExist(payload.sprites.milestone.fs) &&
            isFileExist(payload.sprites.milestone.fsp) &&
            isFileExist(payload.sprites.milestone.sync) &&
            isFileExist(payload.sprites.milestone.none) &&
            isObject(payload.sprites.dxRating) &&
            isFileExist(payload.sprites.dxRating.white) &&
            isFileExist(payload.sprites.dxRating.blue) &&
            isFileExist(payload.sprites.dxRating.green) &&
            isFileExist(payload.sprites.dxRating.yellow) &&
            isFileExist(payload.sprites.dxRating.red) &&
            isFileExist(payload.sprites.dxRating.purple) &&
            isFileExist(payload.sprites.dxRating.bronze) &&
            isFileExist(payload.sprites.dxRating.silver) &&
            isFileExist(payload.sprites.dxRating.gold) &&
            isFileExist(payload.sprites.dxRating.platinum) &&
            isFileExist(payload.sprites.dxRating.rainbow) &&
            isObject(payload.sprites.profile) &&
            isFileExist(payload.sprites.profile.icon) &&
            isFileExist(payload.sprites.profile.nameplate) &&
            isFileExist(payload.sprites.dxRatingNumberMap) &&
            isArray(payload.elements)
        ) {
            for (const element of payload.elements) {
                if (isNumber(element.x) && isNumber(element.y)) {
                    switch (element.type) {
                        case "image": {
                            if (
                                isNumber(element.width) &&
                                isNumber(element.height) &&
                                isFileExist(element.path)
                            ) {
                                continue;
                            } else return false;
                        }
                        case "score-grid": {
                            if (
                                isOneOf(element.region, "old", "new") &&
                                isNumber(element.horizontalSize) &&
                                isNumber(element.verticalSize) &&
                                isNumber(element.index) &&
                                isObject(element.scoreBubble) &&
                                isNumber(element.scoreBubble.width) &&
                                isNumber(element.scoreBubble.height) &&
                                isNumber(element.scoreBubble.margin) &&
                                isNumber(element.scoreBubble.gap) &&
                                isObject(element.scoreBubble.color) &&
                                isHexColor(element.scoreBubble.color.basic) &&
                                isHexColor(
                                    element.scoreBubble.color.advanced
                                ) &&
                                isHexColor(element.scoreBubble.color.expert) &&
                                isHexColor(element.scoreBubble.color.master) &&
                                isHexColor(
                                    element.scoreBubble.color.remaster
                                ) &&
                                isHexColor(element.scoreBubble.color.utage)
                            ) {
                                continue;
                            } else return false;
                        }
                        case "profile": {
                            if (isNumber(element.height)) {
                                continue;
                            } else return false;
                        }
                        case "text": {
                            if (
                                isNumber(element.size) &&
                                isString(element.content) &&
                                (isUndefined(element.width) ||
                                    isNumber(element.width)) &&
                                (isUndefined(element.height) ||
                                    isNumber(element.height)) &&
                                (isUndefined(element.linebreak) ||
                                    isBoolean(element.linebreak)) &&
                                (isUndefined(element.align) ||
                                    isOneOf(
                                        element.align,
                                        "left",
                                        "center",
                                        "right"
                                    )) &&
                                (isUndefined(element.color) ||
                                    isString(element.color)) &&
                                (isUndefined(element.borderColor) ||
                                    isString(element.borderColor)) &&
                                (isUndefined(element.font) ||
                                    isString(element.font))
                            ) {
                                continue;
                            } else return false;
                        }
                        default:
                            return false;
                    }
                }
            }
            return true;
        } else return false;
    }
    private static primaryTheme: ITheme | null = null;
    static loadTheme(path: string): boolean {
        const theme = this.getTheme(path);
        if (theme) {
            this.primaryTheme = theme;
            return true;
        } else return false;
    }
    private static getTheme(path: string): {
        manifest: IThemeManifest;
        path: string;
    } | null {
        if (!fs.existsSync(upath.join(path, "manifest.json"))) {
            path = this.themes[path] ?? "";
        } else path = upath.join(this.assetsPath, path);
        if (fs.existsSync(upath.join(path, "manifest.json"))) {
            const manifest = JSON.parse(
                fs.readFileSync(upath.join(path, "manifest.json"), "utf-8")
            );
            if (this.validateManifest(manifest, path)) {
                return { manifest, path };
            }
        }
        return null;
    }
    private static getThemeFile(path: string, themePath?: string): Buffer {
        if (
            typeof path == "string" &&
            fs.existsSync(
                upath.join(themePath ?? this.primaryTheme?.path, path)
            )
        )
            return fs.readFileSync(
                upath.join(themePath ?? this.primaryTheme?.path, path)
            );
        else return Buffer.from([]);
    }
    /* Begin Draw Tools*/
    private static findMaxFitString(
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
    private static drawText(
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
    private static async drawImageModule(
        ctx: CanvasRenderingContext2D,
        theme: ITheme,
        element: IThemeImageElement
    ) {
        const img = new Image();
        img.src = this.getThemeFile(element.path, theme.path);
        ctx.drawImage(img, element.x, element.y, element.width, element.height);
    }
    private static async drawScoreGridModule(
        ctx: CanvasRenderingContext2D,
        theme: ITheme,
        element: IThemeScoreElement,
        score: IScore,
        index: number,
        x: number,
        y: number
    ) {
        let curColor = "#FFFFFF";
        switch (score.chart.difficulty) {
            case EDifficulty.BASIC:
                curColor = element.scoreBubble.color.basic;
                break;
            case EDifficulty.ADVANCED:
                curColor = element.scoreBubble.color.advanced;
                break;
            case EDifficulty.EXPERT:
                curColor = element.scoreBubble.color.expert;
                break;
            case EDifficulty.MASTER:
                curColor = element.scoreBubble.color.master;
                break;
            case EDifficulty.REMASTER:
                curColor = element.scoreBubble.color.remaster;
                break;
            case EDifficulty.UTAGE:
                curColor = element.scoreBubble.color.utage;
                break;
        }

        /** Begin Card Draw */
        ctx.save();
        ctx.fillStyle = new Color(curColor).lighten(0.4).hexa();
        ctx.beginPath();
        ctx.roundRect(
            x,
            y,
            element.scoreBubble.width,
            element.scoreBubble.height,
            (element.scoreBubble.height * 0.806) / 7
        );
        ctx.strokeStyle = new Color(curColor).darken(0.3).hexa();
        ctx.lineWidth = element.scoreBubble.margin / 4;
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(
            x,
            y,
            element.scoreBubble.width,
            element.scoreBubble.height,
            (element.scoreBubble.height * 0.806) / 7
        );
        ctx.clip();

        /** Begin Main Content Draw */
        {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(
                x,
                y,
                element.scoreBubble.width,
                element.scoreBubble.height * 0.742,
                (element.scoreBubble.height * 0.806) / 7
            );
            ctx.clip();
            ctx.fillStyle = curColor;
            ctx.fill();

            const jacketSize = Math.min(
                element.scoreBubble.width,
                element.scoreBubble.height * 0.742
            );

            const jacketMaskGrad = ctx.createLinearGradient(
                x + jacketSize / 2,
                y + jacketSize / 2,
                x + jacketSize,
                y + jacketSize / 2
            );
            jacketMaskGrad.addColorStop(0, new Color(curColor).alpha(0).hexa());
            jacketMaskGrad.addColorStop(
                0.25,
                new Color(curColor).alpha(0.2).hexa()
            );
            jacketMaskGrad.addColorStop(1, new Color(curColor).alpha(1).hexa());
            const jacketMaskGradDark = ctx.createLinearGradient(
                x + jacketSize / 2,
                y + jacketSize / 2,
                x + jacketSize,
                y + jacketSize / 2
            );
            jacketMaskGradDark.addColorStop(
                0,
                new Color(curColor).darken(0.3).alpha(0).hexa()
            );
            jacketMaskGradDark.addColorStop(
                0.25,
                new Color(curColor).darken(0.3).alpha(0.2).hexa()
            );
            jacketMaskGradDark.addColorStop(
                1,
                new Color(curColor).darken(0.3).alpha(1).hexa()
            );

            /** Begin Jacket Draw*/
            let jacket = await Chart.Database.fecthJacket(score.chart.id);
            if (!jacket) jacket = await Chart.Database.fecthJacket(0);
            if (jacket) {
                const img = new Image();
                img.src = jacket;
                ctx.drawImage(img, x, y, jacketSize, jacketSize);
            } else {
                ctx.fillStyle = "#b6ffab";
                ctx.fillRect(x, y, jacketSize, jacketSize);
            }
            /** End Jacket Draw*/

            /** Begin Jacket Gradient Mask Draw*/ {
                ctx.fillStyle = jacketMaskGrad;
                ctx.fillRect(
                    x + jacketSize / 2,
                    y,
                    (jacketSize * 3) / 4,
                    jacketSize
                );
            } /** End Jacket Gradient Mask Draw*/

            ctx.beginPath();
            ctx.roundRect(
                x + element.scoreBubble.margin,
                y + element.scoreBubble.margin,
                element.scoreBubble.width - element.scoreBubble.margin * 2,
                element.scoreBubble.height * 0.806 -
                    element.scoreBubble.margin * 2,
                (element.scoreBubble.height * 0.806 -
                    element.scoreBubble.margin * 2) /
                    7
            );

            /** Begin Title Draw */ {
                this.drawText(
                    ctx,
                    score.chart.name,
                    x + (jacketSize * 7) / 8,
                    y +
                        element.scoreBubble.margin +
                        element.scoreBubble.height * 0.806 * 0.144,
                    element.scoreBubble.height * 0.806 * 0.144,
                    element.scoreBubble.height * 0.806 * 0.04,
                    element.scoreBubble.width -
                        (jacketSize * 7) / 8 -
                        element.scoreBubble.margin,
                    "left",
                    "white",
                    jacketMaskGradDark
                );
            } /** End Title Draw */

            /** Begin Separation Line Draw */ {
                ctx.beginPath();
                ctx.roundRect(
                    x + (jacketSize * 13) / 16,
                    y +
                        element.scoreBubble.margin +
                        element.scoreBubble.height * 0.806 * (0.144 + 0.072),
                    element.scoreBubble.width -
                        (jacketSize * 13) / 16 -
                        element.scoreBubble.margin * 2,
                    element.scoreBubble.height * 0.806 * 0.02,
                    element.scoreBubble.height * 0.806 * 0.16
                );
                ctx.fillStyle = jacketMaskGradDark;
                ctx.fill();
            } /** End Separation Line Draw */

            /** Begin Achievement Rate Draw */
            this.drawText(
                ctx,
                `${score.achievement.toFixed(4)}%`,
                x -
                    element.scoreBubble.margin -
                    element.scoreBubble.height * 0.806 * 0.02 +
                    element.scoreBubble.width,
                y +
                    element.scoreBubble.margin +
                    element.scoreBubble.height *
                        0.806 *
                        (0.144 + 0.144 + 0.208 - 0.04),
                element.scoreBubble.height * 0.806 * 0.208,
                element.scoreBubble.height * 0.806 * 0.04,
                Infinity,
                "right",
                "white",
                new Color(curColor).darken(0.3).hexa()
            );
            /** End Achievement Rate Draw */

            /** Begin Achievement Rank Draw */
            {
                let rankImg: Buffer;
                switch (score.achievementRank) {
                    case EAchievementTypes.D:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.d,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.C:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.c,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.B:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.b,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.BB:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.bb,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.BBB:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.bbb,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.A:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.a,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.AA:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.aa,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.AAA:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.aaa,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.S:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.s,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.SP:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.sp,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.SS:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.ss,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.SSP:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.ssp,
                            theme.path
                        );
                        break;
                    case EAchievementTypes.SSS:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.sss,
                            theme.path
                        );
                        break;
                    default:
                        rankImg = this.getThemeFile(
                            theme.manifest.sprites.achievement.sssp,
                            theme.path
                        );
                }
                const img = new Image();
                img.src = rankImg;
                ctx.drawImage(
                    img,
                    x + jacketSize,
                    y +
                        element.scoreBubble.margin +
                        element.scoreBubble.height *
                            0.806 *
                            (0.144 + 0.144 + 0.208 + 0.02),
                    element.scoreBubble.height * 0.806 * 0.3 * 2.133,
                    element.scoreBubble.height * 0.806 * 0.3
                );
            }
            /** End Achievement Rank Draw */

            /** Begin Milestone Draw */
            {
                let comboImg: Buffer, syncImg: Buffer;
                switch (score.combo) {
                    case EComboTypes.NONE:
                        comboImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.none,
                            theme.path
                        );
                        break;
                    case EComboTypes.FULL_COMBO:
                        comboImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.fc,
                            theme.path
                        );
                        break;
                    case EComboTypes.FULL_COMBO_PLUS:
                        comboImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.fcp,
                            theme.path
                        );
                        break;
                    case EComboTypes.ALL_PERFECT:
                        comboImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.ap,
                            theme.path
                        );
                        break;
                    case EComboTypes.ALL_PERFECT_PLUS:
                        comboImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.app,
                            theme.path
                        );
                        break;
                }
                switch (score.sync) {
                    case ESyncTypes.NONE:
                        syncImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.none,
                            theme.path
                        );
                        break;
                    case ESyncTypes.SYNC_PLAY:
                        syncImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.sync,
                            theme.path
                        );
                        break;
                    case ESyncTypes.FULL_SYNC:
                        syncImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.fs,
                            theme.path
                        );
                        break;
                    case ESyncTypes.FULL_SYNC_PLUS:
                        syncImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.fsp,
                            theme.path
                        );
                        break;
                    case ESyncTypes.FULL_SYNC_DX:
                        syncImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.fdx,
                            theme.path
                        );
                        break;
                    case ESyncTypes.FULL_SYNC_DX_PLUS:
                        syncImg = this.getThemeFile(
                            theme.manifest.sprites.milestone.fdxp,
                            theme.path
                        );
                        break;
                }
                const combo = new Image();
                combo.src = comboImg;
                ctx.drawImage(
                    combo,
                    x +
                        (jacketSize * 7) / 8 +
                        element.scoreBubble.height *
                            0.806 *
                            (0.32 * 2.133 + 0.06),
                    y +
                        element.scoreBubble.margin +
                        element.scoreBubble.height *
                            0.806 *
                            (0.144 + 0.144 + 0.208 + 0.01),
                    element.scoreBubble.height * 0.806 * 0.32,
                    element.scoreBubble.height * 0.806 * 0.32
                );
                const sync = new Image();
                sync.src = syncImg;
                ctx.drawImage(
                    sync,
                    x +
                        (jacketSize * 7) / 8 +
                        element.scoreBubble.height *
                            0.806 *
                            (0.32 * 2.133 + 0.04 + 0.32),
                    y +
                        element.scoreBubble.margin +
                        element.scoreBubble.height *
                            0.806 *
                            (0.144 + 0.144 + 0.208 + 0.01),
                    element.scoreBubble.height * 0.806 * 0.32,
                    element.scoreBubble.height * 0.806 * 0.32
                );
            }
            /** End Milestone Draw */

            /** Begin Chart Mode Draw */
            {
                const mode = new Image();
                const chartModeBadgeImg = this.getThemeFile(
                    score.chart.id > 10000
                        ? theme.manifest.sprites.mode.dx
                        : theme.manifest.sprites.mode.standard,
                    theme.path
                );
                const { width, height } =
                    await sharp(chartModeBadgeImg).metadata();
                const aspectRatio = (width ?? 0) / (height ?? 1) || 3;
                mode.src = chartModeBadgeImg;
                const drawHeight = (jacketSize * 6) / 8;
                ctx.drawImage(
                    mode,
                    x + ((jacketSize * 7) / 8 - drawHeight) / 2,
                    y +
                        element.scoreBubble.margin +
                        element.scoreBubble.height * 0.806 * 0.02,
                    drawHeight,
                    drawHeight / aspectRatio
                );
            }
            /** End Chart Mode Draw */

            /** Begin Bests Index Draw */
            {
                this.drawText(
                    ctx,
                    `#${index + 1}`,
                    x + element.scoreBubble.margin * 2,
                    y + jacketSize - element.scoreBubble.margin * 2,
                    element.scoreBubble.height * 0.806 * 0.128,
                    element.scoreBubble.height * 0.806 * 0.04,
                    Infinity,
                    "left",
                    "white",
                    new Color(curColor).darken(0.3).hexa()
                );
            }
            /** End Bests Index Draw */

            ctx.restore();
        }
        /** End Main Content Draw */

        /** Begin Difficulty & DX Rating Draw */
        {
            this.drawText(
                ctx,
                `${score.chart.level.toFixed(1)}  ↑${score.dxRating.toFixed(0)}`,
                x + element.scoreBubble.margin * 2,
                y + element.scoreBubble.height * (0.806 + (1 - 0.806) / 2),
                element.scoreBubble.height * 0.806 * 0.128,
                element.scoreBubble.height * 0.806 * 0.04,
                Infinity,
                "left",
                "white",
                new Color(curColor).darken(0.3).hexa()
            );

            if (score.chart.maxDxScore) {
                this.drawText(
                    ctx,
                    `${score.dxScore}/${score.chart.maxDxScore}`,
                    x +
                        element.scoreBubble.width -
                        element.scoreBubble.margin * 2,
                    y + element.scoreBubble.height * (0.806 + (1 - 0.806) / 2),
                    element.scoreBubble.height * 0.806 * 0.128,
                    element.scoreBubble.height * 0.806 * 0.04,
                    Infinity,
                    "right",
                    "white",
                    new Color(curColor).darken(0.3).hexa()
                );
            }
        }
        /** End Difficulty & DX Rating Draw */

        ctx.restore();
        /** End Card Draw */
    }
    private static async drawProfileModule(
        ctx: CanvasRenderingContext2D,
        theme: ITheme,
        element: IThemeProfileElement,
        username: string,
        rating: number,
        profilePicture?: Buffer
    ) {
        const nameplate = new Image();
        nameplate.src = this.getThemeFile(
            theme.manifest.sprites.profile.nameplate,
            theme.path
        );
        ctx.drawImage(
            nameplate,
            element.x,
            element.y,
            element.height * 6.207,
            element.height
        );

        /* Begin Profile Picture Draw */
        {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(
                element.x + element.height * 0.064,
                element.y + element.height * 0.064,
                element.height * 0.872,
                element.height * 0.872,
                (element.height * 0.872) / 16
            );
            ctx.clip();
            ctx.fillStyle = "white";
            ctx.fill();
            const icon = new Image();
            try {
                sharp(profilePicture);
            } catch {
                // Unknown profile picture binary
                profilePicture = undefined;
            }
            const pfp =
                profilePicture ||
                this.getThemeFile(
                    theme.manifest.sprites.profile.icon,
                    theme.path
                );
            const { dominant } = await sharp(pfp).stats();
            icon.src = await sharp(pfp).png().toBuffer();

            const cropSize = Math.min(icon.width, icon.height);
            ctx.drawImage(
                icon,
                (icon.width - cropSize) / 2,
                (icon.height - cropSize) / 2,
                cropSize,
                cropSize,
                element.x + element.height * 0.064,
                element.y + element.height * 0.064,
                element.height * 0.872,
                element.height * 0.872
            );

            if (profilePicture) {
                ctx.beginPath();
                ctx.roundRect(
                    element.x + element.height * 0.064,
                    element.y + element.height * 0.064,
                    element.height * 0.872,
                    element.height * 0.872,
                    (element.height * 0.872) / 16
                );
                ctx.strokeStyle = Color.rgb(dominant).darken(0.3).hex();
                ctx.lineWidth = element.height / 30;
                ctx.stroke();
            }
            ctx.restore();
        }
        /* End Profile Picture Draw */

        /* Begin DX Rating Draw */
        {
            const dxRating = new Image();
            let dxRatingImg: Buffer;
            switch (true) {
                case rating > 15000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.rainbow,
                        theme.path
                    );
                    break;
                }
                case rating > 14500: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.platinum,
                        theme.path
                    );
                    break;
                }
                case rating > 14000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.gold,
                        theme.path
                    );
                    break;
                }
                case rating > 13000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.silver,
                        theme.path
                    );
                    break;
                }
                case rating > 12000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.bronze,
                        theme.path
                    );
                    break;
                }
                case rating > 10000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.purple,
                        theme.path
                    );
                    break;
                }
                case rating > 8000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.red,
                        theme.path
                    );
                    break;
                }
                case rating > 6000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.yellow,
                        theme.path
                    );
                    break;
                }
                case rating > 4000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.green,
                        theme.path
                    );
                    break;
                }
                case rating > 2000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.blue,
                        theme.path
                    );
                    break;
                }
                default: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.white,
                        theme.path
                    );
                    break;
                }
            }
            dxRating.src = dxRatingImg;
            ctx.drawImage(
                dxRating,
                element.x + element.height,
                element.y + element.height * 0.064,
                (element.height / 3) * 5.108,
                element.height / 3
            );
        }
        /* End DX Rating Draw */

        /* Begin Username Draw */
        {
            ctx.beginPath();
            ctx.roundRect(
                element.x + element.height * (1 + 1 / 32),
                element.y + element.height * (0.064 + 0.333 + 1 / 32),
                ((element.height / 3) * 5.108 * 6) / 5,
                (element.height * 7) / 24,
                element.height / 20
            );
            ctx.fillStyle = "white";
            ctx.strokeStyle = Color.rgb(180, 180, 180).hex();
            ctx.lineWidth = element.height / 32;
            ctx.stroke();
            ctx.fill();

            const ratingImgBuffer = await this.getRatingNumber(rating, theme);
            if (ratingImgBuffer) {
                const { width, height } =
                    await sharp(ratingImgBuffer).metadata();
                if (width && height) {
                    const aspectRatio = width / height;
                    const image = new Image();
                    image.src = ratingImgBuffer;
                    const drawHeight = (element.height * 7) / 32;
                    ctx.drawImage(
                        image,
                        element.x + element.height * 1.785,
                        element.y + element.height * 0.12,
                        drawHeight * aspectRatio * 0.8,
                        drawHeight
                    );
                }
            }

            this.drawText(
                ctx,
                HalfFullWidthConvert.toFullWidth(username),
                element.x + element.height * (1 + 1 / 16),
                element.y + element.height * (0.064 + 0.333 + 1 / 4),
                (element.height * 1) / 6,
                0,
                ((element.height / 3) * 5.108 * 6) / 5,
                "left",
                "black",
                "black",
                "standard-font-username"
            );
        }
        /* End Username Draw*/
    }
    private static async drawTextModule(
        ctx: CanvasRenderingContext2D,
        theme: ITheme,
        element: IThemeTextElement,
        variables: Record<string, string> = {}
    ) {
        let naiveLines = stringFormat(element.content, variables).split("\n");
        let lines: string[] = [];
        if (element.linebreak) {
            for (let originalContent of naiveLines) {
                while (originalContent.length) {
                    const line = this.findMaxFitString(
                        ctx,
                        originalContent,
                        element.width || Infinity,
                        ""
                    );
                    originalContent = originalContent.replace(line, "").trim();
                    lines.push(line.trim());
                }
            }
        } else {
            for (const originalContent of naiveLines) {
                lines.push(
                    this.findMaxFitString(
                        ctx,
                        originalContent,
                        element.width || Infinity
                    )
                );
            }
        }
        for (let i = 0; i < lines.length; ++i) {
            const line = lines[i];
            this.drawText(
                ctx,
                line,
                element.x,
                element.y + i * element.size * 1.3,
                element.size,
                element.size / 3.5,
                element.width || Infinity,
                element.align,
                element.color || "#FFFFFF",
                element.borderColor
                    ? element.borderColor
                    : Color.rgb(element.color || "#FFFFFF")
                          .darken(0.3)
                          .hex(),
                element.font,
                element.linebreak ? "" : "..."
            );
        }
    }
    /* End Draw Tools*/
    static async draw(
        name: string,
        rating: number,
        newScores: IScore[],
        oldScores: IScore[],
        options?: { scale?: number; theme?: string; profilePicture?: Buffer }
    ): Promise<Buffer | null> {
        let currentTheme = this.primaryTheme;
        if (options?.theme) {
            const theme = this.getTheme(options.theme);
            if (theme) {
                currentTheme = theme;
            }
        }
        if (currentTheme) {
            await Chart.Database.cacheJackets([
                ...newScores.map((v) => v.chart.id),
                ...oldScores.map((v) => v.chart.id),
            ]);
            const canvas = new Canvas(
                currentTheme.manifest.width * (options?.scale ?? 1),
                currentTheme.manifest.height * (options?.scale ?? 1)
            );
            const ctx = canvas.getContext("2d");
            if (options?.scale) ctx.scale(options.scale, options.scale);
            ctx.imageSmoothingEnabled = true;
            for (const element of currentTheme.manifest.elements) {
                switch (element.type) {
                    case "image": {
                        await this.drawImageModule(ctx, currentTheme, element);
                        break;
                    }
                    case "score-grid": {
                        for (
                            let y = element.y, index = element.index, i = 0;
                            i < element.verticalSize;
                            ++i,
                                y +=
                                    element.scoreBubble.height +
                                    element.scoreBubble.gap
                        ) {
                            for (
                                let x = element.x, j = 0;
                                j < element.horizontalSize;
                                ++j,
                                    ++index,
                                    x +=
                                        element.scoreBubble.width +
                                        element.scoreBubble.gap
                            ) {
                                let curScore;
                                if (element.region == "new")
                                    curScore = newScores[index];
                                else curScore = oldScores[index];
                                if (curScore) {
                                    await this.drawScoreGridModule(
                                        ctx,
                                        currentTheme,
                                        element,
                                        curScore,
                                        index,
                                        x,
                                        y
                                    );
                                }
                            }
                        }
                        break;
                    }
                    case "profile": {
                        await this.drawProfileModule(
                            ctx,
                            currentTheme,
                            element,
                            name,
                            rating,
                            options?.profilePicture
                        );
                        break;
                    }
                    case "text": {
                        const getRatingBase = (
                            scores: IScore[],
                            length: number
                        ) => {
                            if (scores.length < length) return 0;
                            return (
                                scores
                                    .slice(0, length)
                                    .map((v) => {
                                        let ratingConstant = 0;
                                        if (
                                            v.achievementRank ==
                                            EAchievementTypes.D
                                        ) {
                                            if (v.achievement > 40)
                                                ratingConstant =
                                                    this.RATING_CONSTANTS[
                                                        v.achievementRank
                                                    ]["0.4"];
                                            if (v.achievement > 30)
                                                ratingConstant =
                                                    this.RATING_CONSTANTS[
                                                        v.achievementRank
                                                    ]["0.3"];
                                            if (v.achievement > 20)
                                                ratingConstant =
                                                    this.RATING_CONSTANTS[
                                                        v.achievementRank
                                                    ]["0.2"];
                                            if (v.achievement > 10)
                                                ratingConstant =
                                                    this.RATING_CONSTANTS[
                                                        v.achievementRank
                                                    ]["0.1"];
                                        } else {
                                            ratingConstant =
                                                this.RATING_CONSTANTS[
                                                    v.achievementRank
                                                ];
                                        }
                                        return (
                                            (v.achievement / 100) *
                                            ratingConstant *
                                            v.chart.level
                                        );
                                    })
                                    .sort((a, b) => a - b)[0] || 0
                            );
                        };
                        function getRatingAvg(
                            scores: IScore[],
                            length: number
                        ) {
                            if (scores.length <= 0) return 0;
                            return (
                                scores
                                    .map((v) => v.dxRating)
                                    .reduce((sum, v) => (sum += v)) / length
                            );
                        }
                        const getRatingTargetLevel = (
                            rating: number,
                            target: EAchievementTypes
                        ) => {
                            if (target == EAchievementTypes.D) {
                                return 0;
                            }
                            const naiveNevel =
                                rating /
                                (this.RATING_CONSTANTS[target] *
                                    this.RANK_BORDERS[target]);
                            return Math.ceil(naiveNevel * 10) / 10;
                        };
                        function getMilestone(
                            scores: IScore[],
                            length: number
                        ) {
                            const base = getRatingBase(scores, length);
                            let sssTarget, ssspTarget;
                            const sssLevel = getRatingTargetLevel(
                                base,
                                EAchievementTypes.SSS
                            );
                            const ssspLevel = getRatingTargetLevel(
                                base,
                                EAchievementTypes.SSSP
                            );
                            if (sssLevel > 0 && sssLevel < 15) {
                                sssTarget = sssLevel;
                            }
                            if (ssspLevel > 0 && ssspLevel < 15) {
                                ssspTarget = ssspLevel;
                            }
                            if (sssTarget && ssspTarget)
                                return `Next rating boost: lv. ${ssspTarget.toFixed(1)} SSS+/${sssTarget.toFixed(1)} SSS`;
                            else if (sssTarget)
                                return `Next rating boost: lv. ${sssTarget.toFixed(1)} SSS`;
                            else if (ssspTarget)
                                return `Next rating boost: lv. ${ssspTarget.toFixed(1)} SSS+`;
                            else return "Good job!";
                        }
                        await this.drawTextModule(ctx, currentTheme, element, {
                            username: HalfFullWidthConvert.toFullWidth(name),
                            rating: rating.toFixed(0),
                            newScoreRatingAvg: getRatingAvg(
                                newScores,
                                15
                            ).toFixed(0),
                            oldScoreRatingAvg: getRatingAvg(
                                oldScores,
                                35
                            ).toFixed(0),
                            newScoreRatingBase: getRatingBase(
                                newScores,
                                15
                            ).toFixed(0),
                            oldScoreRatingBase: getRatingBase(
                                oldScores,
                                30
                            ).toFixed(0),
                            newScoreMilestone: getMilestone(newScores, 15),
                            oldScoreMilestone: getMilestone(oldScores, 30),
                        });
                        break;
                    }
                }
            }
            return canvas.toBuffer();
        } else return null;
    }
    static async drawWithScoreSource(
        source: ScoreTrackerAdapter,
        username: string,
        options?: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
        }
    ) {
        const profile = await source.getPlayerInfo(username);
        const score = await source.getPlayerBest50(username);
        if (!profile || !score) return null;
        return this.draw(profile.name, profile.rating, score.new, score.old, {
            ...options,
            profilePicture:
                options?.profilePicture === null
                    ? undefined
                    : options?.profilePicture ||
                      (await source.getPlayerProfilePicture(username)) ||
                      undefined,
        });
    }
    private static async getRatingNumber(num: number, theme: ITheme) {
        async function getRaingDigit(
            map: Buffer,
            digit: number,
            unitWidth: number,
            unitHeight: number
        ) {
            digit = Math.floor(digit % 10);
            return await sharp(map)
                .extract({
                    left: (digit % 4) * unitWidth,
                    top: Math.floor(digit / 4) * unitHeight,
                    width: unitWidth,
                    height: unitHeight,
                })
                .toBuffer();
        }
        if (theme.manifest) {
            const map = this.getThemeFile(
                theme.manifest.sprites.dxRatingNumberMap,
                theme.path
            );
            const { width, height } = await sharp(map).metadata();
            if (!(width && height)) return null;
            const unitWidth = width / 4,
                unitHeight = height / 4;
            let digits: (Buffer | null)[] = [];
            while (num > 0) {
                digits.push(
                    await getRaingDigit(map, num % 10, unitWidth, unitHeight)
                );
                num = Math.floor(num / 10);
            }
            while (digits.length < 5) digits.push(null);
            digits = digits.reverse();
            const canvas = new Canvas(unitWidth * digits.length, unitHeight);
            const ctx = canvas.getContext("2d");
            for (let i = 0; i < digits.length; ++i) {
                const curDigit = digits[i];
                if (!curDigit) continue;
                const img = new Image();
                img.src = curDigit;
                ctx.drawImage(img, unitWidth * i * 0.88, 0);
            }
            return canvas.toBuffer();
        }
        return null;
    }
}
