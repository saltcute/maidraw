import type { BaseScore } from "@common/types/score";
import type { Chart } from "gcm-database/chunithm";

export enum ComboLamp {
    NONE = "none",
    FULL_COMBO = "full_combo",
    ALL_JUSTICE = "all_justice",
    ALL_JUSTICE_CRITICAL = "all_justice_critical",
}

export enum ClearLamp {
    NONE = "none",
    FAILED = "failed",
    CLEAR = "clear",
    HARD = "hard",
    BRAVE = "brave",
    ABSOLUTE = "absolute",
    CATASTROPHY = "catastrophy",
}

export enum ChainLamp {
    NONE = "none",
    FULL_CHAIN = "full_chain",
    FULL_CHAIN_JUSTICE = "full_chain_justice",
}

export enum AchievementTypes {
    D = "d",
    C = "C",
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
    chain: ChainLamp;
    clear: ClearLamp;
    score: number;
    rank: AchievementTypes;
    rating: number;
}
