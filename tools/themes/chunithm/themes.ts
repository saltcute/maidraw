import { BestPainter } from "@chunithm/painter/best";
import { ChartPainter } from "@chunithm/painter/chart";
import { type ChunithmBestOptions, chunithmBestNew, chunithmBestRecents } from "@theme-tools/chunithm/best";
import { type ChunithmChartOptions, chunithmChart } from "@theme-tools/chunithm/chart";
import { chunithmRatingNumberMaps } from "@theme-tools/chunithm/sprites";
import type { ImageOptions } from "@theme-tools/common/elements";
import { defineTheme, type ThemeSpec } from "@theme-tools/lib/spec";

const best = "themes/chunithm/best";
const chart = "themes/chunithm/chart";

function art(version: string) {
    return `${best}/${version}/assets`;
}

// ---------------------------------------------------------------------------------------------
// Best
// ---------------------------------------------------------------------------------------------

interface ChunithmBestVersion {
    dir: string;
    options: ChunithmBestOptions;
    new: ImageOptions[];
    recents: ImageOptions[];
}

const bestVersions: ChunithmBestVersion[] = [
    {
        dir: "luminous",
        options: {
            name: "jp-luminous-landscape",
            displayName: "CHUNITHM LUMINOUS, landscape",
            borderColor: "#d96c64",
            achievements: `${art("luminous")}/achievement`,
        },
        new: [
            { x: 0, y: -151, width: 2920, height: 1642, path: `${art("luminous")}/background.webp` },
            { x: 925, y: 40, width: 450, height: 228, path: `${art("luminous")}/logo.webp` },
        ],
        recents: [
            { x: -70, y: 0, width: 2560, height: 1440, path: `${art("luminous")}/background.webp` },
            { x: 925, y: 40, width: 450, height: 228, path: `${art("luminous")}/logo.webp` },
        ],
    },
    {
        dir: "luminousplus",
        options: {
            name: "jp-luminousplus-landscape",
            displayName: "CHUNITHM LUMINOUS PLUS, landscape",
            borderColor: "#d96c64",
            achievements: `${art("luminous")}/achievement`,
        },
        new: [
            { x: 0, y: -151, width: 2920, height: 1642, path: `${art("luminous")}/background.webp` },
            { x: 925, y: -8, width: 450, height: 323, path: `${art("luminousplus")}/logo.webp` },
        ],
        recents: [
            { x: -70, y: 0, width: 2560, height: 1440, path: `${art("luminous")}/background.webp` },
            { x: 925, y: -8, width: 450, height: 323, path: `${art("luminousplus")}/logo.webp` },
        ],
    },
    {
        dir: "mate",
        options: {
            name: "jp-mate-landscape",
            displayName: "CHUNITHM MATE, landscape",
            borderColor: "#d68324",
            achievements: `${art("mate")}/achievement`,
        },
        new: [
            { x: 0, y: -151, width: 2920, height: 1642, path: `${art("mate")}/background/new.webp` },
            { x: 1150, y: 155, align: "cm", width: 450, path: `${art("mate")}/logo.webp` },
        ],
        recents: [
            { x: -70, y: 0, width: 2560, height: 1440, path: `${art("mate")}/background/recents.webp` },
            { x: 1150, y: 155, align: "cm", width: 450, path: `${art("mate")}/logo.webp` },
        ],
    },
    {
        dir: "paradiselost",
        options: {
            name: "jp-paradiselost-landscape",
            displayName: "CHUNITHM PARADISE LOST",
            borderColor: "#178ea1",
            achievements: `${art("paradiselost")}/achievement`,
            // PARADISE LOST predates the plus ranks, so they fall back to the plain rank artwork.
            achievementFiles: { sp: "S", ssp: "SS", sssp: "SSS" },
            // It also has its own rating digits, except for the kiwami colour it never had.
            ratingNumberMap: { default: `${chunithmRatingNumberMaps}/plost`, kiwami: chunithmRatingNumberMaps },
        },
        new: [
            { x: 0, y: 0, width: 2920, height: 1340, path: `${art("paradiselost")}/background/new.webp` },
            { x: 925, y: 40, width: 450, path: `${art("paradiselost")}/logo.webp` },
        ],
        recents: [
            { x: 0, y: 0, width: 2320, height: 1440, path: `${art("paradiselost")}/background/recents.webp` },
            { x: 925, y: 40, width: 450, path: `${art("paradiselost")}/logo.webp` },
        ],
    },
    {
        dir: "verse",
        options: {
            name: "jp-verse-landscape",
            displayName: "CHUNITHM VERSE, landscape",
            borderColor: "#226180",
            achievements: `${art("verse")}/achievement`,
        },
        new: [
            { x: 0, y: -151, width: 2920, height: 1642, path: `${art("verse")}/background.webp` },
            { x: 925, y: -20, width: 450, height: 350, path: `${art("verse")}/logo.webp` },
        ],
        recents: [
            { x: -70, y: 0, width: 2560, height: 1440, path: `${art("verse")}/background.webp` },
            { x: 925, y: -20, width: 450, height: 350, path: `${art("verse")}/logo.webp` },
        ],
    },
    {
        dir: "xverse",
        options: {
            name: "jp-xverse-landscape",
            displayName: "CHUNITHM X-VERSE, landscape",
            borderColor: "#226180",
            achievements: `${art("verse")}/achievement`,
        },
        new: [
            { x: 0, y: 0, width: 2920, path: `${art("xverse")}/background/new.webp` },
            { x: 925, y: -20, width: 450, path: `${art("xverse")}/logo.webp` },
        ],
        recents: [
            { x: 0, y: 0, width: 2320, path: `${art("xverse")}/background/recents.webp` },
            { x: 925, y: 10, width: 450, path: `${art("xverse")}/logo.webp` },
        ],
    },
    {
        dir: "xversex",
        options: {
            name: "jp-xversex-landscape",
            displayName: "CHUNITHM X-VERSE-X, landscape",
            borderColor: "#226180",
            achievements: `${art("verse")}/achievement`,
        },
        new: [
            { x: 0, y: 0, width: 2920, path: `${art("xversex")}/background/new.webp` },
            { x: 925, y: 150, align: "lc", width: 450, path: `${art("xversex")}/logo.webp` },
        ],
        recents: [
            { x: 0, y: 0, width: 2320, path: `${art("xversex")}/background/recents.webp` },
            { x: 925, y: 50, width: 450, path: `${art("xversex")}/logo.webp` },
        ],
    },
];

export const chunithmBestThemes: ThemeSpec[] = bestVersions.flatMap((version) => [
    defineTheme({
        outDir: `${best}/${version.dir}/new`,
        schema: BestPainter.THEME,
        build: (ctx) => chunithmBestNew(ctx, version.options, version.new),
    }),
    defineTheme({
        outDir: `${best}/${version.dir}/recents`,
        schema: BestPainter.THEME,
        build: (ctx) => chunithmBestRecents(ctx, version.options, version.recents),
    }),
]);

// ---------------------------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------------------------

interface ChunithmChartVersion {
    dir: string;
    options: ChunithmChartOptions;
    images: ImageOptions[];
}

const chartVersions: ChunithmChartVersion[] = [
    {
        dir: "mate",
        options: {
            name: "jp-mate",
            displayName: "CHUNITHM Mate",
            borderColor: "#d68324",
            cardColor: "#ffd199",
            achievements: `${art("mate")}/achievement`,
        },
        images: [
            { x: 1280, y: 720, align: "cm", height: 1440, path: `${art("mate")}/background/new.webp` },
            { x: 2152, y: 262, align: "mt", height: 255, path: `${art("mate")}/logo.webp` },
        ],
    },
    {
        dir: "verse",
        options: {
            name: "jp-verse",
            displayName: "CHUNITHM VERSE",
            borderColor: "#226180",
            cardColor: "#b9eae5",
            achievements: `${art("verse")}/achievement`,
        },
        images: [
            { x: 0, y: 0, width: 2560, height: 1440, path: `${art("verse")}/background.webp` },
            { x: 1957, y: 262, width: 391, height: 305, path: `${art("verse")}/logo.webp` },
        ],
    },
    {
        dir: "xverse",
        options: {
            name: "jp-xverse",
            displayName: "CHUNITHM X-VERSE",
            borderColor: "#226180",
            cardColor: "#b8bbf2",
            achievements: `${art("verse")}/achievement`,
        },
        images: [
            { x: 1280, y: 720, align: "cm", height: 1440, path: `${art("xverse")}/background/new.webp` },
            { x: 2152, y: 262, align: "mt", height: 305, path: `${art("xverse")}/logo.webp` },
        ],
    },
    {
        dir: "xversex",
        options: {
            name: "jp-xversex",
            displayName: "CHUNITHM X-VERSE-X",
            borderColor: "#226180",
            cardColor: "#b8bbf2",
            achievements: `${art("verse")}/achievement`,
        },
        images: [
            { x: 1280, y: 720, align: "cm", height: 1440, path: `${art("xversex")}/background/new.webp` },
            { x: 2152, y: 262, align: "mt", height: 305, path: `${art("xversex")}/logo.webp` },
        ],
    },
];

export const chunithmChartThemes: ThemeSpec[] = chartVersions.map((version) =>
    defineTheme({
        outDir: `${chart}/${version.dir}`,
        schema: ChartPainter.THEME,
        build: (ctx) => chunithmChart(ctx, version.options, version.images),
    }),
);
