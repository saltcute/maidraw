import Util from "@maidraw/lib/util";
import { IScore } from "../../type";

type IBaseResponseData = {
    unknown: null;
};

type IBest50ResponseData = IBaseResponseData & {
    success: {
        new: IScore[];
        old: IScore[];
    };
};
type IProfileResponseData = IBaseResponseData & {
    success: {
        name: string;
        rating: number;
    };
};
type IProfilePictureResponseData = IBaseResponseData & {
    success: Buffer;
};
type IScoreResponseData = IBaseResponseData & {
    success: {
        basic: IScore | null;
        advanced: IScore | null;
        expert: IScore | null;
        master: IScore | null;
        remaster: IScore | null;
        utage: IScore | null;
    };
};
type ILevel50ResponseData = IBaseResponseData & {
    success: IScore[];
};

type IResponseData = {
    best50: IBest50ResponseData;
    profile: IProfileResponseData;
    profilePicture: IProfilePictureResponseData;
    score: IScoreResponseData;
    level50: ILevel50ResponseData;
};

export interface MaimaiScoreAdapter<
    IExtraReturnTypes extends Partial<
        Record<keyof IResponseData, Record<string, unknown>>
    > = {},
> {
    getPlayerBest50(
        username: string
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["best50"]
        >
    >;
    getPlayerInfo(
        username: string
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["profile"]
        >
    >;
    getPlayerProfilePicture(
        username: string
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<
                IResponseData,
                IExtraReturnTypes
            >["profilePicture"]
        >
    >;
    getPlayerScore(
        username: string,
        chartId: number
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["score"]
        >
    >;
    getPlayerLevel50(
        username: string,
        level: number,
        page: number,
        options?: {
            percise: boolean;
        }
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["level50"]
        >
    >;
}
