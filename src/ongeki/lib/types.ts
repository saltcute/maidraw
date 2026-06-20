import type { BaseScore } from "@common/types/score";
import type { Chart } from "gcm-database/ongeki";

export enum ComboLamp {
    NONE = "none",
    FULL_COMBO = "full_combo",
    ALL_BREAK = "all_break",
    ALL_BREAK_PLUS = "all_break_plus",
}

export enum BellLamp {
    NONE = "none",
    FULL_BELL = "full_bell",
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
    SS = "ss",
    SSS = "sss",
    SSSP = "sss_plus",
}

export interface Score extends BaseScore {
    chart: Chart;
    combo: ComboLamp;
    bell: BellLamp;
    score: number;
    rank: AchievementTypes;
    rating: number;
    starRating: number;
    platinumScore: number;
}
