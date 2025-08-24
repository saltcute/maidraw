import sharp from "sharp";
import { EAchievementTypes, EComboTypes, EDifficulty, IScore } from "../type";
import * as database from "./database";
import { Util } from "@maidraw/lib/util";
import { registerFont, CanvasRenderingContext2D, Image, Canvas } from "canvas";
import Color from "color";
import { globSync } from "glob";
import ScoreTrackerAdapter from "../lib";
import upath from "upath";
import fs from "fs";
import stringFormat from "string-template";
import _ from "lodash";

export class Chart {
    static readonly JPN_LATEST = 230;
    static readonly INT_LATEST = 140;
    static readonly CHN_LATEST = 120;

    static readonly CHUNITHM_VERSIONS = [
        240, 230, 225, 220, 215, 210, 205, 200, 150, 145, 140, 135, 130, 125,
        120, 115, 110, 105, 100,
    ];
    static readonly CHUNITHM_INT_VERSIONS = [
        140, 135, 130, 125, 120, 115, 110, 105, 100,
    ];
    static readonly ZHONGERJIEZOU_VERSIONS = [120, 110, 100];

    static findVersion(v: number, region: "JPN" | "INT" | "CHN") {
        const target = (() => {
            switch (region) {
                case "INT":
                    return this.CHUNITHM_INT_VERSIONS;
                case "CHN":
                    return this.ZHONGERJIEZOU_VERSIONS;
                case "JPN":
                default:
                    return this.CHUNITHM_VERSIONS;
            }
        })();
        for (const version of target) {
            if (v >= version) return version;
        }
        return -1;
    }

    private static readonly DEFAULT_THEME = "jp-verse";
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
                "chunithm",
                "chart",
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
        function assert(
            obj: any,
            path: string,
            condition: (payload: any) => boolean | string
        ) {
            const deepValue = (o: any, p: string) =>
                p.split(".").reduce((a, v) => a[v], o);
            const payload = deepValue(obj, path);
            const result = condition(payload);
            if (result === true) return true;
            throw `Manifest validation failed at ${path}.${result == false ? "" : ` ${result}`}`;
        }
        function isFileExist(object: any, objectPath: string): boolean {
            return assert(object, objectPath, (p) => {
                const filePath = upath.join(path, p);
                if (typeof p == "string") {
                    if (fs.existsSync(filePath)) {
                        return true;
                    } else {
                        return `${filePath} does not exist.`;
                    }
                } else return false;
            });
        }
        function isOneOf(
            object: any,
            path: string,
            optional = false,
            args: any[]
        ): boolean {
            return assert(
                object,
                path,
                (p) => args.includes(p) || (optional && p === undefined)
            );
        }
        function isString(
            object: any,
            path: string,
            optional = false
        ): boolean {
            return assert(
                object,
                path,
                (p) => typeof p == "string" || (optional && p === undefined)
            );
        }
        function isNumber(
            object: any,
            path: string,
            optional = false
        ): boolean {
            return assert(
                object,
                path,
                (p) => typeof p == "number" || (optional && p === undefined)
            );
        }
        function isArray(object: any, path: string, optional = false): boolean {
            return assert(
                object,
                path,
                (p) => Array.isArray(p) || (optional && p === undefined)
            );
        }
        function isObject(
            object: any,
            path: string,
            optional = false
        ): boolean {
            return assert(
                object,
                path,
                (p) => typeof p == "object" || (optional && p === undefined)
            );
        }
        function isHexColor(
            object: any,
            path: string,
            optional = false
        ): boolean {
            return assert(object, path, (p) => {
                if (typeof p == "string")
                    return (
                        /^(?:#[0-9A-F]{6}|#[0-9A-F]{8})$/i.test(p) ||
                        (optional && p === undefined)
                    );
                else return optional && p === undefined;
            });
        }
        function isBoolean(
            object: any,
            path: string,
            optional = false
        ): boolean {
            return assert(
                object,
                path,
                (p) => typeof p == "boolean" || (optional && p === undefined)
            );
        }
        if (
            isString(payload, "displayName") &&
            isString(payload, "name") &&
            isNumber(payload, "width") &&
            isNumber(payload, "height") &&
            isObject(payload, "sprites") &&
            isObject(payload, "sprites.achievement") &&
            isFileExist(payload, "sprites.achievement.d") &&
            isFileExist(payload, "sprites.achievement.c") &&
            isFileExist(payload, "sprites.achievement.b") &&
            isFileExist(payload, "sprites.achievement.bb") &&
            isFileExist(payload, "sprites.achievement.bbb") &&
            isFileExist(payload, "sprites.achievement.a") &&
            isFileExist(payload, "sprites.achievement.aa") &&
            isFileExist(payload, "sprites.achievement.aaa") &&
            isFileExist(payload, "sprites.achievement.s") &&
            isFileExist(payload, "sprites.achievement.sp") &&
            isFileExist(payload, "sprites.achievement.ss") &&
            isFileExist(payload, "sprites.achievement.ssp") &&
            isFileExist(payload, "sprites.achievement.sss") &&
            isFileExist(payload, "sprites.achievement.sssp") &&
            isObject(payload, "sprites.milestone") &&
            isFileExist(payload, "sprites.milestone.aj") &&
            isFileExist(payload, "sprites.milestone.ajc") &&
            isFileExist(payload, "sprites.milestone.fc") &&
            isFileExist(payload, "sprites.milestone.none") &&
            isObject(payload, "sprites.profile") &&
            isFileExist(payload, "sprites.profile.icon") &&
            isFileExist(payload, "sprites.profile.nameplate") &&
            isFileExist(payload, "sprites.ratingNumberMap") &&
            isObject(payload, "sprites.versions") &&
            isObject(payload, "sprites.versions.JPN") &&
            isFileExist(payload, "sprites.versions.JPN.100") &&
            isFileExist(payload, "sprites.versions.JPN.105") &&
            isFileExist(payload, "sprites.versions.JPN.110") &&
            isFileExist(payload, "sprites.versions.JPN.115") &&
            isFileExist(payload, "sprites.versions.JPN.120") &&
            isFileExist(payload, "sprites.versions.JPN.125") &&
            isFileExist(payload, "sprites.versions.JPN.130") &&
            isFileExist(payload, "sprites.versions.JPN.135") &&
            isFileExist(payload, "sprites.versions.JPN.140") &&
            isFileExist(payload, "sprites.versions.JPN.145") &&
            isFileExist(payload, "sprites.versions.JPN.150") &&
            isFileExist(payload, "sprites.versions.JPN.155") &&
            isFileExist(payload, "sprites.versions.JPN.200") &&
            isFileExist(payload, "sprites.versions.JPN.205") &&
            isFileExist(payload, "sprites.versions.JPN.210") &&
            isFileExist(payload, "sprites.versions.JPN.215") &&
            isFileExist(payload, "sprites.versions.JPN.220") &&
            isFileExist(payload, "sprites.versions.JPN.225") &&
            isFileExist(payload, "sprites.versions.JPN.230") &&
            isFileExist(payload, "sprites.versions.JPN.240") &&
            isObject(payload, "sprites.versions.INT") &&
            isFileExist(payload, "sprites.versions.INT.100") &&
            isFileExist(payload, "sprites.versions.INT.105") &&
            isFileExist(payload, "sprites.versions.INT.110") &&
            isFileExist(payload, "sprites.versions.INT.115") &&
            isFileExist(payload, "sprites.versions.INT.120") &&
            isFileExist(payload, "sprites.versions.INT.125") &&
            isFileExist(payload, "sprites.versions.INT.130") &&
            isFileExist(payload, "sprites.versions.INT.135") &&
            isFileExist(payload, "sprites.versions.INT.140") &&
            isObject(payload, "sprites.versions.CHN") &&
            isFileExist(payload, "sprites.versions.CHN.100") &&
            isFileExist(payload, "sprites.versions.CHN.110") &&
            isFileExist(payload, "sprites.versions.CHN.120") &&
            // isFileExist(payload, "sprites.versions.CHN.130") && // Ignore the yet to release 中二节奏2026
            isArray(payload, "elements")
        ) {
            for (const element of payload.elements) {
                if (isNumber(element, "x") && isNumber(element, "y")) {
                    switch (element.type) {
                        case "image": {
                            if (
                                isNumber(element, "width") &&
                                isNumber(element, "height") &&
                                isFileExist(element, "path")
                            ) {
                                continue;
                            } else return false;
                        }
                        case "chart-grid": {
                            if (
                                isNumber(element, "width") &&
                                isNumber(element, "height") &&
                                isNumber(element, "margin") &&
                                isNumber(element, "gap") &&
                                isObject(element, "bubble") &&
                                isHexColor(element, "bubble.color.basic") &&
                                isHexColor(element, "bubble.color.advanced") &&
                                isHexColor(element, "bubble.color.expert") &&
                                isHexColor(element, "bubble.color.master") &&
                                isHexColor(element, "bubble.color.ultima") &&
                                isHexColor(element, "bubble.color.worldsEnd") &&
                                isObject(element, "color") &&
                                isHexColor(element, "color.card")
                            ) {
                                continue;
                            } else return false;
                        }
                        case "profile": {
                            if (isNumber(element, "height")) {
                                continue;
                            } else return false;
                        }
                        case "detail-info": {
                            if (
                                isNumber(element, "width") &&
                                isNumber(element, "height") &&
                                isNumber(element, "margin") &&
                                isObject(element, "color") &&
                                isHexColor(element, "color.card") &&
                                isString(element, "font", true)
                            ) {
                                continue;
                            } else return false;
                        }
                        case "text": {
                            if (
                                isNumber(element, "size") &&
                                isString(element, "content") &&
                                isNumber(element, "width", true) &&
                                isNumber(element, "height", true) &&
                                isBoolean(element, "linebreak", true) &&
                                isOneOf(element, "align", true, [
                                    "left",
                                    "center",
                                    "right",
                                ]) &&
                                isString(element, "color", true) &&
                                isString(element, "borderColor", true) &&
                                isString(element, "font", true)
                            ) {
                                continue;
                            } else return false;
                        }
                        default:
                            throw `Manifest validation failed at elements.type. Unsupported element type ${element.type}.`;
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
        targetRegion: "JPN" | "INT" | "CHN" = "JPN",
        score?: IScore | null
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
            case EDifficulty.ULTIMA:
                curColor = element.bubble.color.ultima;
                break;
            case EDifficulty.WORLDS_END:
                curColor = element.bubble.color.worldsEnd;
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
                    case EDifficulty.ULTIMA:
                        difficultiy = "ULTIMA";
                        break;
                    case EDifficulty.WORLDS_END:
                        difficultiy = "WORLD'S END";
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
                    `Lv. ${Util.truncate(
                        chart.events
                            .filter((v) => v.version.region == targetRegion)
                            .reverse()
                            .find((v) => v.type == "existence")?.data.level ||
                            0,
                        1
                    )}${score ? `　+${Util.truncate(score.rating, 1)}` : ""}`,
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
                    score ? Util.truncate(score.score, 0) : "NO RECORD",
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
                    switch (score.rank) {
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

                    const blockHeight = height * 0.806 * 0.3 * 0.85,
                        blockWidth = blockHeight * (540 / 180);

                    const img = new Image();
                    img.src = rankImg;
                    ctx.drawImage(
                        img,
                        x + element.bubble.margin * (1 / 2),
                        y +
                            element.bubble.margin +
                            titleSize +
                            element.bubble.margin * (1 / 2),
                        blockWidth,
                        blockHeight
                    );
                }
            }
            /** End Achievement Rank Draw */

            /** Begin Milestone Draw */
            {
                const blockWidth = height * 0.806 * 0.32 * 3,
                    blockHeight = (blockWidth * 40) / 268;

                const curX =
                        x - blockWidth + height * 2 - element.bubble.margin,
                    curY = y + element.bubble.margin * 2 + titleSize * 2;

                ctx.fillStyle = "#e8eaec";
                ctx.roundRect(
                    curX,
                    curY,
                    blockWidth,
                    blockHeight,
                    blockWidth / 56
                );
                ctx.fill();
                if (score) {
                    let comboImg: Buffer;
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
                        case EComboTypes.ALL_JUSTICE:
                            comboImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.aj,
                                theme.path
                            );
                            break;
                        case EComboTypes.ALL_JUSTICE_CRITICAL:
                            comboImg = this.getThemeFile(
                                theme.manifest.sprites.milestone.ajc,
                                theme.path
                            );
                            break;
                    }
                    const combo = new Image();
                    combo.src = comboImg;
                    ctx.drawImage(combo, curX, curY, blockWidth, blockHeight);
                }
            }
            /** End Milestone Draw */

            /** Begin Version Draw */
            {
                const version: {
                    region: "JPN" | "INT" | "CHN";
                    version?: database.Database.IVersion;
                } = {
                    region: "JPN",
                    version: undefined,
                };
                const VER =
                    chart.difficulty == EDifficulty.ULTIMA
                        ? chart.events.find(
                              (v) =>
                                  v.type == "existence" &&
                                  v.version.region == targetRegion
                          )?.version
                        : chart.addVersion;
                version.version = VER;
                version.region = targetRegion;
                const versionImageHeight =
                    (height - element.bubble.margin * 2) *
                    (isShort ? 9 / 16 : 1 / 2);
                const versionImageWidth = (versionImageHeight / 160) * 201;
                const curx = x + width - element.bubble.margin,
                    cury = y + element.bubble.margin;
                if (version.version) {
                    const rawVersion = this.findVersion(
                        Util.Chunithm.getNumberVersion(version.version),
                        targetRegion
                    );
                    const versionImage = this.getThemeFile(
                        theme.manifest.sprites.versions[version.region][
                            rawVersion as keyof Chart.IThemeManifest["sprites"]["versions"][typeof version.region]
                        ]
                    );
                    try {
                        sharp(versionImage);
                        if (versionImage) {
                            const versionImg = new Image();
                            versionImg.src = versionImage;
                            ctx.drawImage(
                                versionImg,
                                curx - versionImageWidth,
                                cury,
                                versionImageWidth,
                                versionImageHeight
                            );
                        }
                    } catch {}
                }
                /** End Version Draw */

                /** Begin Note Count Draw */
                const noteCountTexts = Object.entries(chart.meta.notes).map(
                    ([k, v]) => `${Util.capitalize(k)}: ${v}`
                );
                const noteCountTextSize =
                    (height - element.bubble.margin * 4) /
                    noteCountTexts.length;
                let noteCountLength = 0;
                noteCountTexts.forEach((v, i) => {
                    Util.drawText(
                        ctx,
                        v,
                        x + element.bubble.margin * (3 / 2) + height * 2,
                        y +
                            element.bubble.margin +
                            noteCountTextSize +
                            (noteCountTextSize +
                                (element.bubble.margin * 2) /
                                    (noteCountTexts.length - 1)) *
                                i,
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
                    const CURRENT_VER = (() => {
                        switch (targetRegion) {
                            case "INT":
                                return this.INT_LATEST;
                            case "CHN":
                                return this.CHN_LATEST;
                            case "JPN":
                            default:
                                return this.JPN_LATEST;
                        }
                    })();
                    const maxWidth =
                        width -
                        height * 2 -
                        element.bubble.margin * 4 -
                        noteCountLength -
                        versionImageWidth;
                    const maxFitTrendCount = Math.trunc(
                        maxWidth / versionImageWidth
                    );
                    const trendEvents = chart.events.filter(
                        (v) =>
                            v.type == "existence" &&
                            v.version.region == targetRegion
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
                                return (
                                    _.isEqual(
                                        a.version.gameVersion.major,
                                        b.version.gameVersion.major
                                    ) &&
                                    _.isEqual(
                                        a.version.gameVersion.minor,
                                        b.version.gameVersion.minor
                                    )
                                );
                            });
                        }
                        actualEvents.unshift(trendEvents[0]);
                        actualEvents.push(trendEvents[trendEvents.length - 1]);
                        actualEvents = _.uniqWith(actualEvents, (a, b) => {
                            return (
                                _.isEqual(
                                    a.version.gameVersion.major,
                                    b.version.gameVersion.major
                                ) &&
                                _.isEqual(
                                    a.version.gameVersion.minor,
                                    b.version.gameVersion.minor
                                )
                            );
                        });
                        actualEvents = _.sortBy(actualEvents, (v) =>
                            Util.Chunithm.getNumberVersion(v.version)
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
                                v.type == "removal" &&
                                v.version.region == targetRegion
                        ) as database.Database.Events.Removal | undefined;
                        if (removalEvent) {
                            actualEvents.pop();
                            actualEvents.push(removalEvent);
                        }
                    } else {
                        actualEvents = [...trendEvents];
                    }
                    if (
                        Util.Chunithm.getNumberVersion(
                            actualEvents[actualEvents.length - 1].version
                        ) < CURRENT_VER
                    ) {
                        while (actualEvents.length >= maxFitTrendCount)
                            actualEvents.pop();
                        actualEvents.push({
                            type: "removal",
                            version: Util.Chunithm.Version.toEventVersion(
                                Util.Chunithm.Version.getNextVersion(
                                    trendEvents[trendEvents.length - 1].version
                                )
                            ),
                        });
                    }
                    actualEvents = _.uniqWith(actualEvents, (a, b) => {
                        return (
                            _.isEqual(
                                a.version.gameVersion.major,
                                b.version.gameVersion.major
                            ) &&
                            _.isEqual(
                                a.version.gameVersion.minor,
                                b.version.gameVersion.minor
                            ) &&
                            _.isEqual(a.type, b.type)
                        );
                    });
                    let positionAdjustment = 0;
                    let addGap =
                        (maxWidth - actualEvents.length * versionImageWidth) /
                        (actualEvents.length - 1);
                    if (addGap > maxWidth / 5) {
                        addGap = maxWidth / 5;
                        positionAdjustment =
                            (maxWidth -
                                (addGap * (actualEvents.length - 1) +
                                    versionImageWidth * actualEvents.length)) /
                            2;
                    }
                    for (
                        let i = 0,
                            curx =
                                x +
                                positionAdjustment +
                                height * 2 +
                                element.bubble.margin * (5 / 2) +
                                noteCountLength,
                            cury =
                                y +
                                element.bubble.margin +
                                versionImageHeight * (1 / 2);
                        i < actualEvents.length;
                        ++i
                    ) {
                        const event = actualEvents[i];
                        const rawVersion = this.findVersion(
                            Util.Chunithm.getNumberVersion(event.version),
                            targetRegion
                        );
                        const versionImage = this.getThemeFile(
                            theme.manifest.sprites.versions[targetRegion][
                                rawVersion as keyof Chart.IThemeManifest["sprites"]["versions"][typeof targetRegion]
                            ]
                        );
                        try {
                            sharp(versionImage);
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
                                        `${symbol}${Util.truncate(event.data.level, 1)}`,
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
                        } catch {}
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
                chart.designer || "-",
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

            // Util.drawText(
            //     ctx,
            //     `${score ? `${score.dxScore}/` : "MAX DX SCR: "}${chart.meta.maxDXScore}`,
            //     x + height * 2 - element.bubble.margin,
            //     y + height - element.bubble.margin * 3.1,
            //     height * 0.806 * 0.128,
            //     height * 0.806 * 0.04,
            //     Infinity,
            //     "right",
            //     "white",
            //     new Color(curColor).darken(0.3).hexa()
            // );
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

            const textLineWidth = element.width * (7 / 512);
            const textColor = new Color(element.color.card).darken(0.5).hex();
            const textTitleMaxWidth = element.width - textMargin * 2;

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
            function getBpmRange(bpms: number[]) {
                const uniqueBpms = _.uniq(bpms);
                if (uniqueBpms.length <= 0) return "0";
                else if (uniqueBpms.length == 1) return `${uniqueBpms[0]}`;
                else {
                    const minBpm = Math.min(...uniqueBpms);
                    const maxBpm = Math.max(...uniqueBpms);
                    return `${minBpm}-${maxBpm}`;
                }
            }
            Util.drawText(
                ctx,
                `#${chart.id} BPM: ${getBpmRange(chart.bpms)}`,
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

            const EVENT_JPN = chart.events
                .filter(
                    (v) =>
                        v.version.region == "JPN" &&
                        Util.Chunithm.getNumberVersion(v.version) >=
                            Chart.JPN_LATEST
                )
                .map((v) => v.type);
            const EVENT_INT = chart.events
                .filter(
                    (v) =>
                        v.version.region == "INT" &&
                        Util.Chunithm.getNumberVersion(v.version) >=
                            Chart.INT_LATEST
                )
                .map((v) => v.type);
            const EVENT_CHN = chart.events
                .filter(
                    (v) =>
                        v.version.region == "CHN" &&
                        Util.Chunithm.getNumberVersion(v.version) >=
                            Chart.CHN_LATEST
                )
                .map((v) => v.type);
            const EXIST_JPN =
                EVENT_JPN.includes("existence") &&
                !EVENT_JPN.includes("removal")
                    ? "🇯🇵"
                    : "";
            const EXIST_INT =
                EVENT_INT.includes("existence") &&
                !EVENT_INT.includes("removal")
                    ? "🌏"
                    : "";
            const EXIST_CHN =
                EVENT_CHN.includes("existence") &&
                !EVENT_CHN.includes("removal")
                    ? "🇨🇳"
                    : "";
            const title = [];
            if (EXIST_JPN) title.push(EXIST_JPN);
            if (EXIST_INT) title.push(EXIST_INT);
            if (EXIST_CHN) title.push(EXIST_CHN);
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
        }
        /* End Detail Draw */
    }
    private static async drawChartGridModule(
        ctx: CanvasRenderingContext2D,
        theme: Chart.ITheme,
        element: Chart.IThemeChartGridElement,
        chartId: number,
        scores: (IScore | null)[],
        region: "JPN" | "INT" | "CHN" = "JPN"
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
        for (let i = EDifficulty.BASIC; i <= EDifficulty.ULTIMA; ++i) {
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
                        region,
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
                            region,
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
                        region,
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
            element.height * 2.526,
            element.height
        );

        /* Begin Profile Picture Draw */
        {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(
                element.x + element.height * 2.0,
                element.y + element.height * 0.3,
                element.height * 0.45,
                element.height * 0.45,
                0
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
                element.x + element.height * 2.0,
                element.y + element.height * 0.3,
                element.height * 0.45,
                element.height * 0.45
            );

            if (profilePicture) {
                ctx.beginPath();
                ctx.roundRect(
                    element.x + element.height * 2.0,
                    element.y + element.height * 0.3,
                    element.height * 0.45,
                    element.height * 0.45,
                    0
                );
                ctx.strokeStyle = Color.rgb(dominant).darken(0.3).hex();
                ctx.lineWidth = element.height / 128;
                ctx.stroke();
            }
            ctx.restore();
        }
        /* End Profile Picture Draw */

        /* Begin Username Draw */
        {
            ctx.beginPath();
            ctx.roundRect(
                element.x + element.height * (21 / 32),
                element.y + element.height * (11 / 32),
                element.height * (85 / 64),
                element.height * (13 / 32),
                0
            );
            ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
            ctx.fill();

            // const ratingImgBuffer = await this.getRatingNumber(rating, theme);
            // if (ratingImgBuffer) {
            //     const { width, height } =
            //         await sharp(ratingImgBuffer).metadata();
            //     if (width && height) {
            //         const aspectRatio = width / height;
            //         const image = new Image();
            //         image.src = ratingImgBuffer;
            //         const drawHeight = (element.height * 7) / 32;
            //         ctx.drawImage(
            //             image,
            //             element.x + element.height * 2.0,
            //             element.y + element.height * 0.3,
            //             drawHeight * aspectRatio * 0.8,
            //             drawHeight
            //         );
            //     }
            // }
            Util.drawText(
                ctx,
                "Lv.",
                element.x + element.height * (43 / 64),
                element.y + element.height * (0.3 + 1 / 4),
                (element.height * 1) / 16,
                0,
                ((element.height / 3) * 5.108 * 3.1) / 5,
                "left",
                "black",
                "black",
                "standard-font-username"
            );
            Util.drawText(
                ctx,
                "99",
                element.x + element.height * (49 / 64),
                element.y + element.height * (0.3 + 1 / 4),
                (element.height * 1) / 11,
                0,
                ((element.height / 3) * 5.108 * 3.1) / 5,
                "left",
                "black",
                "black",
                "standard-font-username"
            );

            Util.drawText(
                ctx,
                Util.HalfFullWidthConvert.toFullWidth(username),
                element.x + element.height * (56 / 64),
                element.y + element.height * (0.3 + 1 / 4),
                (element.height * 1) / 8,
                0,
                element.height * (65 / 64),
                "left",
                "black",
                "black",
                "standard-font-username"
            );

            Util.drawText(
                ctx,
                "RATING",
                element.x + element.height * (43 / 64),
                element.y + element.height * (47 / 64),
                (element.height * 7) / 88,
                0,
                ((element.height / 3) * 5.108 * 3.1) / 5,
                "left",
                "black",
                "black",
                "standard-font-username"
            );
            Util.drawText(
                ctx,
                Util.truncate(rating, 2),
                element.x + element.height * (67 / 64),
                element.y + element.height * (47 / 64),
                (element.height * 5) / 44,
                0,
                ((element.height / 3) * 5.108 * 3.1) / 5,
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
        scores: (IScore | null)[],
        type: "new" | "recents" = "recents",
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer;
            region?: "JPN" | "INT" | "CHN";
        } = {}
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
                            scores,
                            options?.region
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
                            rating: Util.truncate(rating, 0),
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
        type: "new" | "recents" = "recents",
        options: {
            scale?: number;
            theme?: string;
            profilePicture?: Buffer | null;
            region?: "JPN" | "INT" | "CHN";
        } = {}
    ) {
        const profile = await source.getPlayerInfo(username, type);
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
                score.ultima,
                score.worldsEnd,
            ],
            type,
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
        milestone: {
            aj: string;
            ajc: string;
            fc: string;
            none: string;
        };
        ratingNumberMap: string;
        profile: {
            icon: string;
            nameplate: string;
        };
        versions: {
            JPN: {
                100: string;
                105: string;
                110: string;
                115: string;
                120: string;
                125: string;
                130: string;
                135: string;
                140: string;
                145: string;
                150: string;
                155: string;
                200: string;
                205: string;
                210: string;
                215: string;
                220: string;
                225: string;
                230: string;
                240: string;
            };
            INT: {
                100: string;
                105: string;
                110: string;
                115: string;
                120: string;
                125: string;
                130: string;
                135: string;
                140: string;
            };
            CHN: {
                100: string;
                110: string;
                120: string;
                130: string;
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
                ultima: string;
                worldsEnd: string;
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
