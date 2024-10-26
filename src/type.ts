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

export interface IThemeManifest {
    displayName: string;
    name: string;
    width: number;
    height: number;
    sprites: IThemeSprites;
    elements: IThemeElements[];
}

export interface IThemeSprites {
    achievement: {
        d: string;
        c: string;
        b: string;
        bb: string;
        bbb: string;
        a: string;
        aa: string;
        aaa: string;
        s: string;
        sp: string;
        ss: string;
        ssp: string;
        sss: string;
        sssp: string;
    };
    mode: {
        standard: string;
        dx: string;
    };
    milestone: {
        ap: string;
        app: string;
        fc: string;
        fcp: string;
        fdx: string;
        fdxp: string;
        fs: string;
        fsp: string;
        sync: string;
        none: string;
    };
    dxRating: {
        white: string;
        blue: string;
        green: string;
        yellow: string;
        red: string;
        purple: string;
        bronze: string;
        silver: string;
        gold: string;
        platinum: string;
        rainbow: string;
    };
    dxRatingNumberMap: string;
    profile: {
        icon: string;
        nameplate: string;
    };
}

export type IThemeElements =
    | IThemeProfileElement
    | IThemeScoreElement
    | IThemeImageElement;

export interface IThemeElement {
    type: string;
    x: number;
    y: number;
}

export interface IThemeProfileElement extends IThemeElement {
    type: "profile";
    height: number;
}

export interface IThemeScoreElement extends IThemeElement {
    type: "score-grid";
    horizontalSize: number;
    verticalSize: number;
    region: "new" | "old";
    index: number;
    scoreBubble: {
        width: number;
        height: number;
        margin: number;
        gap: number;
        color: {
            basic: string;
            advanced: string;
            expert: string;
            master: string;
            remaster: string;
            utage: string;
        };
    };
}

export interface IThemeImageElement extends IThemeElement {
    type: "image";
    width: number;
    height: number;
    /**
     * Relative path from the manifest file to the element file.
     */
    path: string;
}

export interface IBest50 {
    new: IScore[];
    old: IScore[];
    username: string;
    rating: number;
}
