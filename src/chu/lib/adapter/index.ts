import { IScore } from "@maidraw/chu/type";
import { BaseScoreAdapter } from "@maidraw/lib/adapter";
import Util from "@maidraw/lib/util";

type IBaseResponseData = {
    unknown: null;
};

type IRecent40ResponseData = IBaseResponseData & {
    success: {
        recent: IScore[];
        best: IScore[];
    };
};
type IBest50ResponseData = IBaseResponseData & {
    success: {
        new: IScore[];
        old: IScore[];
        best?: IScore[];
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
        ultima: IScore | null;
        worldsEnd: IScore | null;
    };
};

type IResponseData = {
    recent40: IRecent40ResponseData;
    best50: IBest50ResponseData;
    profile: IProfileResponseData;
    profilePicture: IProfilePictureResponseData;
    score: IScoreResponseData;
};

export abstract class ChunithmScoreAdapter<
    IExtraReturnTypes extends Partial<
        Record<keyof IResponseData, Record<string, unknown>>
    > = {},
> extends BaseScoreAdapter {
    abstract getPlayerRecent40(
        username: string
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["recent40"]
        >
    >;
    abstract getPlayerBest50(
        username: string
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["best50"]
        >
    >;
    abstract getPlayerInfo(
        username: string,
        type: "new" | "recents"
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["profile"]
        >
    >;
    abstract getPlayerProfilePicture(
        username: string
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<
                IResponseData,
                IExtraReturnTypes
            >["profilePicture"]
        >
    >;
    abstract getPlayerScore(
        username: string,
        chartId: number
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["score"]
        >
    >;
}
