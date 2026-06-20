import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapClip, wrapTranslate } from "@common/utils/ctxWrapper";
import { safeLoadImage } from "@common/utils/loadImage";
import { truncate } from "@common/utils/number";
import { drawText } from "@common/utils/textDraw/drawText";
import { capitalize, measureText } from "@common/utils/textDraw/utils";
import { color } from "@common/utils/zod";
import type { CanvasRenderingContext2D } from "canvas";
import Color from "color";
import { type Database, Difficulty } from "gcm-database/ongeki";
import type { Chart, Existence, Presences, Regions, Removal } from "gcm-database-local/ongeki";
import _ from "lodash";
import sharp from "sharp";
import z from "zod/v4";
import { AchievementTypes, BellLamp, ComboLamp, type Score } from "../../lib/types";
import { getMaxPlatinumScore } from "../../lib/util";
import { findNewerVersion, findVersion, JPN_LATEST } from "../../lib/version";

export interface ChartGridModulePainterContext {
    chartIdentifier: string;
    scores: Record<Difficulty, Score | null>;
    region?: Regions;
    type: "refresh" | "classic";
}

interface ChartGridCardOptions {
    width: number;
    height: number;
    isShort: boolean;
    targetRegion: Regions;
    chart: Chart;
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
                lunatic: color(),
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
                ss: z.string(),
                sss: z.string(),
                sssp: z.string(),
            }),
            milestone: z.object({
                ab: z.string(),
                abp: z.string(),
                fc: z.string(),
                fb: z.string(),
                none: z.string(),
            }),
            versions: z.object({
                // biome-ignore lint/style/useNamingConvention: region code
                JPN: z.record(z.string(), z.string()),
            }),
        }),
    });
    constructor(private database: Database<Chart>) {
        super();
    }

    private getBubbleColorByDifficulty(element: z.infer<typeof ChartGridModule.SCHEMA>, chart: Chart) {
        const colorMap = {
            [Difficulty.BASIC]: element.bubble.color.basic,
            [Difficulty.ADVANCED]: element.bubble.color.advanced,
            [Difficulty.EXPERT]: element.bubble.color.expert,
            [Difficulty.MASTER]: element.bubble.color.master,
            [Difficulty.LUNATIC]: element.bubble.color.lunatic,
        } as const;
        return colorMap[chart.difficulty];
    }
    private getDifficultyReadableName(chart: Chart) {
        const map = {
            [Difficulty.BASIC]: "BASIC",
            [Difficulty.ADVANCED]: "ADVANCED",
            [Difficulty.EXPERT]: "EXPERT",
            [Difficulty.MASTER]: "MASTER",
            [Difficulty.LUNATIC]: "LUNATIC",
        } as const;
        return map[chart.difficulty];
    }
    private getAchievementRankImagePath(element: z.infer<typeof ChartGridModule.SCHEMA>, score: Score) {
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
            [AchievementTypes.SS]: element.sprites.achievement.ss,
            [AchievementTypes.SSS]: element.sprites.achievement.sss,
            [AchievementTypes.SSSP]: element.sprites.achievement.sssp,
        } as const;
        return map[score.rank];
    }
    private getComboImagePath(element: z.infer<typeof ChartGridModule.SCHEMA>, score: Score) {
        const map = {
            [ComboLamp.NONE]: element.sprites.milestone.none,
            [ComboLamp.FULL_COMBO]: element.sprites.milestone.fc,
            [ComboLamp.ALL_BREAK]: element.sprites.milestone.ab,
            [ComboLamp.ALL_BREAK_PLUS]: element.sprites.milestone.abp,
        } as const;
        return map[score.combo];
    }
    private getBellImagePath(element: z.infer<typeof ChartGridModule.SCHEMA>, score: Score) {
        const map = {
            [BellLamp.NONE]: element.sprites.milestone.none,
            [BellLamp.FULL_BELL]: element.sprites.milestone.fb,
        } as const;
        return map[score.bell];
    }
    private getTitleSize(options: ChartGridCardOptions) {
        return options.height * (47 / 256);
    }
    private async drawDifficultyName(
        ctx: CanvasRenderingContext2D,
        element: z.infer<typeof ChartGridModule.SCHEMA>,
        painterCtx: ChartGridModulePainterContext,
        options: ChartGridCardOptions,
    ) {
        const curColor = this.getBubbleColorByDifficulty(element, options.chart);
        const titleSize = this.getTitleSize(options);
        const difficulty = this.getDifficultyReadableName(options.chart);
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
        const internalLevel = options.chart.internalLevel ? truncate(options.chart.internalLevel, 1) : options.chart.level;
        drawText(
            ctx,
            `Lv. ${internalLevel}${score ? `　↑${truncate(score.rating, painterCtx.type === "classic" ? 2 : 3)}` : ""}`,
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

        ctx.beginPath();
        ctx.roundRect(
            element.bubble.margin,
            element.bubble.margin + titleSize + element.bubble.margin * (1 / 4),
            options.height * 2 - element.bubble.margin * 2,
            options.height * 0.806 * 0.02,
            options.height * 0.806 * 0.16,
        );
        ctx.fillStyle = new Color(curColor).darken(0.3).hex();
        ctx.fill();
    }
    private async drawScore(
        ctx: CanvasRenderingContext2D,
        element: z.infer<typeof ChartGridModule.SCHEMA>,
        painterCtx: ChartGridModulePainterContext,
        options: ChartGridCardOptions,
    ) {
        const curColor = this.getBubbleColorByDifficulty(element, options.chart);
        const score = painterCtx.scores[options.chart.difficulty];
        const scoreSize = options.height * 0.806 * 0.208;
        const titleSize = this.getTitleSize(options);
        drawText(
            ctx,
            score ? truncate(score.score, 0) : "NO RECORD",
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
    }
    private async drawLamp(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ChartGridModule.SCHEMA>,
        painterCtx: ChartGridModulePainterContext,
        options: ChartGridCardOptions,
    ) {
        const score = painterCtx.scores[options.chart.difficulty];
        if (!score) return;
        const titleSize = this.getTitleSize(options);

        const achievementRankHeight = options.height * 0.806 * 0.3 * 0.85;
        const achievementRankWidth = achievementRankHeight * (286 / 143);
        const rank = await safeLoadImage(theme.getFile(this.getAchievementRankImagePath(element, score)));
        ctx.drawImage(
            rank,
            element.bubble.margin * (1 / 2),
            element.bubble.margin + titleSize + element.bubble.margin * (1 / 2),
            achievementRankWidth,
            achievementRankHeight,
        );

        const comboImgRatio = 84 / 290;
        const comboBgRatio = 64 / 272;
        const comboWidth = achievementRankHeight / comboImgRatio;
        const comboBackground = comboWidth * 0.9;
        const sizeDiff = comboWidth - comboBackground;

        const curX = element.bubble.margin * (1 / 2) + achievementRankWidth,
            curY = element.bubble.margin * (3 / 2) + titleSize;

        ctx.beginPath();
        ctx.fillStyle = "#e8eaec";
        ctx.roundRect(
            curX + sizeDiff / 2,
            curY + ((sizeDiff * 3) / 2) * comboBgRatio,
            comboBackground,
            comboBackground * comboBgRatio,
            (comboBackground * comboBgRatio) / 2,
        );
        ctx.roundRect(
            curX + sizeDiff / 2,
            curY + comboWidth * comboImgRatio + sizeDiff * (1 / 2) * comboBgRatio,
            comboBackground,
            comboBackground * comboBgRatio,
            (comboBackground * comboBgRatio) / 2,
        );
        ctx.fill();

        const combo = await safeLoadImage(theme.getFile(this.getComboImagePath(element, score)));
        const bell = await safeLoadImage(theme.getFile(this.getBellImagePath(element, score)));

        ctx.drawImage(combo, curX, curY, comboWidth, comboWidth * comboImgRatio);
        ctx.drawImage(bell, curX, curY + comboWidth * comboImgRatio - sizeDiff * comboBgRatio, comboWidth, comboWidth * comboImgRatio);
    }
    private drawNoteCount(ctx: CanvasRenderingContext2D, element: z.infer<typeof ChartGridModule.SCHEMA>, options: ChartGridCardOptions) {
        const curColor = this.getBubbleColorByDifficulty(element, options.chart);
        const scorePartWidth = element.bubble.margin * (3 / 2) + options.height * 2;
        const noteCountTexts = Object.entries(options.chart.notes)
            .filter(([_k, v]) => !!v)
            .map(([k, v]) => `${capitalize(k)}: ${v}`);
        const noteCountTextSize = (() => {
            let base = (options.height - element.bubble.margin * 4) / noteCountTexts.length;
            for (
                ;
                base > 4 && noteCountTexts.map((v) => measureText(ctx, v, base, Infinity)).find((v) => v.width > options.width - scorePartWidth);
                base--
            ) {}
            return base;
        })();
        const noteCountTextWidth = noteCountTexts
            .map((v) => measureText(ctx, v, noteCountTextSize, Infinity))
            .reduce((a, b) => (a.width > b.width ? a : b)).width;
        let noteCountLength = 0;
        noteCountTexts.forEach((v, i) => {
            drawText(
                ctx,
                v,
                element.bubble.margin * (3 / 2) + options.height * 2,
                element.bubble.margin + noteCountTextSize + (noteCountTextSize + (element.bubble.margin * 2) / (noteCountTexts.length - 1)) * i,
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
        return { noteCountLength, noteCountTextWidth, noteCountTextSize };
    }
    private async drawVersion(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ChartGridModule.SCHEMA>,
        options: ChartGridCardOptions,
        noteCountTextWidth: number,
    ) {
        const scorePartWidth = element.bubble.margin * (3 / 2) + options.height * 2;
        const version =
            options.chart.difficulty === Difficulty.LUNATIC
                ? options.chart.optionalData.presences.find((v) => v.type === "existence" && v.version.region === options.targetRegion)?.version
                : options.chart.optionalData.version.displayVersion[options.targetRegion];
        const versionImageHeight = (options.height - element.bubble.margin * 2) * (options.isShort ? 5 / 8 : 1 / 2);
        const versionImageWidth = (versionImageHeight / 270) * 360;
        const curx = options.width - element.bubble.margin,
            cury = element.bubble.margin;
        if (version && scorePartWidth + noteCountTextWidth + versionImageWidth < options.width) {
            const rawVersion = findVersion(version.gameVersion.major, version.gameVersion.minor, options.targetRegion);
            if (rawVersion) {
                const versionImage = theme.getFile(element.sprites.versions[options.targetRegion][rawVersion]);
                try {
                    sharp(versionImage);
                    if (versionImage) {
                        const versionImg = await safeLoadImage(versionImage);
                        ctx.drawImage(versionImg, curx - versionImageWidth, cury, versionImageWidth, versionImageHeight);
                    }
                } catch {}
            }
        }
    }
    private async drawInternalLevelTrend(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ChartGridModule.SCHEMA>,
        options: ChartGridCardOptions,
        noteCountLength: number,
        noteCountTextSize: number,
    ) {
        if (options.isShort) return;
        const curColor = this.getBubbleColorByDifficulty(element, options.chart);
        const versionImageHeight = (options.height - element.bubble.margin * 2) * (1 / 2);
        const versionImageWidth = (versionImageHeight / 270) * 360;
        const CurrentVer = JPN_LATEST;

        const maxWidth = options.width - options.height * 2 - element.bubble.margin * 4 - noteCountLength - versionImageWidth;
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
            trendEvents.length > 0 &&
            trendEvents[trendEvents.length - 1]?.version.gameVersion.major * 100 + trendEvents[trendEvents.length - 1]?.version.gameVersion.minor <
                CurrentVer &&
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
                            findNewerVersion(tmpEvent.version.gameVersion.major, tmpEvent.version.gameVersion.minor, options.targetRegion) ??
                            JPN_LATEST,
                    },
                    region: options.targetRegion,
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
        if (actualEvents.length <= 0) return;
        let positionAdjustment = 0;
        let addGap = (maxWidth - actualEvents.length * versionImageWidth) / (actualEvents.length - 1);
        if (addGap > maxWidth / 5) {
            addGap = maxWidth / 5;
            positionAdjustment = (maxWidth - (addGap * (actualEvents.length - 1) + versionImageWidth * actualEvents.length)) / 2;
        }
        for (
            let i = 0,
                curx = positionAdjustment + options.height * 2 + element.bubble.margin * (5 / 2) + noteCountLength,
                cury = element.bubble.margin + versionImageHeight * (1 / 2);
            i < actualEvents.length;
            ++i
        ) {
            const event = actualEvents[i];
            if (!event) continue;
            const rawVersion = findVersion(event.version.gameVersion.major, event.version.gameVersion.minor, options.targetRegion);
            if (rawVersion != null) {
                const versionImage = theme.getFile(element.sprites.versions[options.targetRegion][rawVersion]);
                try {
                    if (!versionImage) throw "No versionImage";
                    sharp(versionImage);
                    const versionImg = await safeLoadImage(versionImage);
                    ctx.drawImage(versionImg, curx, cury, versionImageWidth, versionImageHeight);
                } catch {
                    const str = `${event.version.gameVersion.major}.${event.version.gameVersion.minor}`;
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
    private async drawFooter(
        ctx: CanvasRenderingContext2D,
        element: z.infer<typeof ChartGridModule.SCHEMA>,
        painterCtx: ChartGridModulePainterContext,
        options: ChartGridCardOptions,
    ) {
        const curColor = this.getBubbleColorByDifficulty(element, options.chart);
        const score = painterCtx.scores[options.chart.difficulty];
        ctx.fillStyle = new Color(curColor).lighten(0.4).hexa();
        ctx.beginPath();
        ctx.roundRect(0, options.height * 0.742, options.height * 2, options.height * (1 - 0.742), [
            0,
            (options.height * 0.806) / 7,
            0,
            (options.height * 0.806) / 7,
        ]);
        ctx.fill();
        ctx.save();
        ctx.clip();
        drawText(
            ctx,
            options.chart.designer || "-",
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
        ctx.restore();

        const maxPlatinumScore = getMaxPlatinumScore(options.chart);
        drawText(
            ctx,
            `${score ? `${score.platinumScore}/` : "MAX PT SCR: "}${maxPlatinumScore}`,
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
    }
    private async drawChartGridCard(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ChartGridModule.SCHEMA>,
        painterCtx: ChartGridModulePainterContext,
        options: ChartGridCardOptions,
    ) {
        const curColor = this.getBubbleColorByDifficulty(element, options.chart);
        const borderRadius = (options.height * 0.806) / 7;
        const cardDimensions = [0, 0, options.width, options.height, borderRadius] as const;
        return wrapBackground(
            ctx,
            new Color(curColor).lighten(0.4).hexa(),
            () =>
                wrapBorder(
                    ctx,
                    new Color(curColor).darken(0.3).hexa(),
                    element.bubble.margin / 4,
                    () =>
                        wrapClip(
                            ctx,
                            () =>
                                wrapBackground(
                                    ctx,
                                    curColor,
                                    () =>
                                        wrapClip(
                                            ctx,
                                            async () => {
                                                await this.drawDifficultyName(ctx, element, painterCtx, options);
                                                await this.drawScore(ctx, element, painterCtx, options);
                                                await this.drawLamp(ctx, theme, element, painterCtx, options);
                                                const { noteCountLength, noteCountTextWidth, noteCountTextSize } = this.drawNoteCount(
                                                    ctx,
                                                    element,
                                                    options,
                                                );
                                                await this.drawVersion(ctx, theme, element, options, noteCountTextWidth);
                                                await this.drawInternalLevelTrend(ctx, theme, element, options, noteCountLength, noteCountTextSize);
                                                await this.drawFooter(ctx, element, painterCtx, options);
                                            },
                                            0,
                                            0,
                                            options.width,
                                            options.height,
                                        ),
                                    ...cardDimensions,
                                ),
                            ...cardDimensions,
                        ),
                    ...cardDimensions,
                ),
            ...cardDimensions,
        );
    }
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<{ width: number; height: number }>,
        element: z.infer<typeof ChartGridModule.SCHEMA>,
        painterCtx: ChartGridModulePainterContext,
    ) {
        const backgroundBorderRadius = Math.min(theme.content.width, theme.content.height) * (3 / 128);
        const targetRegion = painterCtx.region ?? "JPN";

        return wrapTranslate(ctx, element.x, element.y, async () =>
            wrapBorder(
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
                            const isLong = Object.values(difficulties).length > 4;
                            let y = element.margin;
                            for (const [difficulty, chart] of Object.entries(difficulties)) {
                                if (!chart) continue;
                                if (isLong && difficulty === Difficulty.BASIC) {
                                    await wrapTranslate(ctx, element.margin, y, async () => {
                                        await this.drawChartGridCard(ctx, theme, element, painterCtx, {
                                            chart,
                                            width: (cardWidth - element.margin) / 2,
                                            height: cardHeight,
                                            isShort: true,
                                            targetRegion,
                                        });
                                        const chartAdv = difficulties[Difficulty.ADVANCED];
                                        if (chartAdv) {
                                            await wrapTranslate(ctx, (cardWidth + element.margin) / 2, 0, () =>
                                                this.drawChartGridCard(ctx, theme, element, painterCtx, {
                                                    chart: chartAdv,
                                                    width: (cardWidth - element.margin) / 2,
                                                    height: cardHeight,
                                                    isShort: true,
                                                    targetRegion,
                                                }),
                                            );
                                        }
                                    });
                                    y += cardHeight + element.gap;
                                } else if (!isLong || difficulty !== Difficulty.ADVANCED) {
                                    await wrapTranslate(ctx, element.margin, y, () =>
                                        this.drawChartGridCard(ctx, theme, element, painterCtx, {
                                            chart,
                                            width: cardWidth,
                                            height: cardHeight,
                                            isShort: false,
                                            targetRegion,
                                        }),
                                    );
                                    y += cardHeight + element.gap;
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
            ),
        );
    }
}
