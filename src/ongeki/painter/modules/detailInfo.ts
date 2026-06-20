import { PainterModule } from "@common/painter/painter";
import { type Theme, ThemeManager } from "@common/painter/theme";
import { wrapBackground, wrapBorder, wrapClip, wrapTranslate } from "@common/utils/ctxWrapper";
import { getBpmRange } from "@common/utils/getBpmRange";
import { safeLoadImage } from "@common/utils/loadImage";
import { drawEmojiOrGlyph } from "@common/utils/textDraw/drawEmojiOrGlyphs";
import { drawText } from "@common/utils/textDraw/drawText";
import { color } from "@common/utils/zod";
import type { CanvasRenderingContext2D } from "canvas";
import Color from "color";
import { type Database, Difficulty } from "gcm-database/ongeki";
import type { Chart, Regions } from "gcm-database-local/ongeki";
import z from "zod/v4";
import { getNumberVersion, JPN_LATEST } from "../../lib/version";

export interface DetailInfoModulePainterContext {
    chartIdentifier: string;
    region?: Regions;
}

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
    private async drawJacket(
        ctx: CanvasRenderingContext2D,
        element: z.infer<typeof DetailInfoModule.SCHEMA>,
        painterCtx: DetailInfoModulePainterContext,
        backgroundBorderRadius: number,
    ) {
        const { data: jacket } = await this.database.getJacket(painterCtx.chartIdentifier);
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
    }
    private async drawDetail(
        ctx: CanvasRenderingContext2D,
        element: z.infer<typeof DetailInfoModule.SCHEMA>,
        painterCtx: DetailInfoModulePainterContext,
    ) {
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
        if (!chart) return;

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

        drawText(
            ctx,
            `#${chart.identifier} BPM: ${getBpmRange(chart.bpm)}`,
            textMargin,
            jacketMargin + textMargin * (1 / 2) + (element.width - jacketMargin * 2) + textSizeTitle * 3,
            textSizeSecondary,
            textLineWidth,
            {
                maxWidth: element.width - textMargin * 2,
                textAlign: "left",
                mainColor: "white",
                borderColor: textColor,
            },
        );

        const region = painterCtx.region ?? "JPN";
        const EventJpn = chart.optionalData.presences
            .filter((v) => v.version.region === region && getNumberVersion(v.version.gameVersion.major, v.version.gameVersion.minor) >= JPN_LATEST)
            .map((v) => v.type);
        const ExistJpn = EventJpn.includes("existence") && !EventJpn.includes("removal") ? "🇯🇵" : "";
        const title = [];
        if (ExistJpn) title.push(ExistJpn);
        await drawEmojiOrGlyph(
            ctx,
            title.join(" "),
            element.width - textMargin,
            jacketMargin + textMargin * (1 / 2) + (element.width - jacketMargin * 2) + textSizeTitle * 3,
            textSizeSecondary * (9 / 8),
            {
                maxWidth: element.width - textMargin * 2,
                textAlign: "right",
                mainColor: "white",
            },
        );
    }
    public async draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<{ width: number; height: number }>,
        element: z.infer<typeof DetailInfoModule.SCHEMA>,
        painterCtx: DetailInfoModulePainterContext,
    ) {
        const backgroundBorderRadius = Math.min(theme.content.width, theme.content.height) * (3 / 128);
        return wrapTranslate(ctx, element.x, element.y, async () =>
            wrapBorder(
                ctx,
                new Color(element.color.card).darken(0.5).hex(),
                backgroundBorderRadius / 4,
                () =>
                    wrapBackground(
                        ctx,
                        element.color.card,
                        async () => {
                            await this.drawJacket(ctx, element, painterCtx, backgroundBorderRadius);
                            await this.drawDetail(ctx, element, painterCtx);
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
