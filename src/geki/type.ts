export enum EDifficulty {
    BASIC,
    ADVANCED,
    EXPERT,
    MASTER,
    LUNATIC,
}

export enum EComboTypes {
    NONE,
    FULL_COMBO,
    ALL_BREAK,
    ALL_BREAK_PLUS,
}

export enum EBellTypes {
    NONE,
    FULL_BELL,
}

export enum EAchievementTypes {
    D,
    C,
    B,
    BB,
    BBB,
    A,
    AA,
    AAA,
    S,
    SS,
    SSS,
    SSSP,
}

export interface IScore {
    chart: IChart;
    combo: EComboTypes;
    bell: EBellTypes;
    score: number;
    rank: EAchievementTypes;
    rating: number;
    platinumScore: number;
}

export interface IChart {
    id: number;
    name: string;
    difficulty: EDifficulty;
    /**
     * Chart internal level.
     * `7.0, 11.2, 11.7, 13.2, 14.8, 15.0`
     */
    level: number;
    maxPlatinumScore: number;
}
