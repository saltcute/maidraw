export interface IBest50 {
    new: IScore[];
    old: IScore[];
    username: string;
    rating: number;
}
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

    optionalData?: {
        scale?: number;
    };
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

export const RATING_CONSTANTS = {
    [EAchievementTypes.D]: {
        [0.4]: 6.4,
        [0.3]: 4.8,
        [0.2]: 3.2,
        [0.1]: 1.6,
        [0]: 0,
    },
    [EAchievementTypes.C]: 13.6,
    [EAchievementTypes.B]: 13.6,
    [EAchievementTypes.BB]: 13.6,
    [EAchievementTypes.BBB]: 13.6,
    [EAchievementTypes.A]: 13.6,
    [EAchievementTypes.AA]: 15.2,
    [EAchievementTypes.AAA]: 16.8,
    [EAchievementTypes.S]: 20.0,
    [EAchievementTypes.SP]: 20.3,
    [EAchievementTypes.SS]: 20.8,
    [EAchievementTypes.SSP]: 21.1,
    [EAchievementTypes.SSS]: 21.6,
    [EAchievementTypes.SSSP]: 22.4,
};
export const RANK_BORDERS = {
    [EAchievementTypes.D]: [0.0, 0.1, 0.2, 0.3, 0.4],
    [EAchievementTypes.C]: 0.5,
    [EAchievementTypes.B]: 0.6,
    [EAchievementTypes.BB]: 0.7,
    [EAchievementTypes.BBB]: 0.75,
    [EAchievementTypes.A]: 0.8,
    [EAchievementTypes.AA]: 0.9,
    [EAchievementTypes.AAA]: 0.94,
    [EAchievementTypes.S]: 0.97,
    [EAchievementTypes.SP]: 0.98,
    [EAchievementTypes.SS]: 0.99,
    [EAchievementTypes.SSP]: 0.995,
    [EAchievementTypes.SSS]: 1.0,
    [EAchievementTypes.SSSP]: 1.005,
};
