export enum EDifficulty {
    BASIC,
    ADVANCED,
    EXPERT,
    MASTER,
    ULTIMA,
    WORLDS_END,
}

export enum EComboTypes {
    NONE,
    FULL_COMBO,
    ALL_JUSTICE,
    ALL_JUSTICE_CRITICAL,
}

export enum ESyncTypes {
    NONE,
    FULL_CHAIN,
    FULL_CHAIN_JUSTICE,
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
    SSP,
    SSS,
    SSSP,
}

export interface IScore {
    chart: IChart;
    combo: EComboTypes;
    score: number;
    rank: EAchievementTypes;
    rating: number;
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
}
