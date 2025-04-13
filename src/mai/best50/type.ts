import { IScore } from "@maidraw/type";

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
    | IThemeImageElement
    | IThemeTextElement;

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
export interface IThemeTextElement extends IThemeElement {
    type: "text";
    size: number;
    content: string;
    /**
     * If width is provied and the text is too long, it will be cut off.
     */
    width?: number;
    /**
     * If height is provied and the text is too big, it will be cut off.
     */
    height?: number;
    /**
     * If true, instead of cutting off the text, it will change to a new line.
     * Height restrictions will still apply.
     */
    linebreak?: boolean;
    /**
     * Text alignment.
     * Defaults to left.
     */
    align?: "left" | "center" | "right";
    /**
     * Text color.
     * Defaults to white (#FFFFFF).
     */
    color?: string;
    /**
     * Text border color.
     * Defaults a darker variant of `color`.
     */
    borderColor?: string;
    /**
     * Text font. Please make sure the font is available in the environment.
     * Defaults to a preconfigured font macro. Check source code for more info.
     */
    font?: string;
}

export interface IBest50 {
    new: IScore[];
    old: IScore[];
    username: string;
    rating: number;
}
