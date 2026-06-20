import { AchievementTypes, ComboLamp, type Score } from "@chunithm/lib/types";
import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapClip, wrapTranslate } from "@common/utils/ctxWrapper";
import { safeLoadImage } from "@common/utils/loadImage";
import type { ExtendParameters, ReplaceReturnType } from "@common/utils/misc";
import { truncate } from "@common/utils/number";
import { drawText } from "@common/utils/textDraw/drawText";
import { color } from "@common/utils/zod";
import type { CanvasRenderingContext2D } from "canvas";
import Color from "color";
import { type Chart, type Database, Difficulty } from "gcm-database/chunithm";
import z from "zod/v4";

export interface ImageModulePainterContext {
    scores: Record<z.infer<typeof ScoreGridModule.SCHEMA.shape.region>, Score[]>;
}

export class ScoreGridModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("score-grid"),
        horizontalSize: z.number().min(1),
        verticalSize: z.number().min(1),
        region: z.enum(["new", "old"]),
        index: z.number().min(0),
        scoreBubble: z.object({
            width: z.number().min(1),
            height: z.number().min(1),
            margin: z.number().min(0),
            gap: z.number().min(0),
            color: z.object({
                basic: color(),
                advanced: color(),
                expert: color(),
                master: color(),
                ultima: color(),
                worldsEnd: color(),
            }),
            strictScoreCount: z.number().default(0),
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
                aj: z.string(),
                ajc: z.string(),
                fc: z.string(),
                none: z.string(),
            }),
        }),
    });
    constructor(private database: Database<Chart>) {
        super();
    }
    private getBubbleColorByDifficulty: ReplaceReturnType<ExtendParameters<typeof this.draw, [score: Score]>, string> = (
        _,
        __,
        element,
        ___,
        score,
    ) => {
        const colorMap = {
            [Difficulty.BASIC]: element.scoreBubble.color.basic,
            [Difficulty.ADVANCED]: element.scoreBubble.color.advanced,
            [Difficulty.EXPERT]: element.scoreBubble.color.expert,
            [Difficulty.MASTER]: element.scoreBubble.color.master,
            [Difficulty.ULTIMA]: element.scoreBubble.color.ultima,
            [Difficulty.WORLDS_END]: element.scoreBubble.color.worldsEnd,
        } as const;
        return colorMap[score.chart.difficulty];
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
        return map[score.rank];
    };
    private getComboLampImagePath: ReplaceReturnType<ExtendParameters<typeof this.draw, [score: Score]>, string> = (_, __, element, ___, score) => {
        const map = {
            [ComboLamp.NONE]: element.sprites.milestone.none,
            [ComboLamp.FULL_COMBO]: element.sprites.milestone.fc,
            [ComboLamp.ALL_JUSTICE]: element.sprites.milestone.aj,
            [ComboLamp.ALL_JUSTICE_CRITICAL]: element.sprites.milestone.ajc,
        } as const;
        return map[score.combo];
    };
    private getJacketSize: ReplaceReturnType<typeof this.draw, number> = (_, __, element) => {
        return Math.min(element.scoreBubble.width, element.scoreBubble.height * 0.742);
    };
    /**
     * Get a color representing freshness.
     *
     * @param status From 0 to 1, 0 means most fresh, 1 means most dead.
     * @returns
     */
    private getStatusColor(status: number) {
        // const FRESHNESS_COLOUR = "#94E436";
        // const DEAD_COLOUR = "#F54932";
        // const NEUTRAL_COLOUR = "#c2c2c2";

        return Color.hsv(87.59 * (1 - status), 76.32, 89.41);
    }
    private drawScaleIndicator: ExtendParameters<typeof this.draw, [score: Score]> = async (ctx, _, element, __, score) => {
        if (score.optionalData?.scale !== undefined) {
            const cardRoundCornerRadius = (element.scoreBubble.height * 0.806) / 7;
            return wrapBackground(
                ctx,
                this.getStatusColor(score.optionalData?.scale).hexa(),
                () => {},
                element.scoreBubble.width - cardRoundCornerRadius,
                cardRoundCornerRadius,
                cardRoundCornerRadius * 2,
                cardRoundCornerRadius * 2,
                cardRoundCornerRadius / 4,
            );
        }
    };
    private drawJacketAndTitle: ExtendParameters<typeof this.draw, [score: Score]> = async (ctx, _, element, painterCtx, score) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, _, element, painterCtx, score);
        const jacketSize = this.getJacketSize(ctx, _, element, painterCtx);

        const jacketMaskGrad = ctx.createLinearGradient(jacketSize / 2, jacketSize / 2, jacketSize, jacketSize / 2);
        jacketMaskGrad.addColorStop(0, new Color(curColor).alpha(0).hexa());
        jacketMaskGrad.addColorStop(0.25, new Color(curColor).alpha(0.2).hexa());
        jacketMaskGrad.addColorStop(1, new Color(curColor).alpha(1).hexa());
        const jacketMaskGradDark = ctx.createLinearGradient(jacketSize / 2, jacketSize / 2, jacketSize, jacketSize / 2);
        jacketMaskGradDark.addColorStop(0, new Color(curColor).darken(0.3).alpha(0).hexa());
        jacketMaskGradDark.addColorStop(0.25, new Color(curColor).darken(0.3).alpha(0.2).hexa());
        jacketMaskGradDark.addColorStop(1, new Color(curColor).darken(0.3).alpha(1).hexa());

        let jacket: Buffer | undefined;
        const { data: databaseJacket, err } = await this.database.getJacket(score.chart.identifier);
        if (err === undefined) {
            jacket = databaseJacket;
        } else {
            const { data: dummyJacket, err } = await this.database.getJacket("0");
            if (err === undefined) {
                jacket = dummyJacket;
            }
        }
        if (jacket) {
            const img = await safeLoadImage(jacket);
            ctx.drawImage(img, 0, 0, jacketSize, jacketSize);
        } else {
            ctx.fillStyle = "#b6ffab";
            ctx.fillRect(0, 0, jacketSize, jacketSize);
        }
        ctx.fillStyle = jacketMaskGrad;
        ctx.fillRect(jacketSize / 2, 0, (jacketSize * 3) / 4, jacketSize);

        const titleFontSize = element.scoreBubble.height * 0.806 * 0.144;
        drawText(
            ctx,
            score.chart.title,
            (jacketSize * 7) / 8,
            element.scoreBubble.margin + titleFontSize,
            titleFontSize,
            element.scoreBubble.height * 0.806 * 0.04,
            {
                maxWidth: element.scoreBubble.width - (jacketSize * 7) / 8 - element.scoreBubble.margin,
                textAlign: "left",
                mainColor: "white",
                borderColor: jacketMaskGradDark,
                widthConstraintType: "shrink-cut",
                shrinkMinFontSize: titleFontSize * 0.85,
            },
        );

        ctx.beginPath();
        ctx.roundRect(
            (jacketSize * 13) / 16,
            element.scoreBubble.margin + element.scoreBubble.height * 0.806 * (0.144 + 0.072),
            element.scoreBubble.width - (jacketSize * 13) / 16 - element.scoreBubble.margin,
            element.scoreBubble.height * 0.806 * 0.02,
            (element.scoreBubble.height * 0.806 * 0.02) / 2,
        );
        ctx.fillStyle = jacketMaskGradDark;
        ctx.fill();
    };
    private drawScore: ExtendParameters<typeof this.draw, [score: Score]> = async (ctx, _, element, painterCtx, score) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, _, element, painterCtx, score);
        drawText(
            ctx,
            truncate(score.score, 0),
            -element.scoreBubble.margin - element.scoreBubble.height * 0.806 * 0.02 + element.scoreBubble.width,
            element.scoreBubble.margin + element.scoreBubble.height * 0.806 * (0.144 + 0.144 + 0.208 - 0.04),
            element.scoreBubble.height * 0.806 * 0.208,
            element.scoreBubble.height * 0.806 * 0.04,
            {
                textAlign: "right",
                mainColor: "white",
                borderColor: new Color(curColor).darken(0.3).hexa(),
            },
        );
    };
    private drawRank: ExtendParameters<typeof this.draw, [score: Score]> = async (ctx, theme, element, painterCtx, score) => {
        const img = await safeLoadImage(theme.getFile(this.getAchievementRankImagePath(ctx, theme, element, painterCtx, score)));
        const { width, height } = img;
        const aspectRatio = width / height;
        const lampWidth = element.scoreBubble.height * 0.806 * 0.2;
        ctx.drawImage(
            img,
            this.getJacketSize(ctx, theme, element, painterCtx) * (13 / 16),
            element.scoreBubble.margin + element.scoreBubble.height * 0.806 * (0.144 + 0.144 - 0.01),
            lampWidth * aspectRatio,
            lampWidth,
        );
    };
    private drawLamp: ExtendParameters<typeof this.draw, [score: Score]> = async (ctx, theme, element, painterCtx, score) => {
        const lampAdjustmentX = element.scoreBubble.height * 0.806 * 0.02;
        const lampAdjustmentY = element.scoreBubble.height * 0.806 * (0.144 + 0.144 + 0.208 + 0.1);
        const lampWidth = element.scoreBubble.height * 0.806 * 0.32 * 3;
        const combo = await safeLoadImage(theme.getFile(this.getComboLampImagePath(ctx, theme, element, painterCtx, score)));
        const aspectRatio = 6.7;
        return wrapTranslate(
            ctx,
            element.scoreBubble.width - element.scoreBubble.margin - lampWidth - lampAdjustmentX,
            element.scoreBubble.margin + lampAdjustmentY,
            () =>
                wrapBackground(
                    ctx,
                    "#e8eaec",
                    async () => {
                        ctx.drawImage(combo, 0, 0, lampWidth, lampWidth / aspectRatio);
                    },
                    0,
                    0,
                    lampWidth,
                    lampWidth / aspectRatio,
                    lampWidth / 56,
                ),
        );
    };
    private drawChartIndex: ExtendParameters<typeof this.draw, [score: Score, index: number]> = async (
        ctx,
        theme,
        element,
        painterCtx,
        score,
        index,
    ) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, theme, element, painterCtx, score);
        const jacketSize = this.getJacketSize(ctx, theme, element, painterCtx);
        drawText(
            ctx,
            `#${index + 1}`,
            element.scoreBubble.margin * 2,
            jacketSize - element.scoreBubble.margin * 2,
            element.scoreBubble.height * 0.806 * 0.128,
            element.scoreBubble.height * 0.806 * 0.04,
            {
                textAlign: "left",
                mainColor: "white",
                borderColor: new Color(curColor).darken(0.3).hexa(),
            },
        );
    };
    private drawLevel: ExtendParameters<typeof this.draw, [score: Score]> = async (ctx, _, element, painterCtx, score) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, _, element, painterCtx, score);
        const internalLevel = score.chart.internalLevel ? truncate(score.chart.internalLevel, 1) : score.chart.level;
        drawText(
            ctx,
            `${internalLevel}`,
            element.scoreBubble.margin * 2,
            element.scoreBubble.height * (0.806 + (1 - 0.806) / 2),
            element.scoreBubble.height * 0.806 * 0.128,
            element.scoreBubble.height * 0.806 * 0.04,
            {
                textAlign: "left",
                mainColor: "white",
                borderColor: new Color(curColor).darken(0.3).hexa(),
            },
        );
    };
    private drawRating: ExtendParameters<typeof this.draw, [score: Score]> = async (ctx, _, element, painterCtx, score) => {
        const curColor = this.getBubbleColorByDifficulty(ctx, _, element, painterCtx, score);
        drawText(
            ctx,
            `+${truncate(score.rating, 2)}`,
            element.scoreBubble.width - element.scoreBubble.margin * 2,
            element.scoreBubble.height * (0.806 + (1 - 0.806) / 2),
            element.scoreBubble.height * 0.806 * 0.128,
            element.scoreBubble.height * 0.806 * 0.04,
            {
                textAlign: "right",
                mainColor: "white",
                borderColor: new Color(curColor).darken(0.3).hexa(),
            },
        );
    };
    private drawOutline: ReplaceReturnType<typeof this.draw, void> = (ctx, _, element) => {
        ctx.save();

        const RoundCornorRadius = (element.scoreBubble.height * 0.806) / 7;
        ctx.beginPath();
        ctx.roundRect(0, 0, element.scoreBubble.width, element.scoreBubble.height, RoundCornorRadius);

        const BaseColor = new Color("#949494");
        const Circumference = (element.scoreBubble.width + element.scoreBubble.height - RoundCornorRadius * 4) * 2 + RoundCornorRadius * 2 * Math.PI;
        const DashLength = Circumference / Math.round(Circumference / 25);
        ctx.fillStyle = BaseColor.lighten(0.3).alpha(0.5).hexa();
        ctx.fill();

        ctx.strokeStyle = BaseColor.hexa();
        ctx.setLineDash([DashLength * 0.56, DashLength * 0.44]);
        ctx.lineWidth = element.scoreBubble.margin / 4;
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    };
    private wrapCard: ExtendParameters<typeof this.draw, [callback: (index: number, score?: Score) => unknown]> = async (
        ctx,
        _,
        element,
        painterCtx,
        callback,
    ) => {
        return wrapTranslate(ctx, element.x, element.y, async () => {
            for (let j = 0, y = 0; j < element.verticalSize; ++j, y += element.scoreBubble.height + element.scoreBubble.gap) {
                for (let i = 0, x = 0; i < element.horizontalSize; ++i, x += element.scoreBubble.width + element.scoreBubble.gap) {
                    const index = j * element.horizontalSize + i;
                    const score = painterCtx.scores[element.region][index];
                    await wrapTranslate(ctx, x, y, async () => callback(index, score));
                }
            }
        });
    };
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ScoreGridModule.SCHEMA>,
        painterCtx: ImageModulePainterContext,
    ): Promise<void> {
        return this.wrapCard(ctx, theme, element, painterCtx, async (index, score) => {
            if (score) {
                const curColor = this.getBubbleColorByDifficulty(ctx, theme, element, painterCtx, score);
                const borderRadius = (element.scoreBubble.height * 0.806) / 7;
                return wrapBorder(
                    ctx,
                    new Color(curColor).darken(0.3).hexa(),
                    element.scoreBubble.margin / 4,
                    () =>
                        wrapBackground(
                            ctx,
                            new Color(curColor).lighten(0.4).hexa(),
                            () => {
                                return wrapClip(
                                    ctx,
                                    async () => {
                                        const jacketSize = this.getJacketSize(ctx, theme, element, painterCtx);
                                        await wrapClip(
                                            ctx,
                                            async () =>
                                                wrapBackground(
                                                    ctx,
                                                    curColor,
                                                    async () => {
                                                        await this.drawScaleIndicator(ctx, theme, element, painterCtx, score);

                                                        await this.drawJacketAndTitle(ctx, theme, element, painterCtx, score);

                                                        await this.drawScore(ctx, theme, element, painterCtx, score);

                                                        await this.drawRank(ctx, theme, element, painterCtx, score);

                                                        await this.drawLamp(ctx, theme, element, painterCtx, score);

                                                        await this.drawChartIndex(ctx, theme, element, painterCtx, score, index);
                                                    },
                                                    0,
                                                    0,
                                                    element.scoreBubble.width,
                                                    jacketSize,
                                                    borderRadius,
                                                ),
                                            0,
                                            0,
                                            element.scoreBubble.width,
                                            jacketSize,
                                            borderRadius,
                                        );

                                        await this.drawLevel(ctx, theme, element, painterCtx, score);

                                        await this.drawRating(ctx, theme, element, painterCtx, score);
                                    },
                                    0,
                                    0,
                                    element.scoreBubble.width,
                                    element.scoreBubble.height,
                                    borderRadius,
                                );
                            },
                            0,
                            0,
                            element.scoreBubble.width,
                            element.scoreBubble.height,
                            borderRadius,
                        ),
                    0,
                    0,
                    element.scoreBubble.width,
                    element.scoreBubble.height,
                    borderRadius,
                );
            } else {
                return this.drawOutline(ctx, theme, element, painterCtx);
            }
        });
    }
}
