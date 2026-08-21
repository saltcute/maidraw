import { Best50Painter } from "@ongeki/painter/best";
import { ChartPainter } from "@ongeki/painter/chart";
import type { ImageOptions } from "@theme-tools/common/elements";
import { defineTheme, type ThemeSpec } from "@theme-tools/lib/spec";
import { type OngekiBestOptions, ongekiBestClassic, ongekiBestRefresh } from "@theme-tools/ongeki/best";
import { type OngekiChartOptions, ongekiChart } from "@theme-tools/ongeki/chart";

const best = "themes/ongeki/best";
const chart = "themes/ongeki/chart";

function art(version: string) {
    return `${best}/${version}/assets`;
}

// ---------------------------------------------------------------------------------------------
// Best
// ---------------------------------------------------------------------------------------------

interface OngekiBestVersion {
    dir: string;
    options: OngekiBestOptions;
    /**
     * The version logo is the only artwork whose placement changes between versions.
     */
    classicLogo: ImageOptions;
    refreshLogo: ImageOptions;
}

const bestVersions: OngekiBestVersion[] = [
    {
        dir: "brightmemory",
        options: {
            name: "jp-brightmemory-landscape",
            displayName: "オンゲキ bright MEMORY, landscape",
            borderColor: "#b89f82",
            art: art("brightmemory"),
        },
        classicLogo: { x: 1694, y: -80, width: 600, height: 464, path: `${art("brightmemory")}/logo.webp` },
        refreshLogo: { x: 1930, y: -80, align: "rt", height: 395, path: `${art("brightmemory")}/logo.webp` },
    },
    {
        dir: "refresh",
        options: {
            name: "jp-refresh-landscape",
            displayName: "オンゲキ Re:Fresh, landscape",
            borderColor: "#547318",
            art: art("refresh"),
        },
        classicLogo: { x: 1694, y: -100, width: 616, height: 500, path: `${art("refresh")}/logo.webp` },
        refreshLogo: { x: 1970, y: -60, align: "rt", height: 430, path: `${art("refresh")}/logo.webp` },
    },
];

export const ongekiBestThemes: ThemeSpec[] = bestVersions.flatMap((version) => [
    defineTheme({
        outDir: `${best}/${version.dir}/classic`,
        schema: Best50Painter.THEME,
        build: (ctx) => ongekiBestClassic(ctx, version.options, version.classicLogo),
    }),
    defineTheme({
        outDir: `${best}/${version.dir}/refresh`,
        schema: Best50Painter.THEME,
        build: (ctx) => ongekiBestRefresh(ctx, version.options, version.refreshLogo),
    }),
]);

// ---------------------------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------------------------

interface OngekiChartVersion {
    dir: string;
    options: OngekiChartOptions;
    background: ImageOptions;
}

const chartVersions: OngekiChartVersion[] = [
    {
        // The chart directory is spelled differently from the best directory of the same version.
        dir: "brightMemory",
        options: {
            name: "jp-brightmemory",
            displayName: "オンゲキ bright MEMORY",
            borderColor: "#b89f82",
            cardColor: "#faf9f0",
            art: art("brightmemory"),
        },
        background: { x: 797.5, y: 1251, align: "mm", width: 1595, path: `${art("brightmemory")}/background.webp` },
    },
    {
        dir: "refresh",
        options: {
            name: "jp-refresh",
            displayName: "オンゲキ Re:Fresh",
            borderColor: "#547318",
            cardColor: "#a5f0b1",
            art: art("refresh"),
        },
        background: { x: 0, y: -167, width: 1595, height: 2836, path: `${art("refresh")}/background.webp` },
    },
];

export const ongekiChartThemes: ThemeSpec[] = chartVersions.map((version) =>
    defineTheme({
        outDir: `${chart}/${version.dir}`,
        schema: ChartPainter.THEME,
        build: (ctx) => ongekiChart(ctx, version.options, version.background),
    }),
);
