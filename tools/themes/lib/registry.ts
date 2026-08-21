import { chunithmBestThemes, chunithmChartThemes } from "@theme-tools/chunithm/themes";
import type { ThemeSpec } from "@theme-tools/lib/spec";
import { maimaiBest50Themes, maimaiChartThemes } from "@theme-tools/maimai/themes";
import { ongekiBestThemes, ongekiChartThemes } from "@theme-tools/ongeki/themes";

/**
 * Every theme this tool generates, across all three games.
 */
export const themes: ThemeSpec[] = [
    ...maimaiBest50Themes,
    ...maimaiChartThemes,
    ...chunithmBestThemes,
    ...chunithmChartThemes,
    ...ongekiBestThemes,
    ...ongekiChartThemes,
];
