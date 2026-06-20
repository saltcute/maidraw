import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapClip, wrapTranslate } from "@common/utils/ctxWrapper";
import { safeLoadImage } from "@common/utils/loadImage";
import type { ExtendParameters, ReplaceReturnType } from "@common/utils/misc";
import { truncate } from "@common/utils/number";
import { drawEmojiOrGlyph } from "@common/utils/textDraw/drawEmojiOrGlyphs";
import { drawText } from "@common/utils/textDraw/drawText";
import { capitalize, measureText, visibleLength } from "@common/utils/textDraw/utils";
import { color } from "@common/utils/zod";
import { AchievementTypes, ComboLamp, type Score, SyncLamp } from "@maimai/lib/types";
import { CN_LATEST, DX_LATEST, EX_LATEST, findMinorVersion, findNewerMinorVersion } from "@maimai/lib/version";
import type { CanvasRenderingContext2D } from "canvas";
import Color from "color";
import { type Database, Difficulty } from "gcm-database/maimai";
import type { Chart, Existence, Presences, Regions, Removal, Version } from "gcm-database-local/maimai";
import _ from "lodash";
import sharp from "sharp";
import z from "zod/v4";
import type { ChartPainter } from "../chart";

export interface ChartGridModulePainterContext {
    chartIdentifier: string;
    scores: Record<Difficulty, Score | null>;
    region?: Regions;
}

export class ChartGridModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("chart-grid"),
        width: z.number().min(1),
        height: z.number().min(1),
        margin: z.number().min(0),
        gap: z.number().min(0),
        bubble: z.object({
            margin: z.number().min(0),
            color: z.object({
                basic: color(),
                advanced: color(),
                expert: color(),
                master: color(),
                remaster: color(),
                utage: color(),
            }),
        }),
        color: z.object({
            card: color(),
        }),
        sprites: z.object({
            achievement: z.object({
                d: z.string(),
                c: z.string(),
                b: z.string(),
                bb: z.string(),
                bbb: z.string(),
                a: z.string(),
                aa: z.string(),
                aaa: z.string(),
                s: z.string(),
                sp: z.string(),
                ss: z.string(),
                ssp: z.string(),
                sss: z.string(),
                sssp: z.string(),
            }),
            milestone: z.object({
                ap: z.string(),
                app: z.string(),
                fc: z.string(),
                fcp: z.string(),
                fdx: z.string(),
                fdxp: z.string(),
                fs: z.string(),
                fsp: z.string(),
                sync: z.string(),
                none: z.string(),
            }),
            versions: z.object({
                // biome-ignore lint/style/useNamingConvention: region code
                OLD: z.record(z.string(), z.string()),
                // biome-ignore lint/style/useNamingConvention: region code
                DX: z.record(z.string(), z.string()),
                // biome-ignore lint/style/useNamingConvention: region code
                EX: z.record(z.string(), z.string()),
                // biome-ignore lint/style/useNamingConvention: region code
                CN: z.record(z.string(), z.string()),
            }),
        }),
    });
    private getBubbleColorByDifficulty: ReplaceReturnType<ExtendParameters<typeof this.draw, [chart: Chart]>, string> = (
        _,
        __,
        element,
        ___,
        chart,
    ) => {
        const colorMap = {
            [Difficulty.EASY]: element.bubble.color.basic,
            [Difficulty.BASIC]: element.bubble.color.basic,
            [Difficulty.ADVANCED]: element.bubble.color.advanced,
            [Difficulty.EXPERT]: element.bubble.color.expert,
            [Difficulty.MASTER]: element.bubble.color.master,
            [Difficulty.RE_MASTER]: element.bubble.color.remaster,
            [Difficulty.UTAGE]: element.bubble.color.utage,
        } as const;
        return colorMap[chart.difficulty];
    };
    private getDifficultyReadableName: ReplaceReturnType<ExtendParameters<typeof this.draw, [chart: Chart]>, string> = (_, __, ___, ____, chart) => {
        const colorMap = {
            [Difficulty.EASY]: "EASY",
            [Difficulty.BASIC]: "BASIC",
            [Difficulty.ADVANCED]: "ADVANCED",
            [Difficulty.EXPERT]: "EXPERT",
            [Difficulty.MASTER]: "MASTER",
            [Difficulty.RE_MASTER]: "Re:MASTER",
            [Difficulty.UTAGE]: "U・TA・GE",
        } as const;
        return colorMap[chart.difficulty];
    };
    private getAchievementRankImagePath: ReplaceReturnType<ExtendParameters<typeof this.draw, [score: Score]>, string> = (
        _,
        __,
        element,
        ___,
        score,
    ) => {
        const map = {
            [AchievementTypes.D]: element.sprites.achievement.d,
            [AchievementTypes.C]: element.sprites.achievement.c,
            [AchievementTypes.B]: element.sprites.achievement.b,
            [AchievementTypes.BB]: element.sprites.achievement.bb,
            [AchievementTypes.BBB]: element.sprites.achievement.bbb,
            [AchievementTypes.A]: element.sprites.achievement.a,
            [AchievementTypes.AA]: element.sprites.achievement.aa,
            [AchievementTypes.AAA]: element.sprites.achievement.aaa,
            [AchievementTypes.S]: element.sprites.achievement.s,
            [AchievementTypes.SP]: element.sprites.achievement.sp,
            [AchievementTypes.SS]: element.sprites.achievement.ss,
            [AchievementTypes.SSP]: element.sprites.achievement.ssp,
            [AchievementTypes.SSS]: element.sprites.achievement.sss,
            [AchievementTypes.SSSP]: element.sprites.achievement.sssp,
        } as const;
        return map[score.achievementRank];
    };
    private getComboLampImagePath: ReplaceReturnType<ExtendParameters<typeof this.draw, [score: Score]>, string> = (_, __, element, ___, score) => {
        const map = {
            [ComboLamp.NONE]: element.sprites.milestone.none,
            [ComboLamp.FULL_COMBO]: element.sprites.milestone.fc,
            [ComboLamp.FULL_COMBO_PLUS]: element.sprites.milestone.fcp,
            [ComboLamp.ALL_PERFECT]: element.sprites.milestone.ap,
            [ComboLamp.ALL_PERFECT_PLUS]: element.sprites.milestone.app,
        } as const;
        return map[score.combo];
    };
    private getSyncLampImagePath: ReplaceReturnType<ExtendParameters<typeof this.draw, [score: Score]>, string> = (_, __, element, ___, score) => {
        const map = {
            [SyncLamp.NONE]: element.sprites.milestone.none,
            [SyncLamp.SYNC_PLAY]: element.sprites.milestone.sync,
            [SyncLamp.FULL_SYNC]: element.sprites.milestone.fs,
            [SyncLamp.FULL_SYNC_PLUS]: element.sprites.milestone.fsp,
            [SyncLamp.FULL_SYNC_DX]: element.sprites.milestone.fdx,
            [SyncLamp.FULL_SYNC_DX_PLUS]: element.sprites.milestone.fdxp,
        } as const;
        return map[score.sync];
    };
    constructor(private database: Database<Chart>) {
        super();
    }
    // private base: typeof this.drawChartGridCard = async (ctx, theme, element, painterCtx, options) => {};
    private getTitleSize: ReplaceReturnType<typeof this.drawChartGridCard, number> = (_, __, ___, ____, options) => {
        return options.height * (47 / 256);
    };
    private drawLamp: typeof this.drawChartGridCard = async (ctx, theme, element, painterCtx, options) => {
        const score = painterCtx.scores[options.chart.difficulty];
        if (score) {
            const titleSize = this.getTitleSize(ctx, theme, element, painterCtx, options);
            const baseLine = element.bubble.margin + titleSize + element.bubble.margin * (1 / 2);
            const rank = await safeLoadImage(theme.getFile(this.getAchievementRankImagePath(ctx, theme, element, painterCtx, score)));
            ctx.drawImage(rank, element.bubble.margin * (1 / 4), baseLine, options.height * 0.806 * 0.3 * 2.133, options.height * 0.806 * 0.3);
            const combo = await safeLoadImage(theme.getFile(this.getComboLampImagePath(ctx, theme, element, painterCtx, score)));
            ctx.drawImage(
                combo,
                options.height * 0.806 * (0.32 * 2.133 + 0.06 - 0.1),
                baseLine,
                options.height * 0.806 * 0.32,
                options.height * 0.806 * 0.32,
            );
            const sync = await safeLoadImage(theme.getFile(this.getSyncLampImagePath(ctx, theme, element, painterCtx, score)));
            ctx.drawImage(
                sync,
                options.height * 0.806 * (0.32 * 2.133 + 0.04 + 0.32 - 0.1),
                baseLine,
                options.height * 0.806 * 0.32,
                options.height * 0.806 * 0.32,
            );
        }
    };
    private drawAchievementRate: typeof this.drawChartGridCard = async (ctx, theme, element, painterCtx, options) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, theme, element, painterCtx, options.chart);

        const score = painterCtx.scores[options.chart.difficulty];
        const scoreSize = options.height * 0.806 * 0.208;
        const titleSize = this.getTitleSize(ctx, theme, element, painterCtx, options);

        return drawText(
            ctx,
            score ? `${truncate(score.achievement, 4)}%` : "NO RECORD",
            options.height * 2 - element.bubble.margin - options.height * 0.806 * 0.02,
            element.bubble.margin + titleSize + element.bubble.margin * (5 / 8) + scoreSize,
            scoreSize,
            options.height * 0.806 * 0.04,
            {
                textAlign: "right",
                mainColor: "white",
                borderColor: new Color(curColor).darken(0.3).hexa(),
            },
        );
    };
    private drawDifficultyName: typeof this.drawChartGridCard = async (ctx, theme, element, painterCtx, options) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, theme, element, painterCtx, options.chart);

        const titleSize = options.height * (47 / 256);
        const difficulty = this.getDifficultyReadableName(ctx, theme, element, painterCtx, options.chart);
        const levelTextSize = titleSize * (5 / 8);
        drawText(
            ctx,
            difficulty,
            element.bubble.margin,
            element.bubble.margin + titleSize - element.bubble.margin * (1 / 4),
            titleSize,
            options.height * 0.806 * 0.04,
            {
                textAlign: "left",
                mainColor: "white",
                borderColor: new Color(curColor).darken(0.3).hexa(),
            },
        );
        const score = painterCtx.scores[options.chart.difficulty];
        const difficultyTextWidth = measureText(ctx, difficulty, titleSize, Infinity).width;
        drawText(
            ctx,
            `Lv. ${options.chart.internalLevel ? truncate(options.chart.internalLevel, 1) : options.chart.level}${score ? `　↑${truncate(score.dxRating, 0)}` : ""}`,
            element.bubble.margin * 2 + difficultyTextWidth,
            element.bubble.margin + titleSize - element.bubble.margin * (1 / 4),
            levelTextSize,
            options.height * 0.806 * 0.04,
            {
                textAlign: "left",
                mainColor: "white",
                borderColor: new Color(curColor).darken(0.3).hexa(),
            },
        );

        return wrapBackground(
            ctx,
            new Color(curColor).darken(0.3).hex(),
            () => {},
            element.bubble.margin,
            element.bubble.margin + titleSize + element.bubble.margin * (1 / 4),
            options.height * 2 - element.bubble.margin * 2,
            options.height * 0.806 * 0.02,
            options.height * 0.806 * 0.16,
        );
    };
    private drawChartDesigner: typeof this.drawChartGridCard = async (ctx, theme, element, painterCtx, options) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, theme, element, painterCtx, options.chart);
        const borderRadius = (options.height * 0.806) / 7;
        return wrapBackground(
            ctx,
            new Color(curColor).lighten(0.4).hexa(),
            () => {
                return wrapClip(
                    ctx,
                    () => {
                        return drawText(
                            ctx,
                            options.chart.designer,
                            element.bubble.margin,
                            options.height * (0.806 + (1 - 0.806) / 2),
                            options.height * 0.806 * 0.128,
                            options.height * 0.806 * 0.04,
                            {
                                textAlign: "left",
                                mainColor: "white",
                                borderColor: new Color(curColor).darken(0.3).hexa(),
                            },
                        );
                    },
                    0,
                    options.height * 0.742,
                    options.height * 2,
                    options.height * (1 - 0.742),
                    [0, borderRadius, 0, borderRadius],
                );
            },
            0,
            options.height * 0.742,
            options.height * 2,
            options.height * (1 - 0.742),
            [0, borderRadius, 0, borderRadius],
        );
    };
    private drawDxScore: typeof this.drawChartGridCard = async (ctx, theme, element, painterCtx, options) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, theme, element, painterCtx, options.chart);

        const score = painterCtx.scores[options.chart.difficulty];
        const notes = (options.chart as Chart).notes;
        const maxDxScore = truncate(notes.tap * 3 + notes.hold * 3 + notes.slide * 3 + notes.touch * 3 + notes.break * 3, 0);
        drawText(
            ctx,
            `${score && score.dxScore >= 0 ? `${score.dxScore}/` : "MAX DX SCR: "}${maxDxScore}`,
            options.height * 2 - element.bubble.margin,
            options.height - element.bubble.margin * 3.1,
            options.height * 0.806 * 0.128,
            options.height * 0.806 * 0.04,
            {
                textAlign: "right",
                mainColor: "white",
                borderColor: new Color(curColor).darken(0.3).hexa(),
            },
        );
    };
    private drawVersion: typeof this.drawChartGridCard = async (ctx, theme, element, painterCtx, options) => {
        const versionImageHeight = (options.height - element.bubble.margin * 2) * (options.isShort ? 1 / 3 : 3 / 8);
        const versionImageWidth = (versionImageHeight / 160) * 332;
        const regionTextSize = versionImageHeight * (5 / 8);

        const versions: {
            region: "OLD" | "USA" | Regions;
            version?: Version;
            exAppend: boolean;
        }[] = [];
        for (let i = 0; i < 5; ++i) {
            versions[i] = {
                region: "DX",
                version: undefined,
                exAppend: false,
            };
        }
        const lastUsaLockVersion = (() => {
            let lastVersion: Version | undefined;
            for (const presence of options.chart.optionalData.presences) {
                if (presence.version.region === "EX" && presence.type === "usa_lock") {
                    lastVersion = presence.version;
                }
            }
            return lastVersion ?? null;
        })();
        const VerDx =
            options.chart.difficulty === Difficulty.RE_MASTER
                ? options.chart.optionalData.presences.find((v) => v.type === "existence" && v.version.region === "DX")?.version
                : options.chart.optionalData.version.displayVersion.DX;
        const VerEx =
            options.chart.difficulty === Difficulty.RE_MASTER
                ? options.chart.optionalData.presences.find((v) => v.type === "existence" && v.version.region === "EX")?.version
                : options.chart.optionalData.version.displayVersion.EX;

        const VerCn =
            options.chart.difficulty === Difficulty.RE_MASTER
                ? options.chart.optionalData.presences.find((v) => v.type === "existence" && v.version.region === "CN")?.version
                : options.chart.optionalData.version.displayVersion.CN;
        if (VerDx) {
            const version = versions[0];
            version.version = VerDx;
            version.region = "DX";
        }
        const VerUsaMinor = lastUsaLockVersion
            ? findNewerMinorVersion(lastUsaLockVersion.gameVersion.major, lastUsaLockVersion.gameVersion.minor, "EX")
            : VerEx?.gameVersion.minor;
        if (VerEx) {
            let appenedEx = false;
            for (let i = 0; i < 2; ++i) {
                const version = versions[i];
                if (version.version) {
                    if (
                        !(
                            version.version.gameVersion.major >= 2 &&
                            version.version.gameVersion.minor >= 10 &&
                            version.version.gameVersion.minor < 20 &&
                            version.region === "DX"
                        ) &&
                        _.isEqual(versions[i].version?.gameVersion, VerEx.gameVersion)
                    ) {
                        versions[i].exAppend = true;
                        appenedEx = true;
                    }
                } else {
                    if (!appenedEx) {
                        version.version = VerEx;
                        version.region = "EX";
                    }
                    if (VerUsaMinor && VerEx.gameVersion.minor !== VerUsaMinor) {
                        versions[appenedEx ? i : i + 1].version = {
                            ...VerEx,
                            gameVersion: {
                                ...VerEx.gameVersion,
                                minor: VerUsaMinor,
                            },
                        };
                        versions[appenedEx ? i : i + 1].region = "USA";
                        break;
                    }
                    break;
                }
            }
        }
        if (VerCn) {
            for (let i = 0; i < 4; ++i) {
                const version = versions[i];
                if (version.version) {
                    if (version.version.gameVersion.major < 2 && _.isEqual(versions[i].version?.gameVersion, VerCn.gameVersion)) {
                        break;
                    }
                } else {
                    version.version = VerCn;
                    version.region = "CN";
                    break;
                }
            }
        }
        for (const version of versions) {
            if (version.version) {
                if (version.version.gameVersion.major < 2) version.region = "OLD";
            }
        }
        for (
            let i = 0, curx = options.width - element.bubble.margin, cury = element.bubble.margin;
            i < versions.length;
            ++i,
                cury = options.isShort || curx - versionImageWidth - regionTextSize < options.height * 2 ? cury + versionImageHeight : cury,
                curx =
                    options.isShort || curx - versionImageWidth - regionTextSize < options.height * 2 ? options.width - element.bubble.margin : curx
        ) {
            const version = versions[i];
            if (version.version) {
                let region = version.region === "USA" ? "EX" : version.region;
                if (region === "EX" && !(version.version.gameVersion.minor >= 10 && version.version.gameVersion.minor < 20)) {
                    region = "DX";
                }
                const rawVersion = findMinorVersion(version.version.gameVersion.major, version.version.gameVersion.minor, painterCtx.region || "DX");
                if (rawVersion != null) {
                    const versionImage = theme.getFile(element.sprites.versions[region][rawVersion]);
                    try {
                        if (versionImage) {
                            sharp(versionImage);
                            const versionImg = await safeLoadImage(versionImage);
                            let text: string;
                            switch (version.region) {
                                case "DX":
                                    if (version.exAppend) text = `🇯🇵${VerUsaMinor !== version.version.gameVersion.minor ? "" : "🇨🇦"}🌏`;
                                    else text = "🇯🇵";
                                    break;
                                case "EX":
                                    text = `🌏${VerUsaMinor !== version.version.gameVersion.minor ? "" : "🇨🇦"}`;
                                    break;
                                case "USA":
                                    text = "🇨🇦";
                                    break;
                                case "CN":
                                    text = "🇨🇳";
                                    break;
                                default:
                                    text = "";
                            }
                            curx -= versionImageWidth;
                            ctx.drawImage(versionImg, curx, cury, versionImageWidth, versionImageHeight);
                            if (version.region !== "OLD") {
                                await drawEmojiOrGlyph(
                                    ctx,
                                    text,
                                    curx,
                                    cury + regionTextSize + (versionImageHeight - regionTextSize) / 2,
                                    regionTextSize,
                                    {
                                        textAlign: "right",
                                    },
                                );
                                curx -= visibleLength(text) * regionTextSize + element.bubble.margin;
                            }
                        }
                    } catch {}
                }
            }
        }
    };
    private drawNoteCount: ExtendParameters<
        typeof this.drawChartGridCard,
        [callback: ExtendParameters<typeof this.drawChartGridCard, [noteCountLength: number]>]
    > = async (ctx, theme, element, painterCtx, options, callback) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, theme, element, painterCtx, options.chart);
        const noteCountTexts = Object.entries(options.chart.notes).map(([k, v]) => `${capitalize(k)}: ${v}`);
        const noteCountTextSize = (options.height - element.bubble.margin * 4) / noteCountTexts.length;
        let noteCountLength = 0;
        noteCountTexts.forEach((v, i) => {
            drawText(
                ctx,
                v,
                element.bubble.margin * (3 / 2) + options.height * 2,

                element.bubble.margin + noteCountTextSize + (noteCountTextSize + element.bubble.margin / 2) * i,
                noteCountTextSize,
                options.height * 0.806 * 0.04,
                {
                    textAlign: "left",
                    mainColor: "white",
                    borderColor: new Color(curColor).darken(0.3).hexa(),
                },
            );
            const length = measureText(ctx, v, noteCountTextSize, Infinity).width;
            if (length > noteCountLength) noteCountLength = length;
        });
        return callback(ctx, theme, element, painterCtx, options, noteCountLength);
    };
    private drawInternalLevelTrend: ExtendParameters<typeof this.drawChartGridCard, [noteCountLength: number]> = async (
        ctx,
        theme,
        element,
        painterCtx,
        options,
        noteCountLength,
    ) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, theme, element, painterCtx, options.chart);
        const versionImageHeight = (options.height - element.bubble.margin * 2) * (options.isShort ? 1 / 3 : 3 / 8);
        const versionImageWidth = (versionImageHeight / 160) * 332;
        const noteCountTexts = Object.entries(options.chart.notes).map(([k, v]) => `${capitalize(k)}: ${v}`);
        const noteCountTextSize = (options.height - element.bubble.margin * 4) / noteCountTexts.length;

        if (!options.isShort) {
            const CurrentMinor = (() => {
                switch (options.targetRegion) {
                    case "EX":
                        return EX_LATEST;
                    case "CN":
                        return CN_LATEST;
                    default:
                        return DX_LATEST;
                }
            })();
            const maxWidth = options.width - options.height * 2 - element.bubble.margin * 4 - noteCountLength;
            const maxFitTrendCount = Math.trunc(maxWidth / versionImageWidth);
            const trendEvents = options.chart.optionalData.presences.filter(
                (v): v is Existence => v.type === "existence" && v.version.region === options.targetRegion,
            );
            let actualEvents: Presences[] = _.uniqWith(trendEvents, (a, b) => {
                return _.isEqual(a.data.level, b.data.level);
            });
            if (actualEvents.length === maxFitTrendCount) {
                if (actualEvents[actualEvents.length - 1] !== trendEvents[trendEvents.length - 1]) {
                    actualEvents.splice(1, 1);
                    actualEvents.push(trendEvents[trendEvents.length - 1]);
                }
            } else if (actualEvents.length > maxFitTrendCount) {
                while (actualEvents.length > maxFitTrendCount) actualEvents.shift();
                actualEvents.shift();
                actualEvents.shift();
                actualEvents.unshift(trendEvents[0]);
                actualEvents.push(trendEvents[trendEvents.length - 1]);
            } else if (trendEvents.length > maxFitTrendCount) {
                actualEvents = _.filter(
                    actualEvents,
                    (v) =>
                        !(
                            _.isEqual(v.version.gameVersion, trendEvents[0].version.gameVersion) ||
                            _.isEqual(v.version.gameVersion, trendEvents[trendEvents.length - 1].version.gameVersion)
                        ),
                );
                for (let i = trendEvents.length - 2; i > 0 && actualEvents.length < maxFitTrendCount - 2; --i) {
                    const event = trendEvents[i];
                    if (event) actualEvents.push(event);
                    actualEvents = _.uniqWith(actualEvents, (a, b) => {
                        return (
                            _.isEqual(a.version.gameVersion.major, b.version.gameVersion.major) &&
                            _.isEqual(a.version.gameVersion.minor, b.version.gameVersion.minor)
                        );
                    });
                }
                actualEvents.unshift(trendEvents[0]);
                actualEvents.push(trendEvents[trendEvents.length - 1]);
                actualEvents = _.uniqWith(actualEvents, (a, b) => {
                    return (
                        _.isEqual(a.version.gameVersion.major, b.version.gameVersion.major) &&
                        _.isEqual(a.version.gameVersion.minor, b.version.gameVersion.minor)
                    );
                });
                actualEvents = _.sortBy(actualEvents, (v) => v.version.gameVersion.minor);
                if (trendEvents.length > 1) {
                    if (actualEvents.length >= maxFitTrendCount) actualEvents.pop();
                    actualEvents.push(trendEvents[trendEvents.length - 1]);
                }
                const removalEvent = options.chart.optionalData.presences.find(
                    (v): v is Removal => v.type === "removal" && v.version.region === options.targetRegion,
                );
                if (removalEvent) {
                    while (actualEvents.length >= maxFitTrendCount) actualEvents.splice(1, 1);
                    actualEvents.push(removalEvent);
                }
            } else {
                actualEvents = [...trendEvents];
            }
            if (
                trendEvents[trendEvents.length - 1]?.version.gameVersion.minor < CurrentMinor &&
                actualEvents[actualEvents.length - 1]?.type !== "removal"
            ) {
                while (actualEvents.length >= maxFitTrendCount) actualEvents.splice(1, 1);
                const tmpEvent = trendEvents[trendEvents.length - 1];
                actualEvents.push({
                    type: "removal",
                    version: {
                        name: "PLACEHOLDER VERSION NAME",
                        gameVersion: {
                            major: tmpEvent.version.gameVersion.major,
                            minor:
                                findNewerMinorVersion(
                                    tmpEvent.version.gameVersion.major,
                                    tmpEvent.version.gameVersion.minor,
                                    painterCtx.region || "DX",
                                ) ?? DX_LATEST,
                        },
                        region: painterCtx.region || "DX",
                    },
                });
            }
            actualEvents = _.uniqWith(actualEvents, (a, b) => {
                return (
                    _.isEqual(a.version.gameVersion.major, b.version.gameVersion.major) &&
                    _.isEqual(a.version.gameVersion.minor, b.version.gameVersion.minor) &&
                    _.isEqual(a.type, b.type)
                );
            });
            let positionAdjustment = 0;
            let addGap = (maxWidth - actualEvents.length * versionImageWidth) / (actualEvents.length - 1);
            if (addGap > maxWidth / 5) {
                addGap = maxWidth / 5;
                positionAdjustment = (maxWidth - (addGap * (actualEvents.length - 1) + versionImageWidth * actualEvents.length)) / 2;
            }
            if (actualEvents.length <= 0) {
                drawText(
                    ctx,
                    `This chart is not playable in ${(() => {
                        switch (options.targetRegion) {
                            case "EX":
                                return "maimai DX International ver";
                            case "CN":
                                return "舞萌DX";
                            default:
                                return "maimai でっらくす";
                        }
                    })()}.\nIt may have been scheduled to release in a future version.`,
                    element.bubble.margin * (7 / 2) + options.height * 2 + noteCountLength,
                    element.bubble.margin + options.height / 2,
                    noteCountTextSize * 1.3,
                    options.height * 0.806 * 0.04,
                    {
                        mainColor: "white",
                        borderColor: new Color(curColor).darken(0.3).hexa(),
                    },
                );
            } else {
                for (
                    let i = 0,
                        curx = positionAdjustment + options.height * 2 + element.bubble.margin * (5 / 2) + noteCountLength,
                        cury = element.bubble.margin * (3 / 2) + versionImageHeight;
                    i < actualEvents.length;
                    ++i
                ) {
                    const event = actualEvents[i];
                    if (!event) continue;
                    let logoRegion: "OLD" | "DX" | "EX" | "CN" = event.version.gameVersion.major >= 2 ? options.targetRegion : "OLD";
                    if (logoRegion === "EX") {
                        if (!(10 <= event.version.gameVersion.minor && event.version.gameVersion.minor < 20)) {
                            logoRegion = "DX";
                        }
                    }
                    const rawVersion = findMinorVersion(event.version.gameVersion.major, event.version.gameVersion.minor, options.targetRegion);
                    if (rawVersion != null) {
                        const versionImage = theme.getFile(element.sprites.versions[logoRegion][rawVersion]);
                        try {
                            if (!versionImage) throw "No versionImage";
                            sharp(versionImage);
                            const versionImg = await safeLoadImage(versionImage);
                            ctx.drawImage(versionImg, curx, cury, versionImageWidth, versionImageHeight);
                        } catch {
                            const str = `${event.version.gameVersion.major >= 2 ? "DX " : ""}${event.version.gameVersion.major}.${event.version.gameVersion.minor}`;
                            const measurement = measureText(ctx, str, noteCountTextSize * 1.2, Infinity);
                            drawText(
                                ctx,
                                str,
                                curx + versionImageWidth / 2,
                                cury + versionImageHeight / 2 - (measurement.actualBoundingBoxDescent - measurement.actualBoundingBoxAscent) / 2,
                                noteCountTextSize * 1.2,
                                options.height * 0.806 * 0.04,
                                {
                                    textAlign: "center",
                                    mainColor: "white",
                                    borderColor: new Color(curColor).darken(0.3).hexa(),
                                },
                            );
                        }

                        if (event.type === "existence") {
                            let symbol = "";
                            if (i !== 0) {
                                const lastEvent = actualEvents[i - 1];
                                if (lastEvent.type === "existence") {
                                    if (lastEvent.data.level < event.data.level) symbol = "↑";
                                    else if (lastEvent.data.level > event.data.level) symbol = "↓";
                                    else if (lastEvent.data.level === event.data.level) symbol = "→";
                                }
                            }
                            drawText(
                                ctx,
                                `${symbol}${truncate(event.data.level, 1)}`,
                                curx + versionImageWidth / 2,
                                cury + versionImageHeight + noteCountTextSize,
                                noteCountTextSize,
                                options.height * 0.806 * 0.04,
                                {
                                    textAlign: "center",
                                    mainColor: "white",
                                    borderColor: new Color(curColor).darken(0.3).hexa(),
                                },
                            );
                        } else if (event.type === "removal") {
                            drawText(
                                ctx,
                                `❌`,
                                curx + versionImageWidth / 2,
                                cury + versionImageHeight + noteCountTextSize,
                                noteCountTextSize,
                                options.height * 0.806 * 0.04,
                                {
                                    textAlign: "center",
                                    mainColor: "white",
                                    borderColor: new Color(curColor).darken(0.3).hexa(),
                                },
                            );
                        }
                        curx += versionImageWidth + addGap;
                    }
                }
            }
        }
    };
    private drawChartGridCard: ExtendParameters<
        typeof this.draw,
        [
            options: {
                width: number;
                height: number;
                isShort: boolean;
                targetRegion: Regions;
                chart: Chart;
            },
        ]
    > = async (ctx, theme, element, painterCtx, options) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, theme, element, painterCtx, options.chart);
        const borderRadius = (options.height * 0.806) / 7;
        const cardDimensions = [0, 0, options.width, options.height, borderRadius] as const;
        return wrapBackground(
            ctx,
            new Color(curColor).lighten(0.4).hexa(),
            () /** Card base background (designer field) */ => {
                return wrapBorder(
                    ctx,
                    new Color(curColor).darken(0.3).hexa(),
                    element.bubble.margin / 4,
                    () /** Card background border */ =>
                        wrapClip(
                            ctx,
                            () /** Card background (content) */ =>
                                wrapBackground(
                                    ctx,
                                    curColor,
                                    () => {
                                        return wrapClip(
                                            ctx,
                                            async () => {
                                                await this.drawDifficultyName(ctx, theme, element, painterCtx, options);
                                                await this.drawAchievementRate(ctx, theme, element, painterCtx, options);
                                                await this.drawLamp(ctx, theme, element, painterCtx, options);

                                                await this.drawVersion(ctx, theme, element, painterCtx, options);
                                                await this.drawNoteCount(ctx, theme, element, painterCtx, options, this.drawInternalLevelTrend);

                                                await this.drawChartDesigner(ctx, theme, element, painterCtx, options);
                                                await this.drawDxScore(ctx, theme, element, painterCtx, options);
                                            },
                                            0,
                                            0,
                                            options.width,
                                            options.height,
                                        );
                                    },
                                    ...cardDimensions,
                                ),

                            ...cardDimensions,
                        ),
                    ...cardDimensions,
                );
            },
            ...cardDimensions,
        );
    };
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<z.infer<typeof ChartPainter.THEME>>,
        element: z.infer<typeof ChartGridModule.SCHEMA>,
        painterCtx: ChartGridModulePainterContext,
    ) {
        const backgroundBorderRadius = Math.min(theme.content.width, theme.content.height) * (3 / 128);

        return wrapTranslate(ctx, element.x, element.y, async () => {
            return wrapBorder(
                ctx,
                new Color(element.color.card).darken(0.5).hex(),
                backgroundBorderRadius / 4,
                async () =>
                    wrapBackground(
                        ctx,
                        element.color.card,
                        async () => {
                            const difficulties: Partial<Record<Difficulty, Chart>> = {};
                            for (const difficulty of Object.values(Difficulty)) {
                                const { data: chart } = await this.database.getChart(painterCtx.chartIdentifier, difficulty);
                                if (chart) difficulties[difficulty] = chart;
                            }

                            const cardWidth = element.width - element.margin * 2;
                            const cardHeight = (element.height - element.margin * 2 - element.gap * 3) / 4;
                            let y = element.margin;
                            for (const [difficulty, chart] of Object.entries(difficulties)) {
                                if (chart) {
                                    await wrapTranslate(ctx, element.margin, y, async () => {
                                        if (Object.values(difficulties).length > 4 && difficulty === Difficulty.BASIC) {
                                            await this.drawChartGridCard(ctx, theme, element, painterCtx, {
                                                chart,
                                                width: (cardWidth - element.margin) / 2,
                                                height: cardHeight,
                                                isShort: true,
                                                targetRegion: painterCtx.region ?? "DX",
                                            });
                                            const chartAdv = difficulties[Difficulty.ADVANCED];
                                            if (chartAdv) {
                                                await wrapTranslate(ctx, (cardWidth + element.margin) / 2, 0, () =>
                                                    this.drawChartGridCard(ctx, theme, element, painterCtx, {
                                                        chart: chartAdv,
                                                        width: (cardWidth - element.margin) / 2,
                                                        height: cardHeight,
                                                        isShort: true,
                                                        targetRegion: painterCtx.region ?? "DX",
                                                    }),
                                                );
                                            }
                                            y += cardHeight + element.gap;
                                        } else if (Object.values(difficulties).length <= 4 || difficulty !== Difficulty.ADVANCED) {
                                            await this.drawChartGridCard(ctx, theme, element, painterCtx, {
                                                chart,
                                                width: cardWidth,
                                                height: cardHeight,
                                                isShort: false,
                                                targetRegion: painterCtx.region ?? "DX",
                                            });
                                            y += cardHeight + element.gap;
                                        }
                                    });
                                }
                            }
                        },
                        0,
                        0,
                        element.width,
                        element.height,
                        backgroundBorderRadius,
                    ),
                0,
                0,
                element.width,
                element.height,
                backgroundBorderRadius,
            );
        });
    }
}
