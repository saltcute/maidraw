import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { safeLoadImage } from "@common/utils/loadImage";
import { truncate } from "@common/utils/number";
import { drawText } from "@common/utils/textDraw/drawText";
import { measureText } from "@common/utils/textDraw/utils";
import { color } from "@common/utils/zod";
import type { CanvasRenderingContext2D } from "canvas";
import Color from "color";
import { type Chart, type Database, Difficulty } from "gcm-database/ongeki";
import z from "zod/v4";
import { AchievementTypes, BellLamp, ComboLamp, type Score } from "../../lib/types";
import { getMaxPlatinumScore, getStar } from "../../lib/util";

export interface ScoreGridModulePainterContext {
    scores: Record<z.infer<typeof ScoreGridModule.SCHEMA.shape.region>, Score[]>;
    type: "refresh" | "classic";
}

export class ScoreGridModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("score-grid"),
        horizontalSize: z.number().min(1),
        verticalSize: z.number().min(1),
        region: z.enum(["recent", "new", "old"]),
        index: z.number().min(0),
        scoreBubble: z.object({
            width: z.number().min(1),
            height: z.number().min(1),
            margin: z.number().min(0),
            gap: z.union([
                z.number().min(0),
                z.object({
                    x: z.number().min(0),
                    y: z.number().min(0),
                }),
            ]),
            color: z.object({
                basic: color(),
                advanced: color(),
                expert: color(),
                master: color(),
                lunatic: color(),
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
        }),
    });
    constructor(private database: Database<Chart>) {
        super();
    }

    private getBubbleColorByDifficulty(element: z.infer<typeof ScoreGridModule.SCHEMA>, chart: Chart) {
        const colorMap = {
            [Difficulty.BASIC]: element.scoreBubble.color.basic,
            [Difficulty.ADVANCED]: element.scoreBubble.color.advanced,
            [Difficulty.EXPERT]: element.scoreBubble.color.expert,
            [Difficulty.MASTER]: element.scoreBubble.color.master,
            [Difficulty.LUNATIC]: element.scoreBubble.color.lunatic,
        } as const;
        return colorMap[chart.difficulty];
    }
    private getAchievementRankImagePath(element: z.infer<typeof ScoreGridModule.SCHEMA>, score: Score) {
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
    private getComboImagePath(element: z.infer<typeof ScoreGridModule.SCHEMA>, score: Score) {
        const map = {
            [ComboLamp.NONE]: element.sprites.milestone.none,
            [ComboLamp.FULL_COMBO]: element.sprites.milestone.fc,
            [ComboLamp.ALL_BREAK]: element.sprites.milestone.ab,
            [ComboLamp.ALL_BREAK_PLUS]: element.sprites.milestone.abp,
        } as const;
        return map[score.combo];
    }
    private getBellImagePath(element: z.infer<typeof ScoreGridModule.SCHEMA>, score: Score) {
        const map = {
            [BellLamp.NONE]: element.sprites.milestone.none,
            [BellLamp.FULL_BELL]: element.sprites.milestone.fb,
        } as const;
        return map[score.bell];
    }
    private async drawCard(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ScoreGridModule.SCHEMA>,
        score: Score,
        index: number,
        x: number,
        y: number,
        region: z.infer<typeof ScoreGridModule.SCHEMA.shape.region>,
        type: "refresh" | "classic",
    ) {
        const curColor = this.getBubbleColorByDifficulty(element, score.chart);
        const maxPlatinumScore = getMaxPlatinumScore(score.chart);

        /** Begin Card Draw */
        ctx.save();
        ctx.fillStyle = new Color(curColor).lighten(0.4).hexa();
        ctx.beginPath();
        ctx.roundRect(x, y, element.scoreBubble.width, element.scoreBubble.height, (element.scoreBubble.height * 0.806) / 7);
        ctx.strokeStyle = new Color(curColor).darken(0.3).hexa();
        ctx.lineWidth = element.scoreBubble.margin / 4;
        ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(x, y, element.scoreBubble.width, element.scoreBubble.height, (element.scoreBubble.height * 0.806) / 7);
        ctx.clip();

        const isRefreshRecent = region === "recent" && type === "refresh";

        /** Begin Main Content Draw */
        {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, element.scoreBubble.width, element.scoreBubble.height * 0.742, (element.scoreBubble.height * 0.806) / 7);
            ctx.clip();
            ctx.fillStyle = curColor;
            ctx.fill();

            const jacketSize = Math.min(element.scoreBubble.width, element.scoreBubble.height * 0.742);

            const jacketMaskGrad = ctx.createLinearGradient(x + jacketSize / 2, y + jacketSize / 2, x + jacketSize, y + jacketSize / 2);
            jacketMaskGrad.addColorStop(0, new Color(curColor).alpha(0).hexa());
            jacketMaskGrad.addColorStop(0.25, new Color(curColor).alpha(0.2).hexa());
            jacketMaskGrad.addColorStop(1, new Color(curColor).alpha(1).hexa());
            const jacketMaskGradDark = ctx.createLinearGradient(x + jacketSize / 2, y + jacketSize / 2, x + jacketSize, y + jacketSize / 2);
            jacketMaskGradDark.addColorStop(0, new Color(curColor).darken(0.3).alpha(0).hexa());
            jacketMaskGradDark.addColorStop(0.25, new Color(curColor).darken(0.3).alpha(0.2).hexa());
            jacketMaskGradDark.addColorStop(1, new Color(curColor).darken(0.3).alpha(1).hexa());

            /** Begin Jacket Draw */
            let jacket: Buffer | undefined;
            const { data: databaseJacket, err } = await this.database.getJacket(score.chart.identifier);
            if (err === undefined) {
                jacket = databaseJacket;
            } else {
                const { data: dummyJacket, err } = await this.database.getJacket("0");
                if (err === undefined) jacket = dummyJacket;
            }
            if (jacket) {
                const img = await safeLoadImage(jacket);
                ctx.drawImage(img, x, y, jacketSize, jacketSize);
            } else {
                ctx.fillStyle = "#b6ffab";
                ctx.fillRect(x, y, jacketSize, jacketSize);
            }
            /** End Jacket Draw */

            /** Begin Jacket Gradient Mask Draw */
            if (!isRefreshRecent) {
                ctx.fillStyle = jacketMaskGrad;
                ctx.fillRect(x + jacketSize / 2, y, (jacketSize * 3) / 4, jacketSize);
            }
            /** End Jacket Gradient Mask Draw */

            /** Begin Title Draw */
            const titleTextSize = element.scoreBubble.height * 0.806 * 0.144;
            if (!isRefreshRecent) {
                drawText(
                    ctx,
                    score.chart.title,
                    x + (jacketSize * 7) / 8,
                    y + element.scoreBubble.margin + titleTextSize,
                    titleTextSize,
                    element.scoreBubble.height * 0.806 * 0.04,
                    {
                        maxWidth: element.scoreBubble.width - (jacketSize * 7) / 8 - element.scoreBubble.margin,
                        textAlign: "left",
                        mainColor: "white",
                        borderColor: jacketMaskGradDark,
                        widthConstraintType: "shrink-cut",
                        shrinkMinFontSize: titleTextSize * 0.85,
                    },
                );
            } else {
                drawText(
                    ctx,
                    score.chart.title,
                    x + element.scoreBubble.width / 2,
                    y + element.scoreBubble.margin + titleTextSize,
                    titleTextSize,
                    element.scoreBubble.height * 0.806 * 0.04,
                    {
                        maxWidth: element.scoreBubble.width - element.scoreBubble.margin * 2,
                        textAlign: "center",
                        mainColor: "white",
                        borderColor: curColor,
                        widthConstraintType: "shrink-cut",
                        shrinkAnchor: "center",
                        shrinkMinFontSize: titleTextSize * 0.7,
                    },
                );
            }
            /** End Title Draw */

            /** Begin Separation Line Draw */
            if (!isRefreshRecent) {
                ctx.beginPath();
                ctx.roundRect(
                    x + (jacketSize * 13) / 16,
                    y + element.scoreBubble.margin + element.scoreBubble.height * 0.806 * (0.144 + 0.072),
                    element.scoreBubble.width - (jacketSize * 13) / 16 - element.scoreBubble.margin,
                    element.scoreBubble.height * 0.806 * 0.02,
                    (element.scoreBubble.height * 0.806 * 0.02) / 2,
                );
                ctx.fillStyle = jacketMaskGradDark;
                ctx.fill();
            }
            /** End Separation Line Draw */

            /** Begin Achievement Rate Draw */
            if (!isRefreshRecent) {
                drawText(
                    ctx,
                    truncate(score.score, 0),
                    x - element.scoreBubble.margin - element.scoreBubble.height * 0.806 * 0.02 + element.scoreBubble.width,
                    y + element.scoreBubble.margin + element.scoreBubble.height * 0.806 * (0.144 + 0.144 + 0.208 - 0.04),
                    element.scoreBubble.height * 0.806 * 0.208,
                    element.scoreBubble.height * 0.806 * 0.04,
                    {
                        textAlign: "right",
                        mainColor: "white",
                        borderColor: new Color(curColor).darken(0.3).hexa(),
                    },
                );
            }
            /** End Achievement Rate Draw */

            /** Begin Achievement Rank Draw */
            if (!isRefreshRecent) {
                const img = await safeLoadImage(theme.getFile(this.getAchievementRankImagePath(element, score)));
                ctx.drawImage(
                    img,
                    x + jacketSize * (31 / 32),
                    y + element.scoreBubble.margin + element.scoreBubble.height * 0.835 * 0.22,
                    element.scoreBubble.height * 0.835 * 0.24 * 2,
                    element.scoreBubble.height * 0.835 * 0.24,
                );
            }
            /** End Achievement Rank Draw */

            /** Begin Milestone Draw */
            if (!isRefreshRecent) {
                const comboWidth = element.scoreBubble.height * 0.806 * 0.24 * 3;
                const comboBackground = comboWidth * 0.9;
                const comboBgRatio = 64 / 272;
                const sizeDiff = comboWidth - comboBackground;
                ctx.beginPath();
                ctx.fillStyle = "#e8eaec";
                ctx.roundRect(
                    x + sizeDiff / 2 + element.scoreBubble.width - element.scoreBubble.margin - comboWidth,
                    y + jacketSize - (sizeDiff / 2) * comboBgRatio - element.scoreBubble.margin - comboWidth * comboBgRatio,
                    comboBackground,
                    comboBackground * comboBgRatio,
                    (comboBackground * comboBgRatio) / 2,
                );
                ctx.fill();

                ctx.roundRect(
                    x + sizeDiff / 2 + element.scoreBubble.width - 1.5 * element.scoreBubble.margin - 2 * comboWidth,
                    y + jacketSize - (sizeDiff / 2) * comboBgRatio - element.scoreBubble.margin - comboWidth * comboBgRatio,
                    comboBackground,
                    comboBackground * comboBgRatio,
                    (comboBackground * comboBgRatio) / 2,
                );
                ctx.fill();
                const combo = await safeLoadImage(theme.getFile(this.getComboImagePath(element, score)));
                const bell = await safeLoadImage(theme.getFile(this.getBellImagePath(element, score)));

                ctx.drawImage(
                    bell,
                    x + element.scoreBubble.width - element.scoreBubble.margin - comboWidth,
                    y + jacketSize - element.scoreBubble.margin - comboWidth * (84 / 290),
                    comboWidth,
                    comboWidth * (84 / 290),
                );
                ctx.drawImage(
                    combo,
                    x + element.scoreBubble.width - 1.5 * element.scoreBubble.margin - 2 * comboWidth,
                    y + jacketSize - element.scoreBubble.margin - comboWidth * (84 / 290),
                    comboWidth,
                    comboWidth * (84 / 290),
                );
            }
            /** End Milestone Draw */

            /** Begin Bests Index Draw */
            {
                const margin = isRefreshRecent ? element.scoreBubble.margin * 1.5 : element.scoreBubble.margin * 2;
                drawText(
                    ctx,
                    `#${index + 1}`,
                    x + margin,
                    y + jacketSize - margin,
                    element.scoreBubble.height * 0.806 * 0.128,
                    element.scoreBubble.height * 0.806 * 0.04,
                    {
                        textAlign: "left",
                        mainColor: "white",
                        borderColor: new Color(curColor).darken(0.3).hexa(),
                    },
                );

                if (isRefreshRecent) {
                    const platRatio = maxPlatinumScore ? score.platinumScore / maxPlatinumScore : 0;
                    const content = `★${getStar(platRatio)}`;
                    const fontSize = element.scoreBubble.height * 0.806 * 0.128;
                    const mesaure = measureText(ctx, content, fontSize, Infinity);
                    const width = mesaure.actualBoundingBoxLeft + mesaure.actualBoundingBoxRight;
                    const height = mesaure.actualBoundingBoxAscent + mesaure.actualBoundingBoxDescent;
                    const star6Grad = ctx.createLinearGradient(
                        x + element.scoreBubble.width - margin - width,
                        y + jacketSize - margin - height / 2,
                        x + element.scoreBubble.width - margin,
                        y + jacketSize - margin - height / 2,
                    );
                    ["#e81416", "#ffa500", "#faeb36", "#79c314", "#487de7", "#4b369d", "#70369d"].forEach((v, i, arr) => {
                        star6Grad.addColorStop(i / (arr.length - 1), v);
                    });
                    drawText(
                        ctx,
                        content,
                        x + element.scoreBubble.width - margin,
                        y + jacketSize - margin,
                        fontSize,
                        element.scoreBubble.height * 0.806 * 0.04,
                        {
                            textAlign: "right",
                            mainColor: "white",
                            borderColor: platRatio >= 0.99 ? star6Grad : new Color(curColor).darken(0.3).hexa(),
                        },
                    );
                }
            }
            /** End Bests Index Draw */

            ctx.restore();
        }
        /** End Main Content Draw */

        /** Begin Difficulty & Rating Draw */
        {
            const internalLevel = score.chart.internalLevel ? truncate(score.chart.internalLevel, 1) : score.chart.level;
            const leftContent = isRefreshRecent ? `${internalLevel}` : `${internalLevel}  ↑${truncate(score.rating, type === "refresh" ? 3 : 2)}`;
            const rightContent = (() => {
                if (isRefreshRecent) {
                    return `+${truncate(score.starRating, 3)}`;
                }
                if (score.platinumScore && maxPlatinumScore) {
                    return `${score.platinumScore}/${maxPlatinumScore}`;
                }
            })();
            const margin = isRefreshRecent ? element.scoreBubble.margin * 1.5 : element.scoreBubble.margin * 2;
            drawText(
                ctx,
                leftContent,
                x + margin,
                y + element.scoreBubble.height * (0.806 + (1 - 0.806) / 2),
                element.scoreBubble.height * 0.806 * 0.128,
                element.scoreBubble.height * 0.806 * 0.04,
                {
                    textAlign: "left",
                    mainColor: "white",
                    borderColor: new Color(curColor).darken(0.3).hexa(),
                },
            );
            if (rightContent) {
                drawText(
                    ctx,
                    rightContent,
                    x + element.scoreBubble.width - margin,
                    y + element.scoreBubble.height * (0.806 + (1 - 0.806) / 2),
                    element.scoreBubble.height * 0.806 * 0.128,
                    element.scoreBubble.height * 0.806 * 0.04,
                    {
                        textAlign: "right",
                        mainColor: "white",
                        borderColor: new Color(curColor).darken(0.3).hexa(),
                    },
                );
            }
        }
        /** End Difficulty & Rating Draw */

        ctx.restore();
        /** End Card Draw */
    }
    private drawOutline(ctx: CanvasRenderingContext2D, element: z.infer<typeof ScoreGridModule.SCHEMA>, x: number, y: number) {
        ctx.save();

        const RoundCornorRadius = (element.scoreBubble.height * 0.806) / 7;
        ctx.beginPath();
        ctx.roundRect(x, y, element.scoreBubble.width, element.scoreBubble.height, RoundCornorRadius);

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
    }
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof ScoreGridModule.SCHEMA>,
        painterCtx: ScoreGridModulePainterContext,
    ): Promise<void> {
        const scores = painterCtx.scores[element.region];
        const gapx = typeof element.scoreBubble.gap === "number" ? element.scoreBubble.gap : element.scoreBubble.gap.x;
        const gapy = typeof element.scoreBubble.gap === "number" ? element.scoreBubble.gap : element.scoreBubble.gap.y;
        for (let y = element.y, index = element.index, i = 0; i < element.verticalSize; ++i, y += element.scoreBubble.height + gapy) {
            for (let x = element.x, j = 0; j < element.horizontalSize; ++j, ++index, x += element.scoreBubble.width + gapx) {
                const curScore = scores[index];
                if (curScore) {
                    await this.drawCard(ctx, theme, element, curScore, index, x, y, element.region, painterCtx.type);
                } else if (element.scoreBubble.strictScoreCount === 0 || index < element.scoreBubble.strictScoreCount) {
                    this.drawOutline(ctx, element, x, y);
                }
            }
        }
    }
}
