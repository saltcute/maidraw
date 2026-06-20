import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapTranslate } from "@common/utils/ctxWrapper";
import { safeLoadImage } from "@common/utils/loadImage";
import { drawText } from "@common/utils/textDraw/drawText";
import { measureText } from "@common/utils/textDraw/utils";
import { color } from "@common/utils/zod";
import type { CanvasRenderingContext2D } from "canvas";
import Color from "color";
import { type Database, Difficulty } from "gcm-database/ongeki";
import type { Chart } from "gcm-database-local/ongeki";
import z from "zod/v4";

export interface CharacterInfoModulePainterContext {
    chartIdentifier: string;
}

export class CharacterInfoModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("character-info"),
        width: z.number().min(1),
        height: z.number().min(1),
        margin: z.number().min(0),
        color: z.object({
            card: color(),
        }),
    });
    constructor(private database: Database<Chart>) {
        super();
    }
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<{ width: number; height: number }>,
        element: z.infer<typeof CharacterInfoModule.SCHEMA>,
        painterCtx: CharacterInfoModulePainterContext,
    ) {
        const jacketMargin = element.margin;
        const backgroundBorderRadius = Math.min(theme.content.width, theme.content.height) * (3 / 128);

        let chart: Chart | null = null;
        for (const difficulty of Object.values(Difficulty)) {
            const { data } = await this.database.getChart(painterCtx.chartIdentifier, difficulty);
            if (data) {
                chart = data;
                break;
            }
        }
        const boss = chart?.boss;
        const { data: characterImg } = chart ? await this.database.getBossCard(chart) : { data: undefined };

        return wrapTranslate(ctx, element.x, element.y, async () =>
            wrapBorder(
                ctx,
                new Color(element.color.card).darken(0.6).hex(),
                backgroundBorderRadius / 4,
                () =>
                    wrapBackground(
                        ctx,
                        element.color.card,
                        async () => {
                            ctx.save();
                            ctx.beginPath();
                            ctx.rect(0, 0, element.width, element.height);
                            ctx.clip();

                            const characterImgRatio = 768 / 1052;
                            const characterBorderRadius = backgroundBorderRadius / 2;
                            const characterImgHeight = element.height - jacketMargin * 2;
                            const characterImgWidth = characterImgHeight * characterImgRatio;
                            const cardCenterOffset = (element.width - characterImgWidth) / 2;
                            if (characterImg) {
                                const characterImage = await safeLoadImage(characterImg);
                                ctx.beginPath();
                                ctx.roundRect(
                                    cardCenterOffset,
                                    jacketMargin * 2 + characterImgHeight * (30 / 100),
                                    characterImgWidth,
                                    characterImgHeight * (70 / 100),
                                    [characterImgWidth / 2, characterImgWidth / 2, 0, 0],
                                );
                                ctx.fillStyle = new Color(element.color.card).lighten(0.1).hex();
                                ctx.fill();

                                ctx.beginPath();
                                ctx.roundRect(cardCenterOffset, jacketMargin * 2, characterImgWidth, characterImgHeight, [
                                    characterBorderRadius,
                                    characterBorderRadius,
                                    0,
                                    0,
                                ]);
                                ctx.save();
                                ctx.clip();
                                ctx.drawImage(characterImage, cardCenterOffset, jacketMargin * 2, characterImgWidth, characterImgHeight);
                                ctx.restore();
                            }

                            const textSizeTitle = jacketMargin;
                            const textLineWidth = element.width * (7 / 512);
                            const textColor = new Color(element.color.card).darken(0.5).hex();
                            if (boss) {
                                const characterNameMetrics = measureText(ctx, `Lv.${boss.level} ${boss.character.name}`, textSizeTitle, Infinity);
                                const characterNameActualHeight = Math.abs(
                                    characterNameMetrics.actualBoundingBoxAscent - characterNameMetrics.actualBoundingBoxDescent,
                                );
                                drawText(
                                    ctx,
                                    `Lv.${boss.level} ${boss.character.name}`,
                                    cardCenterOffset + characterImgWidth / 2,
                                    jacketMargin + characterNameActualHeight,
                                    textSizeTitle,
                                    textLineWidth,
                                    {
                                        textAlign: "center",
                                        mainColor: "white",
                                        borderColor: textColor,
                                    },
                                );
                            }
                            ctx.restore();
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
