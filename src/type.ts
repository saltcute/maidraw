export enum EDifficulty {
    BASIC,
    ADVANCED,
    EXPERT,
    MASTER,
    REMASTER,
    UTAGE,
}

export enum EComboTypes {
    NONE,
    FULL_COMBO,
    FULL_COMBO_PLUS,
    ALL_PERFECT,
    ALL_PERFECT_PLUS,
}

export enum ESyncTypes {
    NONE,
    SYNC_PLAY,
    FULL_SYNC,
    FULL_SYNC_PLUS,
    FULL_SYNC_DX,
    FULL_SYNC_DX_PLUS,
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
    SP,
    SS,
    SSP,
    SSS,
    SSSP,
}

export interface IScore {
    chart: IChart;
    combo: EComboTypes;
    sync: ESyncTypes;
    achievement: number;
    achievementRank: EAchievementTypes;
    dxRating: number;
    dxScore: number;
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
    maxDxScore: number;
}
