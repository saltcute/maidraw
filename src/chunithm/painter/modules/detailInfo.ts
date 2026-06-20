import { CHN_LATEST, getNumberVersion, INT_LATEST, JPN_LATEST } from "@chunithm/lib/version";
import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapClip, wrapTranslate } from "@common/utils/ctxWrapper";
import { getBpmRange } from "@common/utils/getBpmRange";
import { safeLoadImage } from "@common/utils/loadImage";
import type { ExtendParameters } from "@common/utils/misc";
import { drawEmojiOrGlyph } from "@common/utils/textDraw/drawEmojiOrGlyphs";
import { drawText } from "@common/utils/textDraw/drawText";
import { color } from "@common/utils/zod";
import type { CanvasRenderingContext2D } from "canvas";
import Color from "color";
import { type Database, Difficulty } from "gcm-database/chunithm";
import type { Chart, Regions } from "gcm-database-local/chunithm";
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
    private drawDetail: typeof this.draw = async (ctx, _, element, painterCtx) => {
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

            const textLineWidth = element.width * (7 / 512);
            const textColor = new Color(element.color.card).darken(0.5).hex();
            const textTitleMaxWidth = element.width - textMargin * 2;

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
            const EventJpn = chart.optionalData.presences
                .filter((v) => v.version.region === "JPN" && getNumberVersion(v.version.gameVersion.major, v.version.gameVersion.minor) >= JPN_LATEST)
                .map((v) => v.type);
            const EventInt = chart.optionalData.presences
                .filter((v) => v.version.region === "INT" && getNumberVersion(v.version.gameVersion.major, v.version.gameVersion.minor) >= INT_LATEST)
                .map((v) => v.type);
            const EventChn = chart.optionalData.presences
                .filter((v) => v.version.region === "CHN" && getNumberVersion(v.version.gameVersion.major, v.version.gameVersion.minor) >= CHN_LATEST)
                .map((v) => v.type);
            const ExistJpn = EventJpn.includes("existence") && !EventJpn.includes("removal") ? "🇯🇵" : "";
            const ExistInt = EventInt.includes("existence") && !EventInt.includes("removal") ? "🌏" : "";
            const ExistChn = EventChn.includes("existence") && !EventChn.includes("removal") ? "🇨🇳" : "";
            const title = [];
            if (ExistJpn) title.push(ExistJpn);
            if (ExistInt) title.push(ExistInt);
            if (ExistChn) title.push(ExistChn);
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
