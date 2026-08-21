import type { ChartPainter } from "@maimai/painter/chart";
import type { ChartGridModule } from "@maimai/painter/modules/chartGrid";
import type { DetailInfoModule } from "@maimai/painter/modules/detailInfo";
import type { ProfileModule } from "@maimai/painter/modules/profile";
import { hitokoto, type ImageOptions, image, text } from "@theme-tools/common/elements";
import { maimaiDifficultyColors } from "@theme-tools/common/palette";
import type { ThemeContext } from "@theme-tools/lib/context";
import type { SpriteDirs } from "@theme-tools/lib/sprites";
import {
    type MaimaiAchievementKey,
    type MaimaiMilestoneKey,
    maimaiAchievements,
    maimaiBest50Versionless,
    maimaiDxRating,
    maimaiMilestones,
    maimaiModes,
} from "@theme-tools/maimai/sprites";
import type { z } from "zod/v4";

export type ChartTheme = z.input<typeof ChartPainter.THEME>;
type ChartGridElement = z.input<typeof ChartGridModule.SCHEMA>;
type DetailInfoElement = z.input<typeof DetailInfoModule.SCHEMA>;
type ProfileElement = z.input<typeof ProfileModule.SCHEMA>;

const chartVersionless = "themes/maimai/chart/versionless";

/**
 * Minor versions that have their own logo, per region. A chart is stamped with the logo of the newest
 * listed version that is not newer than the chart itself, so a region only lists the versions whose
 * artwork actually changed.
 *
 * The file name is the region's base number plus the minor version, so `DX` 25 is `225.webp`.
 */
const versionLogos = {
    // biome-ignore lint/style/useNamingConvention: region keys are fixed by the module schema
    OLD: { dir: `${chartVersionless}/logo/jp`, base: 100, minors: [0, 10, 20, 30, 40, 50, 60, 70, 80, 85, 90, 95, 99] },
    // biome-ignore lint/style/useNamingConvention: region keys are fixed by the module schema
    DX: { dir: `${chartVersionless}/logo/jp`, base: 200, minors: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65] },
    // biome-ignore lint/style/useNamingConvention: region keys are fixed by the module schema
    EX: { dir: `${chartVersionless}/logo/intl`, base: 200, minors: [10, 15] },
    // biome-ignore lint/style/useNamingConvention: region keys are fixed by the module schema
    CN: { dir: `${chartVersionless}/logo/cn`, base: 200, minors: [0, 10, 20, 30, 40, 50, 55] },
} as const;

function versionTable(ctx: ThemeContext, region: keyof typeof versionLogos): Record<string, string> {
    const { dir, base, minors } = versionLogos[region];
    return Object.fromEntries(minors.map((minor) => [`${minor}`, ctx.ref(`${dir}/${base + minor}.webp`)]));
}

function maimaiVersionSprites(ctx: ThemeContext): ChartGridElement["sprites"]["versions"] {
    return {
        // biome-ignore lint/style/useNamingConvention: region keys are fixed by the module schema
        OLD: versionTable(ctx, "OLD"),
        // biome-ignore lint/style/useNamingConvention: region keys are fixed by the module schema
        DX: versionTable(ctx, "DX"),
        // biome-ignore lint/style/useNamingConvention: region keys are fixed by the module schema
        EX: versionTable(ctx, "EX"),
        // biome-ignore lint/style/useNamingConvention: region keys are fixed by the module schema
        CN: versionTable(ctx, "CN"),
    };
}

export interface MaimaiChartOptions {
    name: string;
    displayName: string;
    borderColor: string;
    /**
     * Fill of the chart and detail cards.
     */
    cardColor: string;
    achievements: SpriteDirs<MaimaiAchievementKey>;
    milestones?: SpriteDirs<MaimaiMilestoneKey>;
}

function chartGrid(ctx: ThemeContext, options: MaimaiChartOptions): ChartGridElement {
    return {
        type: "chart-grid",
        x: 100,
        y: 262,
        width: 1645,
        height: 1045,
        margin: 70,
        gap: 40,
        bubble: { margin: 20, color: maimaiDifficultyColors },
        color: { card: options.cardColor },
        sprites: {
            achievement: maimaiAchievements(ctx, options.achievements),
            milestone: maimaiMilestones(ctx, options.milestones),
            versions: maimaiVersionSprites(ctx),
        },
    };
}

function detailInfo(ctx: ThemeContext, options: MaimaiChartOptions): DetailInfoElement {
    return {
        type: "detail-info",
        x: 1845,
        y: 562,
        width: 615,
        height: 745,
        margin: 40,
        color: { card: options.cardColor },
        sprites: { mode: maimaiModes(ctx, `${maimaiBest50Versionless}/mode/jp`) },
    };
}

function profile(ctx: ThemeContext): ProfileElement {
    return {
        type: "profile",
        x: 150,
        y: 40,
        height: 182,
        sprites: {
            dxRating: maimaiDxRating(ctx, `${maimaiBest50Versionless}/dxRating/jp`),
            dxRatingNumberMap: ctx.ref(`${maimaiBest50Versionless}/dxRating/numberMap.webp`),
            profile: {
                nameplate: ctx.ref(`${maimaiBest50Versionless}/nameplate.webp`),
                icon: ctx.ref(`${maimaiBest50Versionless}/icon.webp`),
            },
        },
    };
}

export function maimaiChart(ctx: ThemeContext, options: MaimaiChartOptions, images: ImageOptions[]): ChartTheme {
    const borderColor = options.borderColor;
    return {
        displayName: options.displayName,
        name: options.name,
        width: 2560,
        height: 1440,
        elements: [
            ...images.map((img) => image(ctx, img)),
            chartGrid(ctx, options),
            detailInfo(ctx, options),
            profile(ctx),
            text({
                size: 32,
                x: 2480,
                y: 1407,
                borderColor,
                align: "right",
                content: "Generated by saltbot | maimaidx.cab/discord | maimaidx.cab/invite",
            }),
            hitokoto(ctx, {
                size: 24,
                x: 80,
                y: 1403,
                borderColor,
                align: "left",
                width: 1000,
                linebreak: true,
                probability: 0.1,
                customLines: ["hitokoto/general.json", "hitokoto/support/maimaidx.json"],
            }),
            text({ size: 32, x: 2520, y: 72, borderColor, align: "right", content: "{dateTime}" }),
        ],
    };
}
