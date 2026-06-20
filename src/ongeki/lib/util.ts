import type { Chart } from "gcm-database/ongeki";

export function getMaxPlatinumScore(chart: Chart) {
    return (chart.notes.tap + chart.notes.hold + chart.notes.side + chart.notes.flick + chart.notes.bell) * 2;
}

/**
 * Get the amount of platinum stars given a platinum score ratio.
 *
 * @param starRatio Ratio between achieved and maximum platinum score, from 0 to 1.
 */
export function getStar(starRatio: number) {
    if (starRatio < 0 || starRatio > 1) return 0;
    if (starRatio >= 0.98) return 5;
    if (starRatio >= 0.97) return 4;
    if (starRatio >= 0.96) return 3;
    if (starRatio >= 0.95) return 2;
    if (starRatio >= 0.94) return 1;
    return 0;
}
