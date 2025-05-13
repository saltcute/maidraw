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
import _, { last } from "lodash";

export class Chart {
    private static readonly DEFAULT_THEME = "jp-prism";
    private static primaryTheme: Chart.ITheme | null = null;

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
            isObject(payload.sprites.versions) &&
            isObject(payload.sprites.versions.OLD) &&
            isFileExist(payload.sprites.versions.OLD[0]) &&
            isFileExist(payload.sprites.versions.OLD[10]) &&
            isFileExist(payload.sprites.versions.OLD[20]) &&
            isFileExist(payload.sprites.versions.OLD[30]) &&
            isFileExist(payload.sprites.versions.OLD[40]) &&
            isFileExist(payload.sprites.versions.OLD[50]) &&
            isFileExist(payload.sprites.versions.OLD[60]) &&
            isFileExist(payload.sprites.versions.OLD[70]) &&
            isFileExist(payload.sprites.versions.OLD[80]) &&
            isFileExist(payload.sprites.versions.OLD[85]) &&
            isFileExist(payload.sprites.versions.OLD[90]) &&
            isFileExist(payload.sprites.versions.OLD[95]) &&
            isFileExist(payload.sprites.versions.OLD[99]) &&
            isObject(payload.sprites.versions.DX) &&
            isFileExist(payload.sprites.versions.DX[0]) &&
            isFileExist(payload.sprites.versions.DX[5]) &&
            isFileExist(payload.sprites.versions.DX[10]) &&
            isFileExist(payload.sprites.versions.DX[15]) &&
            isFileExist(payload.sprites.versions.DX[20]) &&
            isFileExist(payload.sprites.versions.DX[25]) &&
            isFileExist(payload.sprites.versions.DX[30]) &&
            isFileExist(payload.sprites.versions.DX[35]) &&
            isFileExist(payload.sprites.versions.DX[40]) &&
            isFileExist(payload.sprites.versions.DX[45]) &&
            isFileExist(payload.sprites.versions.DX[50]) &&
            isFileExist(payload.sprites.versions.DX[55]) &&
            isObject(payload.sprites.versions.EX) &&
            isFileExist(payload.sprites.versions.DX[10]) &&
            isFileExist(payload.sprites.versions.DX[15]) &&
            isObject(payload.sprites.versions.CN) &&
            isFileExist(payload.sprites.versions.DX[0]) &&
            isFileExist(payload.sprites.versions.DX[10]) &&
            isFileExist(payload.sprites.versions.DX[20]) &&
            isFileExist(payload.sprites.versions.DX[30]) &&
            isFileExist(payload.sprites.versions.DX[40]) &&
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
                                isNumber(element.width) &&
                                isNumber(element.height) &&
                                isNumber(element.margin) &&
                                isNumber(element.gap) &&
                                isObject(element.bubble) &&
                                isHexColor(element.bubble.color.basic) &&
                                isHexColor(element.bubble.color.advanced) &&
                                isHexColor(element.bubble.color.expert) &&
                                isHexColor(element.bubble.color.master) &&
                                isHexColor(element.bubble.color.remaster) &&
                                isHexColor(element.bubble.color.utage) &&
                                isObject(element.color) &&
                                isHexColor(element.color.card)
                            ) {
                                continue;
                            } else return false;
                        }
                        case "profile": {
                            if (isNumber(element.height)) {
                                continue;
                            } else return false;
                        }
                        case "detail-info": {
                            if (
                                isNumber(element.width) &&
                                isNumber(element.height) &&
                                isNumber(element.margin) &&
                                isObject(element.color) &&
                                isHexColor(element.color.card) &&
                                (isUndefined(element.font) ||
                                    isString(element.font))
                            ) {
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
                upath.join(themePath ?? this.primaryTheme?.path ?? "", path)
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
    private static async drawChartGridCard(
        ctx: CanvasRenderingContext2D,
        theme: Chart.ITheme,
        element: Chart.IThemeChartGridElement,
        chart: Chart.Database.IChart,
        difficulty: EDifficulty,
        x: number,
        y: number,
        width: number,
        height: number,
        isShort: boolean,
        score?: Best50.IScore | null
    ) {
        let curColor = "#FFFFFF";
        switch (difficulty) {
            case EDifficulty.BASIC:
                curColor = element.bubble.color.basic;
                break;
            case EDifficulty.ADVANCED:
                curColor = element.bubble.color.advanced;
                break;
            case EDifficulty.EXPERT:
                curColor = element.bubble.color.expert;
                break;
            case EDifficulty.MASTER:
                curColor = element.bubble.color.master;
                break;
            case EDifficulty.REMASTER:
                curColor = element.bubble.color.remaster;
                break;
            case EDifficulty.UTAGE:
                curColor = element.bubble.color.utage;
                break;
        }

        /** Begin Card Draw */
        ctx.save();
        ctx.fillStyle = new Color(curColor).lighten(0.4).hexa();
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, (height * 0.806) / 7);
        ctx.strokeStyle = new Color(curColor).darken(0.3).hexa();
        ctx.lineWidth = element.bubble.margin / 4;
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, (height * 0.806) / 7);
        ctx.clip();

        /** Begin Main Content Draw */
        {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.clip();
            ctx.fillStyle = curColor;
            ctx.fill();

            const titleSize = height * (47 / 256);
            /** Begin Difficulty Text & Separation Line Draw */
            {
                let difficultiy = "";
                switch (chart.difficulty) {
                    case EDifficulty.BASIC:
                        difficultiy = "BASIC";
                        break;
                    case EDifficulty.ADVANCED:
                        difficultiy = "ADVANCED";
                        break;
                    case EDifficulty.EXPERT:
                        difficultiy = "EXPERT";
                        break;
                    case EDifficulty.MASTER:
                        difficultiy = "MASTER";
                        break;
                    case EDifficulty.REMASTER:
                        difficultiy = "Re:MASTER";
                        break;
                    case EDifficulty.UTAGE:
                        difficultiy = "U·TA·GE";
                        break;
                }
                const levelTextSize = titleSize * (5 / 8);
                Util.drawText(
                    ctx,
                    difficultiy,
                    x + element.bubble.margin,
                    y +
                        element.bubble.margin +
                        titleSize -
                        element.bubble.margin * (1 / 4),
                    titleSize,
                    height * 0.806 * 0.04,
                    Infinity,
                    "left",
                    "white",
                    new Color(curColor).darken(0.3).hexa()
                );
                const difficultyTextWidth = Util.measureText(
                    ctx,
                    difficultiy,
                    titleSize,
                    Infinity
                ).width;
                Util.drawText(
                    ctx,
                    `Lv. ${chart.level.toFixed(1)}${score ? `　↑${score.dxRating}` : ""}`,
                    x + element.bubble.margin * 2 + difficultyTextWidth,
                    y +
                        element.bubble.margin +
                        titleSize -
                        element.bubble.margin * (1 / 4),
                    levelTextSize,
                    height * 0.806 * 0.04,
                    Infinity,
                    "left",
                    "white",
                    new Color(curColor).darken(0.3).hexa()
                );

                ctx.beginPath();
                ctx.roundRect(
                    x + element.bubble.margin,
                    y +
                        element.bubble.margin +
                        titleSize +
                        element.bubble.margin * (1 / 4),
                    height * 2 - element.bubble.margin * 2,
                    height * 0.806 * 0.02,
                    height * 0.806 * 0.16
                );
                ctx.fillStyle = new Color(curColor).darken(0.3).hex();
                ctx.fill();
            }
            /** End Difficulty Text & Separation Line Draw */

            /** Begin Achievement Rate Draw */
            {
                const scoreSize = height * 0.806 * 0.208;
                Util.drawText(
                    ctx,
                    score ? `${score.achievement.toFixed(4)}%` : "NO RECORD",
                    x +
                        height * 2 -
                        element.bubble.margin -
                        height * 0.806 * 0.02,
                    y +
                        element.bubble.margin +
                        titleSize +
                        element.bubble.margin * (5 / 8) +
                        scoreSize,
                    scoreSize,
                    height * 0.806 * 0.04,
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
                        x + element.bubble.margin * (1 / 4),
                        y +
                            element.bubble.margin +
                            titleSize +
                            element.bubble.margin * (1 / 2),
                        height * 0.806 * 0.3 * 2.133,
                        height * 0.806 * 0.3
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
                        x + height * 0.806 * (0.32 * 2.133 + 0.06 - 0.1),
                        y +
                            element.bubble.margin +
                            titleSize +
                            element.bubble.margin * (1 / 2),
                        height * 0.806 * 0.32,
                        height * 0.806 * 0.32
                    );
                    const sync = new Image();
                    sync.src = syncImg;
                    ctx.drawImage(
                        sync,
                        x + height * 0.806 * (0.32 * 2.133 + 0.04 + 0.32 - 0.1),
                        y +
                            element.bubble.margin +
                            titleSize +
                            element.bubble.margin * (1 / 2),
                        height * 0.806 * 0.32,
                        height * 0.806 * 0.32
                    );
                }
            }
            /** End Milestone Draw */

            /** Begin Version Draw */
            {
                let versions: {
                    region: "OLD" | "DX" | "EX" | "CN";
                    version?: database.Database.IVersion;
                    EXAppend: boolean;
                }[] = [];
                for (let i = 0; i < 3; ++i) {
                    versions[i] = {
                        region: "DX",
                        version: undefined,
                        EXAppend: false,
                    };
                }
                const VER_DX =
                    chart.difficulty == EDifficulty.REMASTER
                        ? chart.events.find(
                              (v) =>
                                  v.type == "existence" &&
                                  v.version.region == "DX"
                          )?.version
                        : chart.addVersion.DX;
                const VER_EX =
                    chart.difficulty == EDifficulty.REMASTER
                        ? chart.events.find(
                              (v) =>
                                  v.type == "existence" &&
                                  v.version.region == "EX"
                          )?.version
                        : chart.addVersion.EX;
                const VER_CN =
                    chart.difficulty == EDifficulty.REMASTER
                        ? chart.events.find(
                              (v) =>
                                  v.type == "existence" &&
                                  v.version.region == "CN"
                          )?.version
                        : chart.addVersion.CN;
                if (VER_DX) {
                    const version = versions[0];
                    version.version = VER_DX;
                    version.region = "DX";
                }
                if (VER_EX) {
                    for (let i = 0; i < 3; ++i) {
                        const version = versions[i];
                        if (version.version) {
                            if (
                                !(
                                    version.version.gameVersion.isDX &&
                                    version.version.gameVersion.minor >= 10 &&
                                    version.version.gameVersion.minor < 20
                                ) &&
                                _.isEqual(
                                    versions[i].version?.gameVersion,
                                    VER_EX.gameVersion
                                )
                            ) {
                                versions[i].EXAppend = true;
                                break;
                            }
                        } else {
                            version.version = VER_EX;
                            version.region = "EX";
                            break;
                        }
                    }
                }
                if (VER_CN) {
                    for (let i = 0; i < 3; ++i) {
                        const version = versions[i];
                        if (version.version) {
                            if (
                                !version.version.gameVersion.isDX &&
                                _.isEqual(
                                    versions[i].version?.gameVersion,
                                    VER_CN.gameVersion
                                )
                            ) {
                                break;
                            }
                        } else {
                            version.version = VER_CN;
                            version.region = "CN";
                            break;
                        }
                    }
                }
                let counter = 0;
                for (const version of versions) {
                    if (version.version) {
                        counter++;
                        if (!version.version.gameVersion.isDX)
                            version.region = "OLD";
                    }
                }
                const versionImageHeight =
                    (height - element.bubble.margin * 2) *
                    (isShort ? 1 / 4 : 3 / 8);
                const versionImageWidth = (versionImageHeight / 160) * 332;
                const regionTextSize = versionImageHeight * (5 / 8);
                for (
                    let i = 0,
                        curx = x + width - element.bubble.margin,
                        cury = y + element.bubble.margin;
                    i < versions.length;
                    ++i,
                        cury =
                            curx - versionImageWidth - regionTextSize <
                            x + height * 2
                                ? cury + versionImageHeight
                                : cury,
                        curx =
                            curx - versionImageWidth - regionTextSize <
                            x + height * 2
                                ? x + width - element.bubble.margin
                                : curx
                ) {
                    const version = versions[i];
                    if (version.version) {
                        let region = version.region;
                        if (
                            version.region == "EX" &&
                            !(
                                version.version.gameVersion.minor >= 10 &&
                                version.version.gameVersion.minor < 20
                            )
                        ) {
                            region = "DX";
                        }
                        const rawVersion =
                            Math.floor(version.version.gameVersion.minor / 5) *
                            5;

                        const versionImage = this.getThemeFile(
                            theme.manifest.sprites.versions[region][
                                rawVersion as keyof Chart.IThemeManifest["sprites"]["versions"][typeof version.region]
                            ]
                        );
                        try {
                            sharp(versionImage);
                            if (versionImage) {
                                const versionImg = new Image();
                                versionImg.src = versionImage;
                                let text;
                                switch (version.region) {
                                    case "DX":
                                        if (version.EXAppend) text = "🇯🇵🌏";
                                        else text = "🇯🇵";
                                        break;
                                    case "EX":
                                        text = "🌏";
                                        break;
                                    case "CN":
                                        text = "🇨🇳";
                                        break;
                                    default:
                                        text = "";
                                }
                                ctx.drawImage(
                                    versionImg,
                                    (curx -= versionImageWidth),
                                    cury,
                                    versionImageWidth,
                                    versionImageHeight
                                );
                                if (version.region != "OLD") {
                                    await Util.drawEmojiOrGlyph(
                                        ctx,
                                        text,
                                        curx,
                                        cury +
                                            regionTextSize +
                                            (versionImageHeight -
                                                regionTextSize) /
                                                2,
                                        regionTextSize,
                                        Infinity,
                                        "right"
                                    );
                                    curx -=
                                        Util.visibleLength(text) *
                                            regionTextSize +
                                        element.bubble.margin;
                                }
                            }
                        } catch {}
                    }
                }
                /** End Version Draw */

                /** Begin Note Count Draw */
                const noteCountTexts = Object.entries(chart.meta.notes).map(
                    ([k, v]) => `${Util.capitalize(k)}: ${v}`
                );
                const shortCompensation = isShort
                    ? versionImageHeight + element.bubble.margin / 2
                    : 0;
                const noteCountTextSize =
                    (height - shortCompensation - element.bubble.margin * 4) /
                    noteCountTexts.length;
                let noteCountLength = 0;
                noteCountTexts.forEach((v, i) => {
                    Util.drawText(
                        ctx,
                        v,
                        x + element.bubble.margin * (3 / 2) + height * 2,
                        y +
                            shortCompensation +
                            element.bubble.margin +
                            noteCountTextSize +
                            (noteCountTextSize + element.bubble.margin / 2) * i,
                        noteCountTextSize,
                        height * 0.806 * 0.04,
                        Infinity,
                        "left",
                        "white",
                        new Color(curColor).darken(0.3).hexa()
                    );
                    const length = Util.measureText(
                        ctx,
                        v,
                        noteCountTextSize,
                        Infinity
                    ).width;
                    if (length > noteCountLength) noteCountLength = length;
                });
                /** End Note Count Draw */

                /** Begin Internal Level Trend Draw */
                if (!isShort) {
                    const CURRENT_DX_MINOR = 55;
                    const maxWidth =
                        width -
                        height * 2 -
                        element.bubble.margin * 4 -
                        noteCountLength;
                    const maxFitTrendCount = Math.floor(
                        maxWidth / versionImageWidth
                    );
                    const trendEvents = chart.events.filter(
                        (v) => v.type == "existence" && v.version.region == "DX"
                    ) as database.Database.Events.Existence[];
                    let actualEvents: database.Database.Events[] = _.uniqWith(
                        trendEvents,
                        (a, b) => {
                            return _.isEqual(a.data.level, b.data.level);
                        }
                    );
                    if (actualEvents.length == maxFitTrendCount) {
                    } else if (actualEvents.length > maxFitTrendCount) {
                        while (actualEvents.length > maxFitTrendCount)
                            actualEvents.shift();
                        actualEvents.shift();
                        actualEvents.shift();
                        actualEvents.unshift(trendEvents[0]);
                        actualEvents.push(trendEvents[trendEvents.length - 1]);
                    } else if (trendEvents.length > maxFitTrendCount) {
                        actualEvents = _.filter(
                            actualEvents,
                            (v) =>
                                !(
                                    _.isEqual(
                                        v.version.gameVersion,
                                        trendEvents[0].version.gameVersion
                                    ) ||
                                    _.isEqual(
                                        v.version.gameVersion,
                                        trendEvents[trendEvents.length - 1]
                                            .version.gameVersion
                                    )
                                )
                        );
                        for (
                            let i = trendEvents.length - 2;
                            i > 0 && actualEvents.length < maxFitTrendCount - 2;
                            --i
                        ) {
                            const event = trendEvents[i];
                            if (event) actualEvents.push(event);
                            actualEvents = _.uniqWith(actualEvents, (a, b) => {
                                return _.isEqual(
                                    a.version.gameVersion,
                                    b.version.gameVersion
                                );
                            });
                        }
                        actualEvents.unshift(trendEvents[0]);
                        actualEvents.push(trendEvents[trendEvents.length - 1]);
                        actualEvents = _.uniqWith(actualEvents, (a, b) => {
                            return _.isEqual(
                                a.version.gameVersion,
                                b.version.gameVersion
                            );
                        });
                        actualEvents = _.sortBy(
                            actualEvents,
                            (v) => v.version.gameVersion.minor
                        );
                        if (trendEvents.length > 1) {
                            if (actualEvents.length >= maxFitTrendCount)
                                actualEvents.pop();
                            actualEvents.push(
                                trendEvents[trendEvents.length - 1]
                            );
                        }
                        const removalEvent = chart.events.find(
                            (v) =>
                                v.type == "removal" && v.version.region == "DX"
                        ) as database.Database.Events.Removal | undefined;
                        if (removalEvent) {
                            actualEvents.pop();
                            actualEvents.push(removalEvent);
                        }
                    } else {
                        actualEvents = [...trendEvents];
                    }
                    if (
                        actualEvents[actualEvents.length - 1].version
                            .gameVersion.minor < CURRENT_DX_MINOR
                    ) {
                        while (actualEvents.length >= maxFitTrendCount)
                            actualEvents.pop();
                        actualEvents.push({
                            type: "removal",
                            version: Util.Maimai.Version.toEventVersion(
                                Util.Maimai.Version.getNextVersion(
                                    trendEvents[trendEvents.length - 1].version
                                )
                            ),
                        });
                    }
                    const addGap =
                        (maxWidth - actualEvents.length * versionImageWidth) /
                        (actualEvents.length - 1);
                    for (
                        let i = 0,
                            curx =
                                x +
                                height * 2 +
                                element.bubble.margin * (5 / 2) +
                                noteCountLength,
                            cury =
                                y +
                                element.bubble.margin * (3 / 2) +
                                versionImageHeight;
                        i < maxFitTrendCount;
                        ++i
                    ) {
                        const event = actualEvents[i];
                        if (!event) continue;
                        const region = event.version.gameVersion.isDX
                            ? "DX"
                            : "OLD";
                        const versionImage = this.getThemeFile(
                            theme.manifest.sprites.versions[region][
                                event.version.gameVersion
                                    .minor as keyof Chart.IThemeManifest["sprites"]["versions"][typeof region]
                            ]
                        );
                        if (versionImage) {
                            const versionImg = new Image();
                            versionImg.src = versionImage;
                            ctx.drawImage(
                                versionImg,
                                curx,
                                cury,
                                versionImageWidth,
                                versionImageHeight
                            );
                            if (event.type == "existence") {
                                let symbol = "";
                                if (i != 0) {
                                    const lastEvent = actualEvents[i - 1];
                                    if (lastEvent.type == "existence") {
                                        if (
                                            lastEvent.data.level <
                                            event.data.level
                                        )
                                            symbol = "↑";
                                        else if (
                                            lastEvent.data.level >
                                            event.data.level
                                        )
                                            symbol = "↓";
                                        else if (
                                            lastEvent.data.level ==
                                            event.data.level
                                        )
                                            symbol = "→";
                                    }
                                }
                                Util.drawText(
                                    ctx,
                                    `${symbol}${event.data.level.toFixed(1)}`,
                                    curx + versionImageWidth / 2,
                                    cury +
                                        versionImageHeight +
                                        noteCountTextSize,
                                    noteCountTextSize,
                                    height * 0.806 * 0.04,
                                    Infinity,
                                    "center",
                                    "white",
                                    new Color(curColor).darken(0.3).hexa()
                                );
                            } else if (event.type == "removal") {
                                Util.drawText(
                                    ctx,
                                    `❌`,
                                    curx + versionImageWidth / 2,
                                    cury +
                                        versionImageHeight +
                                        noteCountTextSize,
                                    noteCountTextSize,
                                    height * 0.806 * 0.04,
                                    Infinity,
                                    "center",
                                    "white",
                                    new Color(curColor).darken(0.3).hexa()
                                );
                            }
                            curx += versionImageWidth + addGap;
                        }
                    }
                }
            }
            /** End Internal Level Trend Draw */

            ctx.restore();
        }
        /** End Main Content Draw */

        ctx.fillStyle = new Color(curColor).lighten(0.4).hexa();
        ctx.beginPath();
        ctx.roundRect(x, y + height * 0.742, height * 2, height * (1 - 0.742), [
            0,
            (height * 0.806) / 7,
            0,
            (height * 0.806) / 7,
        ]);
        ctx.fill();
        /** Begin Difficulty & DX Rating Draw */
        {
            ctx.save();
            ctx.clip();
            Util.drawText(
                ctx,
                chart.designer.name || "-",
                x + element.bubble.margin,
                y + height * (0.806 + (1 - 0.806) / 2),
                height * 0.806 * 0.128,
                height * 0.806 * 0.04,
                Infinity,
                "left",
                "white",
                new Color(curColor).darken(0.3).hexa()
            );
            ctx.restore();

            Util.drawText(
                ctx,
                `${score ? `${score.dxScore}/` : "MAX DX SCR: "}${chart.meta.maxDXScore}`,
                x + height * 2 - element.bubble.margin,
                y + height - element.bubble.margin * 3.1,
                height * 0.806 * 0.128,
                height * 0.806 * 0.04,
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
    private static async drawDetailInfoModule(
        ctx: CanvasRenderingContext2D,
        theme: Chart.ITheme,
        element: Chart.IThemeDetailInfoElement,
        chartId: number
    ) {
        const jacketMargin = element.margin;
        const textMargin = element.margin;

        const chart = Chart.Database.getLocalChart(chartId, EDifficulty.BASIC);
        const jacket = await Chart.Database.fecthJacket(chartId);
        /* Begin Background Draw */
        ctx.beginPath();
        ctx.roundRect(
            element.x,
            element.y,
            element.width,
            element.height,
            Math.min(theme.manifest.width, theme.manifest.height) * (3 / 128)
        );
        ctx.fillStyle = element.color.card;
        ctx.strokeStyle = new Color(element.color.card).darken(0.6).hex();
        ctx.lineWidth =
            Math.min(theme.manifest.width, theme.manifest.height) * (3 / 512);
        ctx.stroke();
        ctx.fill();
        /* End Background Draw */

        /* Begin jacket draw */
        if (jacket) {
            const jacketImage = new Image();
            const roundRadius =
                Math.min(theme.manifest.width, theme.manifest.height) *
                (3 / 128);
            jacketImage.src = jacket;
            ctx.beginPath();
            ctx.roundRect(
                element.x + jacketMargin,
                element.y + jacketMargin,
                element.width - jacketMargin * 2,
                element.width - jacketMargin * 2,
                [roundRadius, roundRadius, 0, 0]
            );
            ctx.save();
            ctx.clip();
            ctx.drawImage(
                jacketImage,
                element.x + jacketMargin,
                element.y + jacketMargin,
                element.width - jacketMargin * 2,
                element.width - jacketMargin * 2
            );
            ctx.restore();
        }
        /* End jacket draw */

        /* Begin Detail Draw */
        if (chart) {
            const textSizeTitle = element.width * (1 / 16);
            const textSizeSecondary = element.width * (1 / 24);
            const {
                actualBoundingBoxAscent: ascent,
                actualBoundingBoxDescent: decent,
            } = Util.measureText(ctx, chart.name, textSizeTitle, Infinity);
            const titleActualHeight = Math.abs(ascent - decent);
            const mode = new Image();
            const chartModeBadgeImg = this.getThemeFile(
                chart.id > 10000
                    ? theme.manifest.sprites.mode.dx
                    : theme.manifest.sprites.mode.standard,
                theme.path
            );
            const { width: modeWidth, height: modeHeight } =
                await sharp(chartModeBadgeImg).metadata();
            const aspectRatio = (modeWidth ?? 0) / (modeHeight ?? 1) || 3;

            const textLineWidth = element.width * (7 / 512);
            const textColor = new Color(element.color.card).darken(0.5).hex();
            const textTitleMaxWidth =
                element.width - textMargin * 2 - textSizeTitle * aspectRatio;

            const titleMetrics = Util.measureText(
                ctx,
                chart.name,
                textSizeTitle,
                textTitleMaxWidth
            );

            Util.drawText(
                ctx,
                chart.name,
                element.x + textMargin,
                element.y +
                    jacketMargin +
                    textMargin * (1 / 2) +
                    (element.width - jacketMargin * 2) +
                    textSizeTitle,
                textSizeTitle,
                textLineWidth,
                textTitleMaxWidth,
                "left",
                "white",
                textColor
            );

            Util.drawText(
                ctx,
                chart.artist,
                element.x + textMargin,
                element.y +
                    jacketMargin +
                    textMargin * (1 / 2) +
                    (element.width - jacketMargin * 2) +
                    textSizeTitle * 2,
                textSizeSecondary,
                textLineWidth,
                element.width - textMargin * 2,
                "left",
                "white",
                textColor
            );
            Util.drawText(
                ctx,
                `BPM: ${chart.bpm}`,
                element.x + textMargin,
                element.y +
                    jacketMargin +
                    textMargin * (1 / 2) +
                    (element.width - jacketMargin * 2) +
                    textSizeTitle * 3,
                textSizeSecondary,
                textLineWidth,
                element.width - textMargin * 2,
                "left",
                "white",
                textColor
            );
            const DX_LATEST = 55,
                EX_LATEST = 50,
                CN_LATEST = 40;

            const EVENT_DX = chart.events
                .filter(
                    (v) =>
                        v.version.region == "DX" &&
                        v.version.gameVersion.minor >= DX_LATEST
                )
                .map((v) => v.type);
            const EVENT_EX = chart.events
                .filter(
                    (v) =>
                        v.version.region == "EX" &&
                        v.version.gameVersion.minor >= EX_LATEST
                )
                .map((v) => v.type);
            const EVENT_CN = chart.events
                .filter(
                    (v) =>
                        v.version.region == "CN" &&
                        v.version.gameVersion.minor >= CN_LATEST
                )
                .map((v) => v.type);
            const EXIST_DX =
                EVENT_DX.includes("existence") && !EVENT_DX.includes("removal")
                    ? "🇯🇵"
                    : "";
            const EXIST_EX =
                EVENT_EX.includes("existence") && !EVENT_EX.includes("removal")
                    ? "🌏"
                    : "";
            const EXIST_CN =
                EVENT_CN.includes("existence") && !EVENT_CN.includes("removal")
                    ? "🇨🇳"
                    : "";
            const title = [];
            if (EXIST_DX) title.push(EXIST_DX);
            if (EXIST_EX) title.push(EXIST_EX);
            if (EXIST_CN) title.push(EXIST_CN);
            await Util.drawEmojiOrGlyph(
                ctx,
                title.join(" "),
                element.x + element.width - textMargin,
                element.y +
                    jacketMargin +
                    textMargin * (1 / 2) +
                    (element.width - jacketMargin * 2) +
                    textSizeTitle * 3,
                textSizeSecondary * (9 / 8),
                element.width - textMargin * 2,
                "right",
                "white",
                textColor
            );

            /** Begin Chart Mode Draw */
            {
                mode.src = chartModeBadgeImg;
                ctx.drawImage(
                    mode,
                    element.x + textMargin * (3 / 2) + titleMetrics.width,
                    element.y +
                        jacketMargin +
                        textMargin * (1 / 2) +
                        (element.width - jacketMargin * 2) -
                        titleActualHeight / 2 +
                        textSizeTitle / 2,
                    textSizeTitle * aspectRatio,
                    textSizeTitle
                );
            }
            /** End Chart Mode Draw */
        }
        /* End Detail Draw */
    }
    private static async drawChartGridModule(
        ctx: CanvasRenderingContext2D,
        theme: Chart.ITheme,
        element: Chart.IThemeChartGridElement,
        chartId: number,
        scores: (Best50.IScore | null)[]
    ) {
        /* Begin Background Draw */
        ctx.roundRect(
            element.x,
            element.y,
            element.width,
            element.height,
            Math.min(theme.manifest.width, theme.manifest.height) * (3 / 128)
        );
        ctx.fillStyle = element.color.card;
        ctx.strokeStyle = new Color(element.color.card).darken(0.6).hex();
        ctx.lineWidth =
            Math.min(theme.manifest.width, theme.manifest.height) * (3 / 512);
        ctx.stroke();
        ctx.fill();
        /* End Background Draw */

        const difficulties = [];
        for (let i = EDifficulty.BASIC; i <= EDifficulty.REMASTER; ++i) {
            const chart = Chart.Database.getLocalChart(chartId, i);
            if (chart) difficulties.push(chart);
        }

        const cardWidth = element.width - element.margin * 2;
        const cardHeight =
            (element.height - element.margin * 2 - element.gap * 3) / 4;
        for (
            let y = element.y + element.margin, i = 0;
            i < difficulties.length;
            ++i, y += cardHeight + element.gap
        ) {
            const chart = difficulties[i];
            if (chart)
                if (difficulties.length > 4 && i == 0) {
                    await this.drawChartGridCard(
                        ctx,
                        theme,
                        element,
                        chart,
                        i,
                        element.x + element.margin,
                        y,
                        (cardWidth - element.margin) / 2,
                        cardHeight,
                        true,
                        scores[i]
                    );
                    i++;
                    const chartA = difficulties[i];
                    if (chartA)
                        await this.drawChartGridCard(
                            ctx,
                            theme,
                            element,
                            chartA,
                            i,
                            element.x +
                                element.margin +
                                (cardWidth + element.margin) / 2,
                            y,
                            (cardWidth - element.margin) / 2,
                            cardHeight,
                            true,
                            scores[i]
                        );
                } else {
                    await this.drawChartGridCard(
                        ctx,
                        theme,
                        element,
                        chart,
                        i,
                        element.x + element.margin,
                        y,
                        cardWidth,
                        cardHeight,
                        false,
                        scores[i]
                    );
                }
        }
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
        const chart = Chart.Database.getLocalChart(chartId, EDifficulty.BASIC);
        if (!chart) return null;
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
                        await this.drawChartGridModule(
                            ctx,
                            currentTheme,
                            element,
                            chartId,
                            scores
                        );
                        break;
                    }
                    case "detail-info": {
                        await this.drawDetailInfoModule(
                            ctx,
                            currentTheme,
                            element,
                            chartId
                        );
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
        versions: {
            OLD: {
                0: string;
                10: string;
                20: string;
                30: string;
                40: string;
                50: string;
                60: string;
                70: string;
                80: string;
                85: string;
                90: string;
                95: string;
                99: string;
            };
            DX: {
                0: string;
                5: string;
                10: string;
                15: string;
                20: string;
                25: string;
                30: string;
                35: string;
                40: string;
                45: string;
                50: string;
                55: string;
            };
            EX: {
                10: string;
                15: string;
            };
            CN: {
                0: string;
                10: string;
                20: string;
                30: string;
                40: string;
            };
        };
    }

    export type IThemeElements =
        | IThemeProfileElement
        | IThemeChartGridElement
        | IThemeImageElement
        | IThemeTextElement
        | IThemeDetailInfoElement;

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
        width: number;
        height: number;
        margin: number;
        gap: number;
        bubble: {
            margin: number;
            color: {
                basic: string;
                advanced: string;
                expert: string;
                master: string;
                remaster: string;
                utage: string;
            };
        };
        color: {
            card: string;
        };
    }

    export interface IThemeDetailInfoElement extends IThemeElement {
        type: "detail-info";
        width: number;
        height: number;
        margin: number;
        color: {
            card: string;
        };
        font?: string;
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
