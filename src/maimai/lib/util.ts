import { AchievementTypes, ComboLamp, type Score, SyncLamp } from "@maimai/lib/types";
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

/**
 * Amount of DX score stars of a score, or 0 when the chart has no notes.
 */
export function getDxStarOfScore(score: Score) {
    const maxDxScore = getMaxDxScore(score.chart);
    return maxDxScore > 0 ? getDxStar(score.dxScore / maxDxScore) : 0;
}

const COMBO_LAMP_ORDER = [ComboLamp.NONE, ComboLamp.FULL_COMBO, ComboLamp.FULL_COMBO_PLUS, ComboLamp.ALL_PERFECT, ComboLamp.ALL_PERFECT_PLUS];
const SYNC_LAMP_ORDER = [
    SyncLamp.NONE,
    SyncLamp.SYNC_PLAY,
    SyncLamp.FULL_SYNC,
    SyncLamp.FULL_SYNC_PLUS,
    SyncLamp.FULL_SYNC_DX,
    SyncLamp.FULL_SYNC_DX_PLUS,
];
const ACHIEVEMENT_RANK_ORDER = [
    AchievementTypes.D,
    AchievementTypes.C,
    AchievementTypes.B,
    AchievementTypes.BB,
    AchievementTypes.BBB,
    AchievementTypes.A,
    AchievementTypes.AA,
    AchievementTypes.AAA,
    AchievementTypes.S,
    AchievementTypes.SP,
    AchievementTypes.SS,
    AchievementTypes.SSP,
    AchievementTypes.SSS,
    AchievementTypes.SSSP,
];

/**
 * Compare two combo lamps. Negative when `a` is lower than `b`, positive when higher, 0 when equal.
 */
export function compareComboLamp(a: ComboLamp, b: ComboLamp) {
    return COMBO_LAMP_ORDER.indexOf(a) - COMBO_LAMP_ORDER.indexOf(b);
}
/**
 * Compare two sync lamps. Negative when `a` is lower than `b`, positive when higher, 0 when equal.
 */
export function compareSyncLamp(a: SyncLamp, b: SyncLamp) {
    return SYNC_LAMP_ORDER.indexOf(a) - SYNC_LAMP_ORDER.indexOf(b);
}
/**
 * Compare two achievement ranks. Negative when `a` is lower than `b`, positive when higher, 0 when equal.
 */
export function compareAchievementRank(a: AchievementTypes, b: AchievementTypes) {
    return ACHIEVEMENT_RANK_ORDER.indexOf(a) - ACHIEVEMENT_RANK_ORDER.indexOf(b);
}
