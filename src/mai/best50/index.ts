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
                        function getRatingBase(scores: IScore[]) {
                            return (
                                scores
                                    .map((v) => v.dxRating)
                                    .sort((a, b) => a - b)[0] || 0
                            );
                        }
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
                        function getMilestone(scores: IScore[]) {
                            const MILESTONES_SSSP: Record<string, number> = {
                                "15.0": 337,
                                "14.9": 335,
                                "14.8": 333,
                                "14.7": 330,
                                "14.6": 328,
                                "14.5": 326,
                                "14.4": 324,
                                "14.3": 321,
                                "14.2": 319,
                                "14.1": 317,
                                "14.0": 315,
                                "13.9": 312,
                                "13.8": 310,
                                "13.7": 308,
                                "13.6": 306,
                                "13.5": 303,
                                "13.4": 301,
                                "13.3": 299,
                                "13.2": 297,
                                "13.1": 294,
                                "13.0": 292,
                                "12.9": 290,
                                "12.8": 288,
                                "12.7": 285,
                                "12.6": 283,
                                "12.5": 281,
                                "12.4": 279,
                                "12.3": 276,
                                "12.2": 274,
                                "12.1": 272,
                                "12.0": 270,
                                "11.9": 267,
                                "11.8": 265,
                                "11.7": 263,
                                "11.6": 261,
                                "11.5": 258,
                                "11.4": 256,
                                "11.3": 254,
                                "11.2": 252,
                                "11.1": 249,
                                "11.0": 247,
                                "10.9": 245,
                                "10.8": 243,
                                "10.7": 240,
                                "10.6": 238,
                                "10.5": 236,
                                "10.4": 234,
                                "10.3": 231,
                                "10.2": 229,
                                "10.1": 227,
                                "10.0": 225,
                                "9.9": 222,
                                "9.8": 220,
                                "9.7": 218,
                                "9.6": 216,
                                "9.5": 213,
                                "9.4": 211,
                                "9.3": 209,
                                "9.2": 207,
                                "9.1": 204,
                                "9.0": 202,
                                "8.9": 200,
                                "8.8": 198,
                                "8.7": 195,
                                "8.6": 193,
                                "8.5": 191,
                                "8.4": 189,
                                "8.3": 186,
                                "8.2": 184,
                                "8.1": 182,
                                "8.0": 180,
                                "7.9": 177,
                                "7.8": 175,
                                "7.7": 173,
                                "7.6": 171,
                                "7.5": 168,
                                "7.4": 166,
                                "7.3": 164,
                                "7.2": 162,
                                "7.1": 159,
                                "7.0": 157,
                                "6.9": 155,
                                "6.8": 153,
                                "6.7": 150,
                                "6.6": 148,
                                "6.5": 146,
                                "6.4": 144,
                                "6.3": 141,
                                "6.2": 139,
                                "6.1": 137,
                                "6.0": 135,
                                "5.9": 132,
                                "5.8": 130,
                                "5.7": 128,
                                "5.6": 126,
                                "5.5": 123,
                                "5.4": 121,
                                "5.3": 119,
                                "5.2": 117,
                                "5.1": 114,
                                "5.0": 112,
                                "4.9": 110,
                                "4.8": 108,
                                "4.7": 105,
                                "4.6": 103,
                                "4.5": 101,
                                "4.4": 99,
                                "4.3": 96,
                                "4.2": 94,
                                "4.1": 92,
                                "4.0": 90,
                                "3.9": 87,
                                "3.8": 85,
                                "3.7": 83,
                                "3.6": 81,
                                "3.5": 78,
                                "3.4": 76,
                                "3.3": 74,
                                "3.2": 72,
                                "3.1": 69,
                                "3.0": 67,
                                "2.9": 65,
                                "2.8": 63,
                                "2.7": 60,
                                "2.6": 58,
                                "2.5": 56,
                                "2.4": 54,
                                "2.3": 51,
                                "2.2": 49,
                                "2.1": 47,
                                "2.0": 45,
                                "1.9": 42,
                                "1.8": 40,
                                "1.7": 38,
                                "1.6": 36,
                                "1.5": 33,
                                "1.4": 31,
                                "1.3": 29,
                                "1.2": 27,
                                "1.1": 24,
                                "1.0": 22,
                            };
                            const MILESTONES_SSS: Record<string, number> = {
                                "15.0": 324,
                                "14.9": 321,
                                "14.8": 319,
                                "14.7": 317,
                                "14.6": 315,
                                "14.5": 313,
                                "14.4": 311,
                                "14.3": 308,
                                "14.2": 306,
                                "14.1": 304,
                                "14.0": 302,
                                "13.9": 300,
                                "13.8": 298,
                                "13.7": 295,
                                "13.6": 293,
                                "13.5": 291,
                                "13.4": 289,
                                "13.3": 287,
                                "13.2": 285,
                                "13.1": 282,
                                "13.0": 280,
                                "12.9": 278,
                                "12.8": 276,
                                "12.7": 274,
                                "12.6": 272,
                                "12.5": 270,
                                "12.4": 267,
                                "12.3": 265,
                                "12.2": 263,
                                "12.1": 261,
                                "12.0": 259,
                                "11.9": 257,
                                "11.8": 254,
                                "11.7": 252,
                                "11.6": 250,
                                "11.5": 248,
                                "11.4": 246,
                                "11.3": 244,
                                "11.2": 241,
                                "11.1": 239,
                                "11.0": 237,
                                "10.9": 235,
                                "10.8": 233,
                                "10.7": 231,
                                "10.6": 228,
                                "10.5": 226,
                                "10.4": 224,
                                "10.3": 222,
                                "10.2": 220,
                                "10.1": 218,
                                "10.0": 216,
                                "9.9": 213,
                                "9.8": 211,
                                "9.7": 209,
                                "9.6": 207,
                                "9.5": 205,
                                "9.4": 203,
                                "9.3": 200,
                                "9.2": 198,
                                "9.1": 196,
                                "9.0": 194,
                                "8.9": 192,
                                "8.8": 190,
                                "8.7": 187,
                                "8.6": 185,
                                "8.5": 183,
                                "8.4": 181,
                                "8.3": 179,
                                "8.2": 177,
                                "8.1": 174,
                                "8.0": 172,
                                "7.9": 170,
                                "7.8": 168,
                                "7.7": 166,
                                "7.6": 164,
                                "7.5": 162,
                                "7.4": 159,
                                "7.3": 157,
                                "7.2": 155,
                                "7.1": 153,
                                "7.0": 151,
                                "6.9": 149,
                                "6.8": 146,
                                "6.7": 144,
                                "6.6": 142,
                                "6.5": 140,
                                "6.4": 138,
                                "6.3": 136,
                                "6.2": 133,
                                "6.1": 131,
                                "6.0": 129,
                                "5.9": 127,
                                "5.8": 125,
                                "5.7": 123,
                                "5.6": 120,
                                "5.5": 118,
                                "5.4": 116,
                                "5.3": 114,
                                "5.2": 112,
                                "5.1": 110,
                                "5.0": 108,
                                "4.9": 105,
                                "4.8": 103,
                                "4.7": 101,
                                "4.6": 99,
                                "4.5": 97,
                                "4.4": 95,
                                "4.3": 92,
                                "4.2": 90,
                                "4.1": 88,
                                "4.0": 86,
                                "3.9": 84,
                                "3.8": 82,
                                "3.7": 79,
                                "3.6": 77,
                                "3.5": 75,
                                "3.4": 73,
                                "3.3": 71,
                                "3.2": 69,
                                "3.1": 66,
                                "3.0": 64,
                                "2.9": 62,
                                "2.8": 60,
                                "2.7": 58,
                                "2.6": 56,
                                "2.5": 54,
                                "2.4": 51,
                                "2.3": 49,
                                "2.2": 47,
                                "2.1": 45,
                                "2.0": 43,
                                "1.9": 41,
                                "1.8": 38,
                                "1.7": 36,
                                "1.6": 34,
                                "1.5": 32,
                                "1.4": 30,
                                "1.3": 28,
                                "1.2": 25,
                                "1.1": 23,
                                "1.0": 21,
                            };
                            const base = getRatingBase(scores);
                            let sssTarget, ssspTarget;
                            for (const level in MILESTONES_SSSP) {
                                const rating = MILESTONES_SSSP[level];
                                if (base >= rating) {
                                    if (level == "15.0") {
                                        ssspTarget = undefined;
                                    } else {
                                        ssspTarget = level;
                                    }
                                    break;
                                }
                            }
                            for (const level in MILESTONES_SSS) {
                                const rating = MILESTONES_SSS[level];
                                if (base >= rating) {
                                    if (level == "15.0") {
                                        sssTarget = undefined;
                                    } else {
                                        sssTarget = level;
                                    }
                                    break;
                                }
                            }
                            if (sssTarget && ssspTarget)
                                return `Next rating boost: lv. ${(parseFloat(ssspTarget) + 0.1).toFixed(1)} SSS+/${(parseFloat(sssTarget) + 0.1).toFixed(1)} SSS`;
                            else if (sssTarget)
                                return `Next rating boost: lv. ${(parseFloat(sssTarget) + 0.1).toFixed(1)} SSS`;
                            else if (ssspTarget)
                                return `Next rating boost: lv. ${(parseFloat(ssspTarget) + 0.1).toFixed(1)} SSS+`;
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
                            newScoreRatingBase:
                                getRatingBase(newScores).toFixed(0),
                            oldScoreRatingBase:
                                getRatingBase(oldScores).toFixed(0),
                            newScoreMilestone: getMilestone(newScores),
                            oldScoreMilestone: getMilestone(oldScores),
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
