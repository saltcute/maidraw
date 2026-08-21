import { Best50Painter } from "@maimai/painter/best50";
import { ChartPainter } from "@maimai/painter/chart";
import type { ImageOptions } from "@theme-tools/common/elements";
import { defineTheme, type ThemeSpec } from "@theme-tools/lib/spec";
import { type MaimaiBest50Options, maimaiBest50Landscape, maimaiBest50Portrait } from "@theme-tools/maimai/best50";
import { type MaimaiChartOptions, maimaiChart } from "@theme-tools/maimai/chart";
import { maimaiBest50Versionless } from "@theme-tools/maimai/sprites";

const best50 = "themes/maimai/best50";
const chart = "themes/maimai/chart";

/**
 * Artwork of a version, so a theme that borrows another version's art only names the directory once.
 */
function art(version: string) {
    return `${best50}/${version}/assets`;
}

interface MaimaiBest50Version {
    /**
     * Directory under `themes/maimai/best50` the two manifests are written to.
     */
    dir: string;
    options: MaimaiBest50Options;
    landscape: ImageOptions[];
    portrait: ImageOptions[];
}

/**
 * Every maimai best50 theme. Adding a version is one entry here plus its artwork under `assets/`.
 */
const versions: MaimaiBest50Version[] = [
    {
        dir: "2024",
        options: {
            name: "cn-2024",
            displayName: "舞萌DX 2024",
            borderColor: "#754F05",
            achievements: `${art("buddies")}/achievement`,
            modes: `${maimaiBest50Versionless}/mode/cn`,
            dxRating: `${maimaiBest50Versionless}/dxRating/cn`,
        },
        landscape: [
            { x: 0, y: -480, width: 2560, height: 1920, path: `${art("buddies")}/background.webp` },
            { x: 570, y: 70, width: 468, height: 643, path: `${art("buddies")}/chara.webp` },
            { x: 300, y: 30, width: 420, height: 153, path: `${art("buddies")}/laundry.webp` },
            { x: 336, y: 50, width: 350, height: 350, path: `${art("2024")}/logo.webp` },
        ],
        portrait: [
            { x: -763, y: 0, width: 3086, height: 2315, path: `${art("buddies")}/background.webp` },
            { x: 980, y: 130, width: 600, height: 824, path: `${art("buddies")}/chara.webp` },
            { x: 140, y: 0, width: 362, height: 132, path: `${art("buddies")}/laundry.webp` },
            { x: 105, y: 50, width: 450, height: 450, path: `${art("2024")}/logo.webp` },
        ],
    },
    {
        dir: "2025",
        options: {
            name: "cn-2025",
            displayName: "舞萌DX 2025",
            borderColor: "#226180",
            achievements: `${art("prism")}/achievement`,
            modes: `${maimaiBest50Versionless}/mode/cn`,
            dxRating: `${maimaiBest50Versionless}/dxRating/cn`,
        },
        landscape: [
            { x: 0, y: -480, width: 2560, height: 1920, path: `${art("prism")}/background.webp` },
            { x: 515, y: 70, width: 720, height: 705, path: `${art("prism")}/chara.webp` },
            { x: 340, y: -50, width: 362, height: 207, path: `${art("prism")}/laundry.webp` },
            { x: 220, y: 50, width: 585, height: 300, path: `${art("2025")}/logo.webp` },
        ],
        portrait: [
            { x: -763, y: 0, width: 3086, height: 2315, path: `${art("prism")}/background.webp` },
            { x: 980, y: 220, width: 600, height: 566, path: `${art("prism")}/chara.webp` },
            { x: 150, y: -70, width: 364, height: 208, path: `${art("prism")}/laundry.webp` },
            { x: 3, y: 29, width: 662, height: 339, path: `${art("2025")}/logo.webp` },
        ],
    },
    {
        dir: "2026",
        options: {
            name: "cn-2026",
            displayName: "舞萌DX 2026",
            borderColor: "#226180",
            achievements: `${art("prism")}/achievement`,
            modes: `${maimaiBest50Versionless}/mode/jp`,
            dxRating: `${maimaiBest50Versionless}/dxRating/jp`,
        },
        landscape: [
            { x: 0, y: -480, width: 2560, height: 1920, path: `${art("prismplus")}/background.webp` },
            { x: 534, y: 70, width: 720, height: 633, path: `${art("prismplus")}/chara.webp` },
            { x: 368, y: -3, width: 287, height: 212, path: `${art("prismplus")}/laundry.webp` },
            { x: 232, y: 116, width: 557, height: 231, path: `${art("2026")}/logo.webp` },
        ],
        portrait: [
            { x: -763, y: 0, width: 3086, height: 2315, path: `${art("prismplus")}/background.webp` },
            { x: 980, y: 200, width: 600, height: 527, path: `${art("prismplus")}/chara.webp` },
            { x: 189, y: -20, width: 282, height: 208, path: `${art("prismplus")}/laundry.webp` },
            { x: 53, y: 100, width: 554, height: 230, path: `${art("2026")}/logo.webp` },
        ],
    },
    {
        dir: "buddies",
        options: {
            name: "jp-buddies",
            displayName: "maimai でらっくす BUDDiES",
            borderColor: "#754F05",
            achievements: `${art("buddies")}/achievement`,
            modes: `${maimaiBest50Versionless}/mode/jp`,
            dxRating: `${maimaiBest50Versionless}/dxRating/jp`,
        },
        landscape: [
            { x: 0, y: -480, width: 2560, height: 1920, path: `${art("buddies")}/background.webp` },
            { x: 570, y: 70, width: 468, height: 643, path: `${art("buddies")}/chara.webp` },
            { x: 330, y: 30, width: 362, height: 132, path: `${art("buddies")}/laundry.webp` },
            { x: 285, y: 80, width: 450, height: 267, path: `${art("buddies")}/logo.webp` },
        ],
        portrait: [
            { x: -763, y: 0, width: 3086, height: 2315, path: `${art("buddies")}/background.webp` },
            { x: 980, y: 130, width: 600, height: 825, path: `${art("buddies")}/chara.webp` },
            { x: 150, y: 50, width: 364, height: 132, path: `${art("buddies")}/laundry.webp` },
            { x: 105, y: 100, width: 450, height: 267, path: `${art("buddies")}/logo.webp` },
        ],
    },
    {
        dir: "buddiesplus",
        options: {
            name: "jp-buddiesplus",
            displayName: "maimai でらっくす BUDDiES PLUS",
            borderColor: "#754F05",
            achievements: `${art("buddies")}/achievement`,
            modes: `${maimaiBest50Versionless}/mode/jp`,
            dxRating: `${maimaiBest50Versionless}/dxRating/jp`,
        },
        landscape: [
            { x: 0, y: -480, width: 2560, height: 1920, path: `${art("buddies")}/background.webp` },
            { x: 370, y: 130, width: 660, height: 553, path: `${art("buddiesplus")}/chara.webp` },
            { x: 330, y: 30, width: 300, height: 132, path: `${art("buddiesplus")}/laundry.webp` },
            { x: 285, y: 80, width: 450, height: 267, path: `${art("buddiesplus")}/logo.webp` },
        ],
        portrait: [
            { x: -763, y: 0, width: 3086, height: 2315, path: `${art("buddies")}/background.webp` },
            { x: 680, y: 180, width: 900, height: 695, path: `${art("buddiesplus")}/chara.webp` },
            { x: 130, y: 50, width: 300, height: 132, path: `${art("buddiesplus")}/laundry.webp` },
            { x: 105, y: 100, width: 450, height: 267, path: `${art("buddiesplus")}/logo.webp` },
        ],
    },
    {
        dir: "circle",
        options: {
            name: "jp-circle",
            displayName: "maimai でらっくす CiRCLE",
            borderColor: "#ff1a82",
            achievements: `${art("circle")}/achievement`,
            modes: `${maimaiBest50Versionless}/mode/jp`,
            dxRating: `${maimaiBest50Versionless}/dxRating/jp`,
        },
        landscape: [
            { x: 0, y: 0, width: 2560, height: 1440, path: `${art("circle")}/background/landscape.webp` },
            { x: 535, y: 70, height: 705, path: `${art("circle")}/chara.webp` },
            { x: 325, y: 46, width: 225, path: `${art("circle")}/laundry.webp` },
            { x: 285, y: 116, width: 450, path: `${art("circle")}/logo.webp` },
        ],
        portrait: [
            { x: 0, y: 0, width: 1560, height: 2315, path: `${art("circle")}/background/portrait.webp` },
            { x: 980, y: 220, width: 600, path: `${art("circle")}/chara.webp` },
            { x: 130, y: 30, width: 240, path: `${art("circle")}/laundry.webp` },
            { x: 90, y: 100, width: 482, path: `${art("circle")}/logo.webp` },
        ],
    },
    {
        dir: "circleplus",
        options: {
            name: "jp-circleplus",
            displayName: "maimai でらっくす CiRCLE PLUS",
            borderColor: "#ff1a82",
            achievements: `${art("circle")}/achievement`,
            modes: `${maimaiBest50Versionless}/mode/jp`,
            dxRating: `${maimaiBest50Versionless}/dxRating/jp`,
        },
        landscape: [
            { x: 1280, y: 720, align: "cm", width: 2560, height: 1440, path: `${art("circleplus")}/background/landscape.webp` },
            { x: 555, y: 160, height: 355, path: `${art("circleplus")}/chara.webp` },
            { x: 275, y: 70, width: 210, path: `${art("circleplus")}/laundry.webp` },
            { x: 260, y: 116, width: 500, path: `${art("circleplus")}/logo.webp` },
        ],
        portrait: [
            { x: 780, y: 1157, align: "cm", width: 1560, height: 2315, path: `${art("circleplus")}/background/portrait.webp` },
            { x: 920, y: 290, width: 660, path: `${art("circleplus")}/chara.webp` },
            { x: 102, y: 50, width: 211, path: `${art("circleplus")}/laundry.webp` },
            { x: 90, y: 100, width: 482, path: `${art("circleplus")}/logo.webp` },
        ],
    },
    {
        dir: "finale",
        options: {
            name: "jp-finale",
            displayName: "maimai FiNALE",
            borderColor: "#242B4A",
            brand: "maimai",
            achievements: `${art("finale")}/achievement`,
            // FiNALE ships its own clear lamps but predates the DX sync and full DX lamps.
            milestones: {
                default: `${maimaiBest50Versionless}/milestone`,
                ap: `${art("finale")}/milestone`,
                app: `${art("finale")}/milestone`,
                fc: `${art("finale")}/milestone`,
                fcp: `${art("finale")}/milestone`,
            },
            modes: `${maimaiBest50Versionless}/mode/jp`,
            dxRating: `${maimaiBest50Versionless}/dxRating/jp`,
        },
        landscape: [
            { x: 0, y: 0, width: 2560, height: 1920, path: `${art("finale")}/background/landscape.webp` },
            { x: 232, y: -25, width: 557, height: 372, path: `${art("finale")}/logo.webp` },
        ],
        portrait: [
            { x: 0, y: 0, width: 1560, height: 2773, path: `${art("finale")}/background/portrait.webp` },
            { x: 53, y: 40, width: 499, height: 333, path: `${art("finale")}/logo.webp` },
        ],
    },
    {
        dir: "prism",
        options: {
            name: "jp-prism",
            displayName: "maimai でらっくす PRiSM",
            borderColor: "#226180",
            achievements: `${art("prism")}/achievement`,
            modes: `${maimaiBest50Versionless}/mode/jp`,
            dxRating: `${maimaiBest50Versionless}/dxRating/jp`,
        },
        landscape: [
            { x: 0, y: -480, width: 2560, height: 1920, path: `${art("prism")}/background.webp` },
            { x: 515, y: 70, width: 720, height: 705, path: `${art("prism")}/chara.webp` },
            { x: 330, y: 0, width: 362, height: 207, path: `${art("prism")}/laundry.webp` },
            { x: 285, y: 116, width: 450, height: 231, path: `${art("prism")}/logo.webp` },
        ],
        portrait: [
            { x: -763, y: 0, width: 3086, height: 2315, path: `${art("prism")}/background.webp` },
            { x: 980, y: 220, width: 600, height: 566, path: `${art("prism")}/chara.webp` },
            { x: 150, y: -20, width: 364, height: 208, path: `${art("prism")}/laundry.webp` },
            { x: 105, y: 100, width: 450, height: 230, path: `${art("prism")}/logo.webp` },
        ],
    },
    {
        dir: "prismplus",
        options: {
            name: "jp-prismplus",
            displayName: "maimai でらっくす PRiSM PLUS",
            borderColor: "#226180",
            achievements: `${art("prism")}/achievement`,
            modes: `${maimaiBest50Versionless}/mode/jp`,
            dxRating: `${maimaiBest50Versionless}/dxRating/jp`,
        },
        landscape: [
            { x: 0, y: -480, width: 2560, height: 1920, path: `${art("prismplus")}/background.webp` },
            { x: 534, y: 70, width: 720, height: 633, path: `${art("prismplus")}/chara.webp` },
            { x: 368, y: -3, width: 287, height: 212, path: `${art("prismplus")}/laundry.webp` },
            { x: 232, y: 116, width: 557, height: 231, path: `${art("prismplus")}/logo.webp` },
        ],
        portrait: [
            { x: -763, y: 0, width: 3086, height: 2315, path: `${art("prismplus")}/background.webp` },
            { x: 980, y: 200, width: 600, height: 527, path: `${art("prismplus")}/chara.webp` },
            { x: 189, y: -20, width: 282, height: 208, path: `${art("prismplus")}/laundry.webp` },
            { x: 53, y: 100, width: 554, height: 230, path: `${art("prismplus")}/logo.webp` },
        ],
    },
    {
        dir: "salt2026",
        options: {
            name: "salt-2026",
            displayName: "maimai でらっくす PRiSM PLUS",
            displayNameSuffix: " (April Fools 2026)",
            borderColor: "#226180",
            achievements: `${art("salt2026")}/achievement`,
            // The joke theme replaces every lamp except the empty one.
            milestones: { default: `${art("salt2026")}/milestone`, none: `${maimaiBest50Versionless}/milestone` },
            modes: `${art("salt2026")}/mode`,
            dxRating: `${maimaiBest50Versionless}/dxRating/jp`,
        },
        landscape: [
            { x: 0, y: -480, width: 2560, height: 1920, path: `${art("salt2026")}/background.webp` },
            { x: 390, y: 90, width: 690, path: `${art("salt2026")}/chara.webp` },
            { x: 100, y: 120, width: 550, path: `${art("salt2026")}/logo.webp` },
        ],
        portrait: [
            { x: -763, y: 0, width: 3086, height: 2315, path: `${art("salt2026")}/background.webp` },
            { x: 980, y: 200, width: 600, path: `${art("salt2026")}/chara.webp` },
            { x: 53, y: 100, width: 550, path: `${art("salt2026")}/logo.webp` },
        ],
    },
];

export const maimaiBest50Themes: ThemeSpec[] = versions.flatMap((version) => [
    defineTheme({
        outDir: `${best50}/${version.dir}/landscape`,
        schema: Best50Painter.THEME,
        build: (ctx) => maimaiBest50Landscape(ctx, version.options, version.landscape),
    }),
    defineTheme({
        outDir: `${best50}/${version.dir}/portrait`,
        schema: Best50Painter.THEME,
        build: (ctx) => maimaiBest50Portrait(ctx, version.options, version.portrait),
    }),
]);

// ---------------------------------------------------------------------------------------------
// Chart
// ---------------------------------------------------------------------------------------------

interface MaimaiChartVersion {
    /**
     * Directory under `themes/maimai/chart` the manifest is written to.
     */
    dir: string;
    options: MaimaiChartOptions;
    images: ImageOptions[];
}

/**
 * Every maimai chart theme. The chart layout is fixed, so a version only supplies its artwork,
 * accent colour and card fill.
 */
const chartVersions: MaimaiChartVersion[] = [
    {
        dir: "circle",
        options: {
            name: "jp-circle",
            displayName: "maimai でらっくす CiRCLE",
            borderColor: "#ff1a82",
            cardColor: "#ffa7c5",
            achievements: `${art("circle")}/achievement`,
        },
        images: [
            { x: 1280, y: 720, align: "mm", height: 1440, path: `${art("circle")}/background/landscape.webp` },
            { x: 2152, y: 262, align: "mt", height: 290, path: `${art("circle")}/logo.webp` },
        ],
    },
    {
        dir: "circleplus",
        options: {
            name: "jp-circleplus",
            displayName: "maimai でらっくす CiRCLE PLUS",
            borderColor: "#ff1a82",
            cardColor: "#ffa7c5",
            achievements: `${art("circle")}/achievement`,
        },
        images: [
            { x: 1280, y: 720, align: "mm", width: 2560, height: 1440, path: `${art("circleplus")}/background/landscape.webp` },
            { x: 2152, y: 262, align: "mt", height: 290, path: `${art("circleplus")}/logo.webp` },
        ],
    },
    {
        dir: "prism",
        options: {
            name: "jp-prism",
            displayName: "maimai でらっくす PRiSM",
            borderColor: "#226180",
            cardColor: "#b9eae5",
            achievements: `${art("prism")}/achievement`,
        },
        images: [
            { x: 1280, y: 720, align: "cm", width: 2560, path: `${art("prism")}/background.webp` },
            { x: 1845, y: 262, width: 615, height: 310, path: `${art("prism")}/logo.webp` },
        ],
    },
    {
        dir: "prismplus",
        options: {
            name: "jp-prismplus",
            displayName: "maimai でらっくす PRiSM PLUS",
            borderColor: "#226180",
            cardColor: "#bbdefa",
            achievements: `${art("prism")}/achievement`,
        },
        images: [
            { x: 1280, y: 720, align: "mm", width: 2560, path: `${art("prismplus")}/background.webp` },
            { x: 2152, y: 262, align: "mt", height: 305, path: `${art("prismplus")}/logo.webp` },
        ],
    },
];

export const maimaiChartThemes: ThemeSpec[] = chartVersions.map((version) =>
    defineTheme({
        outDir: `${chart}/${version.dir}`,
        schema: ChartPainter.THEME,
        build: (ctx) => maimaiChart(ctx, version.options, version.images),
    }),
);
