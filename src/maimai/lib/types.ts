import type { BaseScore } from "@common/types/score";
import type { Chart } from "gcm-database/maimai";

export enum ComboLamp {
    NONE = "none",
    FULL_COMBO = "full_combo",
    FULL_COMBO_PLUS = "full_combo_plus",
    ALL_PERFECT = "all_perfect",
    ALL_PERFECT_PLUS = "all_perfect_plus",
}

export enum SyncLamp {
    NONE = "none",
    SYNC_PLAY = "sync",
    FULL_SYNC = "full_sync",
    FULL_SYNC_PLUS = "full_sync_plus",
    FULL_SYNC_DX = "full_sync_dx",
    FULL_SYNC_DX_PLUS = "full_sync_dx_plus",
}

export enum AchievementTypes {
    D = "d",
    C = "c",
    B = "b",
    BB = "bb",
    BBB = "bbb",
    A = "a",
    AA = "aa",
    AAA = "aaa",
    S = "s",
    SP = "s_plus",
    SS = "ss",
    SSP = "ss_plus",
    SSS = "sss",
    SSSP = "sss_plus",
}

export interface Score extends BaseScore {
    chart: Chart;
    combo: ComboLamp;
    sync: SyncLamp;
    achievement: number;
    achievementRank: AchievementTypes;
    dxRating: number;
    dxScore: number;
}
