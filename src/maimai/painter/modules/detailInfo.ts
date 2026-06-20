import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapClip, wrapTranslate } from "@common/utils/ctxWrapper";
import { getBpmRange } from "@common/utils/getBpmRange";
import { safeLoadImage } from "@common/utils/loadImage";
import type { ExtendParameters } from "@common/utils/misc";
import { drawEmojiOrGlyph } from "@common/utils/textDraw/drawEmojiOrGlyphs";
import { drawText } from "@common/utils/textDraw/drawText";
import { measureText } from "@common/utils/textDraw/utils";
import { color } from "@common/utils/zod";
import { CN_LATEST, DX_LATEST, EX_LATEST, findMinorVersion } from "@maimai/lib/version";
import type { CanvasRenderingContext2D } from "canvas";
import Color from "color";
import { type Database, Difficulty, Type } from "gcm-database/maimai";
import type { Chart, Regions } from "gcm-database-local/maimai";
import z from "zod/v4";
import type { ChartPainter } from "../chart";

export type DetailInfoModulePainterContext = {
    chartIdentifier: string;
    region?: Regions;
};

export class DetailInfoModule extends PainterModule {
    public static readonly SCHEMA = ThemeManager.ELEMENT.extend({
        type: z.literal("detail-info"),
        width: z.number().min(1),
        height: z.number().min(1),
        margin: z.number().min(0),
        color: z.object({
            card: color(),
        }),
        sprites: z.object({
            mode: z.object({
                standard: z.string(),
                dx: z.string(),
            }),
        }),
    });

    constructor(private database: Database<Chart>) {
        super();
    }
    private drawJacket: ExtendParameters<typeof this.draw, [backgroundBorderRadius: number]> = async (
        ctx,
        _,
        element,
        painterCtx,
        backgroundBorderRadius,
    ) => {
        const { data: jacket } = await this.database.getJacket(painterCtx.chartIdentifier, painterCtx.region);

        const jacketMargin = element.margin;
        if (jacket) {
            const jacketBorderRadius = backgroundBorderRadius / 2;
            const jacketImage = await safeLoadImage(jacket);
            wrapClip(
                ctx,
                () => ctx.drawImage(jacketImage, jacketMargin, jacketMargin, element.width - jacketMargin * 2, element.width - jacketMargin * 2),
                jacketMargin,
                jacketMargin,
                element.width - jacketMargin * 2,
                element.width - jacketMargin * 2,
                jacketBorderRadius,
            );
        }
    };
    private drawDetail: typeof this.draw = async (ctx, theme, element, painterCtx) => {
        const textMargin = element.margin;
        const jacketMargin = element.margin;

        let chart: Chart | null = null;
        for (const difficulty of Object.values(Difficulty)) {
            const { data } = await this.database.getChart(painterCtx.chartIdentifier, difficulty);
            if (data) {
                chart = data;
                break;
            }
        }
        if (chart) {
            const textSizeTitle = element.width * (1 / 16);
            const textSizeSecondary = element.width * (1 / 24);
            const { actualBoundingBoxAscent: ascent, actualBoundingBoxDescent: decent } = measureText(ctx, chart.title, textSizeTitle, Infinity);
            const titleActualHeight = Math.abs(ascent - decent);
            const chartModeBadgeImg = theme.getFile(chart.type === Type.DELUXE ? element.sprites.mode.dx : element.sprites.mode.standard);
            const mode = await safeLoadImage(chartModeBadgeImg);
            const aspectRatio = (mode.width ?? 0) / (mode.height ?? 1) || 3;

            const textLineWidth = element.width * (7 / 512);
            const textColor = new Color(element.color.card).darken(0.5).hex();
            const textTitleMaxWidth = element.width - textMargin * 2 - textSizeTitle * aspectRatio;

            const titleMetrics = measureText(ctx, chart.title, textSizeTitle, textTitleMaxWidth);

            drawText(
                ctx,
                chart.title,
                textMargin,
                jacketMargin + textMargin * (1 / 2) + (element.width - jacketMargin * 2) + textSizeTitle,
                textSizeTitle,
                textLineWidth,
                {
                    maxWidth: textTitleMaxWidth,
                    textAlign: "left",
                    mainColor: "white",
                    borderColor: textColor,
                },
            );

            drawText(
                ctx,
                chart.artist,
                textMargin,
                jacketMargin + textMargin * (1 / 2) + (element.width - jacketMargin * 2) + textSizeTitle * 2,
                textSizeSecondary,
                textLineWidth,
                {
                    maxWidth: element.width - textMargin * 2,
                    textAlign: "left",
                    mainColor: "white",
                    borderColor: textColor,
                },
            );

            const detailText = `#${chart.identifier}　BPM: ${getBpmRange(chart.bpm)}`;
            const detailTextMeasure = ctx.measureText(detailText);
            const detailTextHeight = detailTextMeasure.actualBoundingBoxAscent + detailTextMeasure.actualBoundingBoxDescent;
            drawText(
                ctx,
                detailText,
                textMargin,
                jacketMargin + textMargin * (1 / 2) + (element.width - jacketMargin * 2) + textSizeTitle * 3,
                textSizeSecondary * 0.9,
                textLineWidth,
                {
                    maxWidth: element.width - textMargin * 2,
                    textAlign: "left",
                    mainColor: new Color("#fff").alpha(0.95).hexa(),
                    borderColor: new Color(element.color.card).darken(0.45).alpha(0.6).hexa(),
                },
            );

            const isUsaLocked = (() => {
                for (const event of chart.optionalData.presences) {
                    if (
                        event.version.region === "EX" &&
                        event.type === "usa_lock" &&
                        findMinorVersion(event.version.gameVersion.major, event.version.gameVersion.minor, "EX") === EX_LATEST
                    ) {
                        return true;
                    }
                }
                return false;
            })();
            const EventDx = chart.optionalData.presences
                .filter((v) => v.version.region === "DX" && v.version.gameVersion.minor >= DX_LATEST)
                .map((v) => v.type);
            const EventEx = chart.optionalData.presences
                .filter((v) => v.version.region === "EX" && v.version.gameVersion.minor >= EX_LATEST)
                .map((v) => v.type);
            const EventCn = chart.optionalData.presences
                .filter((v) => v.version.region === "CN" && v.version.gameVersion.minor >= CN_LATEST)
                .map((v) => v.type);
            const ExistDx = EventDx.includes("existence") && !EventDx.includes("removal") ? "🇯🇵" : "";
            const ExistEx = EventEx.includes("existence") && !EventEx.includes("removal") ? `🌏${isUsaLocked ? "" : "🇨🇦"}` : "";
            const ExistCn = EventCn.includes("existence") && !EventCn.includes("removal") ? "🇨🇳" : "";
            const title = [];
            if (ExistDx) title.push(ExistDx);
            if (ExistEx) title.push(ExistEx);
            if (ExistCn) title.push(ExistCn);
            await drawEmojiOrGlyph(
                ctx,
                title.join(" "),
                element.width - textMargin,
                jacketMargin + textMargin * (1 / 2) + (element.width - jacketMargin * 2) + textSizeTitle * 3 - detailTextHeight / 2,
                textSizeSecondary * (9 / 8),
                {
                    maxWidth: element.width - textMargin * 2,
                    textAlign: "right",
                    mainColor: "white",
                    textBaseline: "middle",
                },
            );

            /** Begin Chart Mode Draw */
            ctx.drawImage(
                mode,
                textMargin * (3 / 2) + titleMetrics.width,
                jacketMargin + textMargin * (1 / 2) + (element.width - jacketMargin * 2) - titleActualHeight / 2 + textSizeTitle / 2,
                textSizeTitle * aspectRatio,
                textSizeTitle,
            );
            /** End Chart Mode Draw */
        }
    };

    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<z.infer<typeof ChartPainter.THEME>>,
        element: z.infer<typeof DetailInfoModule.SCHEMA>,
        painterCtx: DetailInfoModulePainterContext,
    ) {
        const backgroundBorderRadius = Math.min(theme.content.width, theme.content.height) * (3 / 128);

        return wrapTranslate(ctx, element.x, element.y, async () =>
            wrapBorder(
                ctx,
                new Color(element.color.card).darken(0.5).hex(),
                backgroundBorderRadius / 4,
                () /** Card border */ =>
                    wrapBackground(
                        ctx,
                        element.color.card,
                        async () /** Card background */ => {
                            await this.drawJacket(ctx, theme, element, painterCtx, backgroundBorderRadius);
                            await this.drawDetail(ctx, theme, element, painterCtx);
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
