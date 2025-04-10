import fs from "fs";
import upath from "upath";
import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    ESyncTypes,
    IScore,
    IThemeManifest,
} from "../../type";
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

export { LXNS } from "./lib/lxns";
export { KamaiTachi } from "./lib/kamaiTachi";
export { DivingFish } from "./lib/divingFish";

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

export class Best50 {
    private get assetsPath() {
        return upath.join(__dirname, "..", "assets");
    }
    private themes: Record<string, string> = {};
    hasTheme(name: string): boolean {
        return !!this.themes[name];
    }
    constructor() {
        const manifests = globSync(
            upath.join(this.assetsPath, "themes", "**", "manifest.json")
        );
        for (const manifestPath of manifests) {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
            if (this.validateManifest(manifest, upath.dirname(manifestPath))) {
                this.themes[manifest.name] = upath.dirname(manifestPath);
            }
        }
        const loadThemeResult = this.loadTheme("cn-2024-landscape");
        // const loadThemeResult = this.loadTheme("jp-buddiesplus-portrait");
        // const loadThemeResult = this.loadTheme("jp-buddiesplus-landscape");
        // const loadThemeResult = this.loadTheme("jp-buddies-landscape");
        if (!loadThemeResult) {
            console.error("Failed to load theme.");
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

    private validateManifest(
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
                        default:
                            return false;
                    }
                }
            }
            return true;
        } else return false;
    }
    private primaryTheme: IThemeManifest | null = null;
    private primaryThemePath: string | null = null;
    loadTheme(path: string): boolean {
        const theme = this.getTheme(path);
        if (theme) {
            this.primaryTheme = theme.manifest;
            this.primaryThemePath = theme.path;
            return true;
        } else return false;
    }
    private getTheme(path: string): {
        manifest: IThemeManifest;
        path: string;
    } | null {
        if (
            !fs.existsSync(upath.join(this.assetsPath, path, "manifest.json"))
        ) {
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
    private getThemeFile(path: string, themePath: string): Buffer {
        if (
            typeof path == "string" &&
            fs.existsSync(upath.join(themePath ?? this.primaryThemePath, path))
        )
            return fs.readFileSync(
                upath.join(themePath ?? this.primaryThemePath, path)
            );
        else return Buffer.from([]);
    }
    async draw(
        name: string,
        rating: number,
        newScores: IScore[],
        oldScores: IScore[],
        options?: { scale?: number; theme?: string }
    ): Promise<Buffer | null> {
        function drawText(
            ctx: CanvasRenderingContext2D,
            str: string,
            x: number,
            y: number,
            fontSize: number,
            linewidth: number,
            maxWidth: number,
            textAlign: "left" | "center" | "right" = "left",
            mainColor: string | CanvasGradient | CanvasPattern = "white",
            borderColor: string | CanvasGradient | CanvasPattern = "black",
            font: string = `"standard-font-title-latin", "standard-font-title-jp"`
        ) {
            function findMaxFitString(original: string) {
                const metrics = ctx.measureText(original);
                if (metrics.width <= maxWidth) return original;
                for (let i = 1; i < original.length; ++i) {
                    let cur = original.slice(0, original.length - i);
                    if (ctx.measureText(cur + "...").width <= maxWidth) {
                        while (cur[cur.length - 1] == "　") {
                            cur = cur.substring(0, cur.length - 1);
                        }
                        return cur.trim() + "...";
                    }
                }
                return original;
            }

            ctx.font = `${fontSize}px ${font}`;
            str = findMaxFitString(str);
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
        await Chart.Database.cacheJackets([
            ...newScores.map((v) => v.chart.id),
            ...oldScores.map((v) => v.chart.id),
        ]);
        let currentTheme = this.primaryTheme,
            currentThemePath = this.primaryThemePath;
        if (options?.theme) {
            const theme = this.getTheme(options.theme);
            if (theme) {
                currentTheme = theme.manifest;
                currentThemePath = theme.path;
            }
        }
        if (currentTheme && currentThemePath) {
            const canvas = new Canvas(
                currentTheme.width * (options?.scale ?? 1),
                currentTheme.height * (options?.scale ?? 1)
            );
            const ctx = canvas.getContext("2d");
            if (options?.scale) ctx.scale(options.scale, options.scale);
            ctx.imageSmoothingEnabled = true;
            for (const element of currentTheme.elements) {
                switch (element.type) {
                    case "image": {
                        const img = new Image();
                        img.src = this.getThemeFile(
                            element.path,
                            currentThemePath
                        );
                        ctx.drawImage(
                            img,
                            element.x,
                            element.y,
                            element.width,
                            element.height
                        );
                        break;
                    }
                    case "score-grid": {
                        const promises: Promise<void>[] = [];
                        for (
                            let cury = element.y,
                                curindex = element.index,
                                i = 0;
                            i < element.verticalSize;
                            ++i,
                                cury +=
                                    element.scoreBubble.height +
                                    element.scoreBubble.gap
                        ) {
                            for (
                                let curx = element.x, j = 0;
                                j < element.horizontalSize;
                                ++j,
                                    ++curindex,
                                    curx +=
                                        element.scoreBubble.width +
                                        element.scoreBubble.gap
                            ) {
                                let curScore: IScore | undefined;
                                if (element.region == "new")
                                    curScore = newScores[curindex];
                                else curScore = oldScores[curindex];
                                if (curScore) {
                                    let curColor = "#FFFFFF";
                                    switch (curScore.chart.difficulty) {
                                        case EDifficulty.BASIC:
                                            curColor =
                                                element.scoreBubble.color.basic;
                                            break;
                                        case EDifficulty.ADVANCED:
                                            curColor =
                                                element.scoreBubble.color
                                                    .advanced;
                                            break;
                                        case EDifficulty.EXPERT:
                                            curColor =
                                                element.scoreBubble.color
                                                    .expert;
                                            break;
                                        case EDifficulty.MASTER:
                                            curColor =
                                                element.scoreBubble.color
                                                    .master;
                                            break;
                                        case EDifficulty.REMASTER:
                                            curColor =
                                                element.scoreBubble.color
                                                    .remaster;
                                            break;
                                        case EDifficulty.UTAGE:
                                            curColor =
                                                element.scoreBubble.color.utage;
                                            break;
                                    }

                                    /** Begin Card Draw */
                                    ctx.save();
                                    ctx.fillStyle = new Color(curColor)
                                        .lighten(0.4)
                                        .hexa();
                                    ctx.beginPath();
                                    ctx.roundRect(
                                        curx,
                                        cury,
                                        element.scoreBubble.width,
                                        element.scoreBubble.height,
                                        (element.scoreBubble.height * 0.806) / 7
                                    );
                                    ctx.strokeStyle = new Color(curColor)
                                        .darken(0.3)
                                        .hexa();
                                    ctx.lineWidth =
                                        element.scoreBubble.margin / 4;
                                    ctx.stroke();
                                    ctx.fill();
                                    ctx.beginPath();
                                    ctx.roundRect(
                                        curx,
                                        cury,
                                        element.scoreBubble.width,
                                        element.scoreBubble.height,
                                        (element.scoreBubble.height * 0.806) / 7
                                    );
                                    ctx.clip();

                                    /** Begin Main Content Draw */
                                    ctx.save();
                                    ctx.beginPath();
                                    ctx.roundRect(
                                        curx,
                                        cury,
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

                                    const jacketMaskGrad =
                                        ctx.createLinearGradient(
                                            curx + jacketSize / 2,
                                            cury + jacketSize / 2,
                                            curx + jacketSize,
                                            cury + jacketSize / 2
                                        );
                                    jacketMaskGrad.addColorStop(
                                        0,
                                        new Color(curColor).alpha(0).hexa()
                                    );
                                    jacketMaskGrad.addColorStop(
                                        0.25,
                                        new Color(curColor).alpha(0.2).hexa()
                                    );
                                    jacketMaskGrad.addColorStop(
                                        1,
                                        new Color(curColor).alpha(1).hexa()
                                    );
                                    const jacketMaskGradDark =
                                        ctx.createLinearGradient(
                                            curx + jacketSize / 2,
                                            cury + jacketSize / 2,
                                            curx + jacketSize,
                                            cury + jacketSize / 2
                                        );
                                    jacketMaskGradDark.addColorStop(
                                        0,
                                        new Color(curColor)
                                            .darken(0.3)
                                            .alpha(0)
                                            .hexa()
                                    );
                                    jacketMaskGradDark.addColorStop(
                                        0.25,
                                        new Color(curColor)
                                            .darken(0.3)
                                            .alpha(0.2)
                                            .hexa()
                                    );
                                    jacketMaskGradDark.addColorStop(
                                        1,
                                        new Color(curColor)
                                            .darken(0.3)
                                            .alpha(1)
                                            .hexa()
                                    );

                                    /** Begin Jacket Draw*/
                                    let jacket =
                                        await Chart.Database.fecthJacket(
                                            curScore.chart.id
                                        );
                                    if (!jacket)
                                        jacket =
                                            await Chart.Database.fecthJacket(0);
                                    if (jacket) {
                                        const img = new Image();
                                        img.src = jacket;
                                        ctx.drawImage(
                                            img,
                                            curx,
                                            cury,
                                            jacketSize,
                                            jacketSize
                                        );
                                    } else {
                                        ctx.fillStyle = "#b6ffab";
                                        ctx.fillRect(
                                            curx,
                                            cury,
                                            jacketSize,
                                            jacketSize
                                        );
                                    }
                                    /** End Jacket Draw*/

                                    /** Begin Jacket Gradient Mask Draw*/ {
                                        ctx.fillStyle = jacketMaskGrad;
                                        ctx.fillRect(
                                            curx + jacketSize / 2,
                                            cury,
                                            (jacketSize * 3) / 4,
                                            jacketSize
                                        );
                                    } /** End Jacket Gradient Mask Draw*/

                                    ctx.beginPath();
                                    ctx.roundRect(
                                        curx + element.scoreBubble.margin,
                                        cury + element.scoreBubble.margin,
                                        element.scoreBubble.width -
                                            element.scoreBubble.margin * 2,
                                        element.scoreBubble.height * 0.806 -
                                            element.scoreBubble.margin * 2,
                                        (element.scoreBubble.height * 0.806 -
                                            element.scoreBubble.margin * 2) /
                                            7
                                    );

                                    /** Begin Title Draw */ {
                                        drawText(
                                            ctx,
                                            curScore.chart.name,
                                            curx + (jacketSize * 7) / 8,
                                            cury +
                                                element.scoreBubble.margin +
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    0.144,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.144,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.04,
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
                                            curx + (jacketSize * 13) / 16,
                                            cury +
                                                element.scoreBubble.margin +
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    (0.144 + 0.072),
                                            element.scoreBubble.width -
                                                (jacketSize * 13) / 16 -
                                                element.scoreBubble.margin * 2,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.02,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.16
                                        );
                                        ctx.fillStyle = jacketMaskGradDark;
                                        ctx.fill();
                                    } /** End Separation Line Draw */

                                    /** Begin Achievement Rate Draw */
                                    drawText(
                                        ctx,
                                        `${curScore.achievement.toFixed(4)}%`,
                                        curx -
                                            element.scoreBubble.margin -
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.02 +
                                            element.scoreBubble.width,
                                        cury +
                                            element.scoreBubble.margin +
                                            element.scoreBubble.height *
                                                0.806 *
                                                (0.144 + 0.144 + 0.208 - 0.04),
                                        element.scoreBubble.height *
                                            0.806 *
                                            0.208,
                                        element.scoreBubble.height *
                                            0.806 *
                                            0.04,
                                        Infinity,
                                        "right",
                                        "white",
                                        new Color(curColor).darken(0.3).hexa()
                                    );
                                    /** End Achievement Rate Draw */

                                    /** Begin Achievement Rank Draw */
                                    {
                                        let rankImg: Buffer;
                                        switch (curScore.achievementRank) {
                                            case EAchievementTypes.D:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.d,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.C:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.c,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.B:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.b,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.BB:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.bb,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.BBB:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.bbb,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.A:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.a,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.AA:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.aa,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.AAA:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.aaa,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.S:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.s,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.SP:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.sp,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.SS:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.ss,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.SSP:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.ssp,
                                                    currentThemePath
                                                );
                                                break;
                                            case EAchievementTypes.SSS:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.sss,
                                                    currentThemePath
                                                );
                                                break;
                                            default:
                                                rankImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .achievement.sssp,
                                                    currentThemePath
                                                );
                                        }
                                        const img = new Image();
                                        img.src = rankImg;
                                        ctx.drawImage(
                                            img,
                                            curx + jacketSize,
                                            cury +
                                                element.scoreBubble.margin +
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    (0.144 +
                                                        0.144 +
                                                        0.208 +
                                                        0.02),
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.3 *
                                                2.133,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.3
                                        );
                                    }
                                    /** End Achievement Rank Draw */

                                    /** Begin Milestone Draw */
                                    {
                                        let comboImg: Buffer, syncImg: Buffer;
                                        switch (curScore.combo) {
                                            case EComboTypes.NONE:
                                                comboImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.none,
                                                    currentThemePath
                                                );
                                                break;
                                            case EComboTypes.FULL_COMBO:
                                                comboImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.fc,
                                                    currentThemePath
                                                );
                                                break;
                                            case EComboTypes.FULL_COMBO_PLUS:
                                                comboImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.fcp,
                                                    currentThemePath
                                                );
                                                break;
                                            case EComboTypes.ALL_PERFECT:
                                                comboImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.ap,
                                                    currentThemePath
                                                );
                                                break;
                                            case EComboTypes.ALL_PERFECT_PLUS:
                                                comboImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.app,
                                                    currentThemePath
                                                );
                                                break;
                                        }
                                        switch (curScore.sync) {
                                            case ESyncTypes.NONE:
                                                syncImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.none,
                                                    currentThemePath
                                                );
                                                break;
                                            case ESyncTypes.SYNC_PLAY:
                                                syncImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.sync,
                                                    currentThemePath
                                                );
                                                break;
                                            case ESyncTypes.FULL_SYNC:
                                                syncImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.fs,
                                                    currentThemePath
                                                );
                                                break;
                                            case ESyncTypes.FULL_SYNC_PLUS:
                                                syncImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.fsp,
                                                    currentThemePath
                                                );
                                                break;
                                            case ESyncTypes.FULL_SYNC_DX:
                                                syncImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.fdx,
                                                    currentThemePath
                                                );
                                                break;
                                            case ESyncTypes.FULL_SYNC_DX_PLUS:
                                                syncImg = this.getThemeFile(
                                                    currentTheme.sprites
                                                        .milestone.fdxp,
                                                    currentThemePath
                                                );
                                                break;
                                        }
                                        const combo = new Image();
                                        combo.src = comboImg;
                                        ctx.drawImage(
                                            combo,
                                            curx +
                                                (jacketSize * 7) / 8 +
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    (0.32 * 2.133 + 0.06),
                                            cury +
                                                element.scoreBubble.margin +
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    (0.144 +
                                                        0.144 +
                                                        0.208 +
                                                        0.01),
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.32,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.32
                                        );
                                        const sync = new Image();
                                        sync.src = syncImg;
                                        ctx.drawImage(
                                            sync,
                                            curx +
                                                (jacketSize * 7) / 8 +
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    (0.32 * 2.133 +
                                                        0.04 +
                                                        0.32),
                                            cury +
                                                element.scoreBubble.margin +
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    (0.144 +
                                                        0.144 +
                                                        0.208 +
                                                        0.01),
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.32,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.32
                                        );
                                    }
                                    /** End Milestone Draw */

                                    /** Begin Chart Mode Draw */
                                    {
                                        const mode = new Image();
                                        const chartModeBadgeImg =
                                            this.getThemeFile(
                                                curScore.chart.id > 10000
                                                    ? currentTheme.sprites.mode
                                                          .dx
                                                    : currentTheme.sprites.mode
                                                          .standard,
                                                currentThemePath
                                            );
                                        const { width, height } =
                                            await sharp(
                                                chartModeBadgeImg
                                            ).metadata();
                                        const aspectRatio =
                                            (width ?? 0) / (height ?? 1) || 3;
                                        mode.src = chartModeBadgeImg;
                                        const drawHeight = (jacketSize * 6) / 8;
                                        ctx.drawImage(
                                            mode,
                                            curx +
                                                ((jacketSize * 7) / 8 -
                                                    drawHeight) /
                                                    2,
                                            cury +
                                                element.scoreBubble.margin +
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    0.02,
                                            drawHeight,
                                            drawHeight / aspectRatio
                                        );
                                    }
                                    /** End Chart Mode Draw */

                                    /** Begin Bests Index Draw */ {
                                        drawText(
                                            ctx,
                                            `#${curindex + 1}`,
                                            curx +
                                                element.scoreBubble.margin * 2,
                                            cury +
                                                jacketSize -
                                                element.scoreBubble.margin * 2,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.128,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.04,
                                            Infinity,
                                            "left",
                                            "white",
                                            new Color(curColor)
                                                .darken(0.3)
                                                .hexa()
                                        );
                                    } /** End Bests Index Draw */

                                    ctx.restore();
                                    /** End Main Content Draw */

                                    /** Begin Difficulty & DX Rating Draw */ {
                                        drawText(
                                            ctx,
                                            `${curScore.chart.level.toFixed(1)}  ↑${curScore.dxRating.toFixed(0)}`,
                                            curx +
                                                element.scoreBubble.margin * 2,
                                            cury +
                                                element.scoreBubble.height *
                                                    (0.806 + (1 - 0.806) / 2),
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.128,
                                            element.scoreBubble.height *
                                                0.806 *
                                                0.04,
                                            Infinity,
                                            "left",
                                            "white",
                                            new Color(curColor)
                                                .darken(0.3)
                                                .hexa()
                                        );

                                        if (curScore.chart.maxDxScore) {
                                            drawText(
                                                ctx,
                                                `${curScore.dxScore}/${curScore.chart.maxDxScore}`,
                                                curx +
                                                    element.scoreBubble.width -
                                                    element.scoreBubble.margin *
                                                        2,
                                                cury +
                                                    element.scoreBubble.height *
                                                        (0.806 +
                                                            (1 - 0.806) / 2),
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    0.128,
                                                element.scoreBubble.height *
                                                    0.806 *
                                                    0.04,
                                                Infinity,
                                                "right",
                                                "white",
                                                new Color(curColor)
                                                    .darken(0.3)
                                                    .hexa()
                                            );
                                        }
                                    } /** End Difficulty & DX Rating Draw */

                                    ctx.restore();
                                }
                            }
                        }
                        break;
                    }
                    case "profile": {
                        const nameplate = new Image();
                        nameplate.src = this.getThemeFile(
                            currentTheme.sprites.profile.nameplate,
                            currentThemePath
                        );
                        ctx.drawImage(
                            nameplate,
                            element.x,
                            element.y,
                            element.height * 6.207,
                            element.height
                        );
                        const icon = new Image();
                        icon.src = this.getThemeFile(
                            currentTheme.sprites.profile.icon,
                            currentThemePath
                        );
                        ctx.drawImage(
                            icon,
                            element.x + element.height * 0.064,
                            element.y + element.height * 0.064,
                            element.height * 0.872,
                            element.height * 0.872
                        );
                        const dxRating = new Image();
                        let dxRatingImg: Buffer;
                        switch (true) {
                            case rating > 15000: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.rainbow,
                                    currentThemePath
                                );
                                break;
                            }
                            case rating > 14500: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.platinum,
                                    currentThemePath
                                );
                                break;
                            }
                            case rating > 14000: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.gold,
                                    currentThemePath
                                );
                                break;
                            }
                            case rating > 13000: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.silver,
                                    currentThemePath
                                );
                                break;
                            }
                            case rating > 12000: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.bronze,
                                    currentThemePath
                                );
                                break;
                            }
                            case rating > 10000: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.purple,
                                    currentThemePath
                                );
                                break;
                            }
                            case rating > 8000: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.red,
                                    currentThemePath
                                );
                                break;
                            }
                            case rating > 6000: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.yellow,
                                    currentThemePath
                                );
                                break;
                            }
                            case rating > 4000: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.green,
                                    currentThemePath
                                );
                                break;
                            }
                            case rating > 2000: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.blue,
                                    currentThemePath
                                );
                                break;
                            }
                            default: {
                                dxRatingImg = this.getThemeFile(
                                    currentTheme.sprites.dxRating.white,
                                    currentThemePath
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
                        ctx.roundRect(
                            element.x + element.height * (1 + 1 / 32),
                            element.y +
                                element.height * (0.064 + 0.333 + 1 / 32),
                            ((element.height / 3) * 5.108 * 6) / 5,
                            (element.height * 7) / 24,
                            element.height / 20
                        );
                        ctx.fillStyle = "white";
                        ctx.strokeStyle = Color.rgb(180, 180, 180).hex();
                        ctx.lineWidth = element.height / 32;
                        ctx.stroke();
                        ctx.fill();

                        const ratingImgBuffer = await this.getRatingNumber(
                            rating,
                            {
                                manifest: currentTheme,
                                path: currentThemePath,
                            }
                        );
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

                        drawText(
                            ctx,
                            HalfFullWidthConvert.toFullWidth(name),
                            element.x + element.height * (1 + 1 / 16),
                            element.y +
                                element.height * (0.064 + 0.333 + 1 / 4),
                            (element.height * 1) / 6,
                            0,
                            ((element.height / 3) * 5.108 * 6) / 5,
                            "left",
                            "black",
                            "black",
                            "standard-font-username"
                        );
                        break;
                    }
                }
            }
            return canvas.toBuffer();
        } else return null;
    }
    async drawWithScoreSource(
        source: ScoreTrackerAdapter,
        username: string,
        options?: { scale?: number; theme?: string }
    ) {
        const profile = await source.getPlayerInfo(username);
        const score = await source.getPlayerBest50(username);
        if (!profile || !score) return null;
        return this.draw(
            profile.name,
            profile.rating,
            score.new,
            score.old,
            options
        );
    }
    private async getRatingNumber(
        num: number,
        theme: {
            manifest: IThemeManifest;
            path: string;
        }
    ) {
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
