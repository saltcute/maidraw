import sharp from "sharp";
import { EDifficulty } from "../type";
import * as database from "./database";
import { Util } from "@maidraw/lib/util";
import { registerFont, CanvasRenderingContext2D, Image, Canvas } from "canvas";
import Color from "color";
import { globSync } from "glob";
import ScoreTrackerAdapter from "../lib";
import upath from "upath";
import fs from "fs";
import { Best50 } from "../best50";
import stringFormat from "string-template";

export class Chart {
    private static readonly DEFAULT_THEME = "jp-prism";

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
    ): payload is Chart.IThemeManifest {
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
                        case "chart-grid": {
                            if (
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
    private static primaryTheme: Chart.ITheme | null = null;
    static loadTheme(path: string): boolean {
        const theme = this.getTheme(path);
        if (theme) {
            this.primaryTheme = theme;
            return true;
        } else return false;
    }
    private static getTheme(path: string): {
        manifest: Chart.IThemeManifest;
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
    private static async drawImageModule(
        ctx: CanvasRenderingContext2D,
        theme: Chart.ITheme,
        element: Chart.IThemeImageElement
    ) {
        const img = new Image();
        img.src = this.getThemeFile(element.path, theme.path);
        ctx.drawImage(img, element.x, element.y, element.width, element.height);
    }
    private static async drawChartGridModule(
        ctx: CanvasRenderingContext2D,
        theme: Chart.ITheme,
        element: Chart.IThemeChartGridElement,
        chart: Chart.Database.IChart,
        difficulty: EDifficulty,
        x: number,
        y: number,
        score?: Best50.IScore | null
    ) {
        let curColor = "#FFFFFF";
        switch (difficulty) {
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
            let jacket = await Chart.Database.fecthJacket(chart.id);
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
                Util.drawText(
                    ctx,
                    chart.name,
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
            if (score) {
                Util.drawText(
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
            }
            /** End Achievement Rate Draw */

            /** Begin Achievement Rank Draw */
            {
                if (score) {
                    let rankImg: Buffer;
                    switch (score.achievementRank) {
                        case Best50.EAchievementTypes.D:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.d,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.C:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.c,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.B:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.b,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.BB:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.bb,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.BBB:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.bbb,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.A:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.a,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.AA:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.aa,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.AAA:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.aaa,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.S:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.s,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.SP:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.sp,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.SS:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.ss,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.SSP:
                            rankImg = this.getThemeFile(
                                theme.manifest.sprites.achievement.ssp,
                                theme.path
                            );
                            break;
                        case Best50.EAchievementTypes.SSS:
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
            }
            /** End Achievement Rank Draw */

            /** Begin Milestone Draw */
            {
                if (score) {
                    let comboImg: Buffer, syncImg: Buffer;
                    switch (score.combo) {
                        case Best50.EComboTypes.NONE:
                            comboImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.none,
                                theme.path
                            );
                            break;
                        case Best50.EComboTypes.FULL_COMBO:
                            comboImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.fc,
                                theme.path
                            );
                            break;
                        case Best50.EComboTypes.FULL_COMBO_PLUS:
                            comboImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.fcp,
                                theme.path
                            );
                            break;
                        case Best50.EComboTypes.ALL_PERFECT:
                            comboImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.ap,
                                theme.path
                            );
                            break;
                        case Best50.EComboTypes.ALL_PERFECT_PLUS:
                            comboImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.app,
                                theme.path
                            );
                            break;
                    }
                    switch (score.sync) {
                        case Best50.ESyncTypes.NONE:
                            syncImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.none,
                                theme.path
                            );
                            break;
                        case Best50.ESyncTypes.SYNC_PLAY:
                            syncImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.sync,
                                theme.path
                            );
                            break;
                        case Best50.ESyncTypes.FULL_SYNC:
                            syncImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.fs,
                                theme.path
                            );
                            break;
                        case Best50.ESyncTypes.FULL_SYNC_PLUS:
                            syncImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.fsp,
                                theme.path
                            );
                            break;
                        case Best50.ESyncTypes.FULL_SYNC_DX:
                            syncImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.fdx,
                                theme.path
                            );
                            break;
                        case Best50.ESyncTypes.FULL_SYNC_DX_PLUS:
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
            }
            /** End Milestone Draw */

            /** Begin Chart Mode Draw */
            {
                const mode = new Image();
                const chartModeBadgeImg = this.getThemeFile(
                    chart.id > 10000
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

            ctx.restore();
        }
        /** End Main Content Draw */

        /** Begin Difficulty & DX Rating Draw */
        {
            Util.drawText(
                ctx,
                `${chart.level.toFixed(1)}`,
                x + element.scoreBubble.margin * 2,
                y + element.scoreBubble.height * (0.806 + (1 - 0.806) / 2),
                element.scoreBubble.height * 0.806 * 0.128,
                element.scoreBubble.height * 0.806 * 0.04,
                Infinity,
                "left",
                "white",
                new Color(curColor).darken(0.3).hexa()
            );

            Util.drawText(
                ctx,
                chart.meta.maxDXScore.toString(),
                x + element.scoreBubble.width - element.scoreBubble.margin * 2,
                y + element.scoreBubble.height * (0.806 + (1 - 0.806) / 2),
                element.scoreBubble.height * 0.806 * 0.128,
                element.scoreBubble.height * 0.806 * 0.04,
                Infinity,
                "right",
                "white",
                new Color(curColor).darken(0.3).hexa()
            );
        }
        /** End Difficulty & DX Rating Draw */

        ctx.restore();
        /** End Card Draw */
    }
    private static async drawProfileModule(
        ctx: CanvasRenderingContext2D,
        theme: Chart.ITheme,
        element: Chart.IThemeProfileElement,
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
                case rating >= 15000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.rainbow,
                        theme.path
                    );
                    break;
                }
                case rating >= 14500: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.platinum,
                        theme.path
                    );
                    break;
                }
                case rating >= 14000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.gold,
                        theme.path
                    );
                    break;
                }
                case rating >= 13000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.silver,
                        theme.path
                    );
                    break;
                }
                case rating >= 12000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.bronze,
                        theme.path
                    );
                    break;
                }
                case rating >= 10000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.purple,
                        theme.path
                    );
                    break;
                }
                case rating >= 8000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.red,
                        theme.path
                    );
                    break;
                }
                case rating >= 6000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.yellow,
                        theme.path
                    );
                    break;
                }
                case rating >= 4000: {
                    dxRatingImg = this.getThemeFile(
                        theme.manifest.sprites.dxRating.green,
                        theme.path
                    );
                    break;
                }
                case rating >= 2000: {
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

            Util.drawText(
                ctx,
                Util.HalfFullWidthConvert.toFullWidth(username),
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
        theme: Chart.ITheme,
        element: Chart.IThemeTextElement,
        variables: Record<string, string> = {}
    ) {
        let naiveLines = stringFormat(element.content, variables).split("\n");
        let lines: string[] = [];
        if (element.linebreak) {
            for (let originalContent of naiveLines) {
                while (originalContent.length) {
                    const line = Util.findMaxFitString(
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
                    Util.findMaxFitString(
                        ctx,
                        originalContent,
                        element.width || Infinity
                    )
                );
            }
        }
        for (let i = 0; i < lines.length; ++i) {
            const line = lines[i];
            Util.drawText(
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
        chartId: number,
        scores: (Best50.IScore | null)[],
        options?: { scale?: number; theme?: string; profilePicture?: Buffer }
    ): Promise<Buffer | null> {
        let currentTheme = this.primaryTheme;
        if (options?.theme) {
            const theme = this.getTheme(options.theme);
            if (theme) {
                currentTheme = theme;
            }
        }
        console.log(currentTheme);
        if (currentTheme) {
            await Chart.Database.cacheJackets([chartId]);
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
                    case "chart-grid": {
                        for (
                            let y = element.y, i = EDifficulty.BASIC;
                            i < EDifficulty.REMASTER;
                            ++i,
                                y +=
                                    element.scoreBubble.width +
                                    element.scoreBubble.gap
                        ) {
                            const chart = await Chart.Database.getLocalChart(
                                chartId,
                                i
                            );
                            if (chart)
                                await this.drawChartGridModule(
                                    ctx,
                                    currentTheme,
                                    element,
                                    chart,
                                    i,
                                    element.x,
                                    y,
                                    scores[i]
                                );
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
                        await this.drawTextModule(ctx, currentTheme, element, {
                            username:
                                Util.HalfFullWidthConvert.toFullWidth(name),
                            rating: rating.toFixed(0),
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
        chartId: number,
        options?: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
        }
    ) {
        const profile = await source.getPlayerInfo(username);
        const score = await source.getPlayerScore(username, chartId);
        if (!profile || !score) return null;
        return this.draw(
            profile.name,
            profile.rating,
            chartId,
            [
                score.basic,
                score.advanced,
                score.expert,
                score.master,
                score.remaster,
                score.utage,
            ],
            {
                ...options,
                profilePicture:
                    options?.profilePicture === null
                        ? undefined
                        : options?.profilePicture ||
                          (await source.getPlayerProfilePicture(username)) ||
                          undefined,
            }
        );
    }
    private static async getRatingNumber(num: number, theme: Chart.ITheme) {
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
export namespace Chart {
    export import Database = database.Database;

    export interface ITheme {
        manifest: IThemeManifest;
        path: string;
    }

    export interface IThemeManifest {
        displayName: string;
        name: string;
        width: number;
        height: number;
        sprites: IThemeSprites;
        elements: IThemeElements[];
    }

    export interface IThemeSprites {
        achievement: {
            d: string;
            c: string;
            b: string;
            bb: string;
            bbb: string;
            a: string;
            aa: string;
            aaa: string;
            s: string;
            sp: string;
            ss: string;
            ssp: string;
            sss: string;
            sssp: string;
        };
        mode: {
            standard: string;
            dx: string;
        };
        milestone: {
            ap: string;
            app: string;
            fc: string;
            fcp: string;
            fdx: string;
            fdxp: string;
            fs: string;
            fsp: string;
            sync: string;
            none: string;
        };
        dxRating: {
            white: string;
            blue: string;
            green: string;
            yellow: string;
            red: string;
            purple: string;
            bronze: string;
            silver: string;
            gold: string;
            platinum: string;
            rainbow: string;
        };
        dxRatingNumberMap: string;
        profile: {
            icon: string;
            nameplate: string;
        };
    }

    export type IThemeElements =
        | IThemeProfileElement
        | IThemeChartGridElement
        | IThemeImageElement
        | IThemeTextElement;

    export interface IThemeElement {
        type: string;
        x: number;
        y: number;
    }

    export interface IThemeProfileElement extends IThemeElement {
        type: "profile";
        height: number;
    }

    export interface IThemeChartGridElement extends IThemeElement {
        type: "chart-grid";
        scoreBubble: {
            width: number;
            height: number;
            margin: number;
            gap: number;
            color: {
                basic: string;
                advanced: string;
                expert: string;
                master: string;
                remaster: string;
                utage: string;
            };
        };
    }

    export interface IThemeImageElement extends IThemeElement {
        type: "image";
        width: number;
        height: number;
        /**
         * Relative path from the manifest file to the element file.
         */
        path: string;
    }
    export interface IThemeTextElement extends IThemeElement {
        type: "text";
        size: number;
        content: string;
        /**
         * If width is provied and the text is too long, it will be cut off.
         */
        width?: number;
        /**
         * If height is provied and the text is too big, it will be cut off.
         */
        height?: number;
        /**
         * If true, instead of cutting off the text, it will change to a new line.
         * Height restrictions will still apply.
         */
        linebreak?: boolean;
        /**
         * Text alignment.
         * Defaults to left.
         */
        align?: "left" | "center" | "right";
        /**
         * Text color.
         * Defaults to white (#FFFFFF).
         */
        color?: string;
        /**
         * Text border color.
         * Defaults a darker variant of `color`.
         */
        borderColor?: string;
        /**
         * Text font. Please make sure the font is available in the environment.
         * Defaults to a preconfigured font macro. Check source code for more info.
         */
        font?: string;
    }
}
