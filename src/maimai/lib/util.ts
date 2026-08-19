import type { Chart } from "gcm-database/maimai";

export function getMaxDxScore(chart: Chart) {
    const { tap, hold, slide, touch, break: brk } = chart.notes;
    return (tap + hold + slide + touch + brk) * 3;
}

/**
 * Get the amount of DX score stars given a DX score ratio.
 *
 * @param starRatio Ratio between achieved and maximum DX score, from 0 to 1.
 */
export function getDxStar(starRatio: number) {
    if (starRatio < 0 || starRatio > 1) return -1;
    if (starRatio >= 0.97) return 5;
    if (starRatio >= 0.95) return 4;
    if (starRatio >= 0.93) return 3;
    if (starRatio >= 0.9) return 2;
    if (starRatio >= 0.85) return 1;
    return 0;
}
