import { IScore } from "@maidraw/geki/type";
import { BaseScoreAdapter } from "@maidraw/lib/adapter";
import Util from "@maidraw/lib/util";

type IBaseResponseData = {
    unknown: null;
};

type IBest55ResponseData = IBaseResponseData & {
    success: {
        recent: IScore[];
        new: IScore[];
        old: IScore[];
        best: IScore[];
    };
};
type IBest60ResponseData = IBaseResponseData & {
    success: {
        new: IScore[];
        old: IScore[];
        plat: IScore[];
        best: IScore[];
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
        lunatic: IScore | null;
    };
};

type IResponseData = {
    best55: IBest55ResponseData;
    best60: IBest60ResponseData;
    profile: IProfileResponseData;
    profilePicture: IProfilePictureResponseData;
    score: IScoreResponseData;
};

export abstract class OngekiScoreAdapter<
    IExtraReturnTypes extends Partial<
        Record<keyof IResponseData, Record<string, unknown>>
    > = {},
> extends BaseScoreAdapter {
    abstract getPlayerBest55(
        username: string
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["best55"]
        >
    >;
    abstract getPlayerBest60(
        username: string
    ): Promise<
        Util.ResponseOf<
            Util.MergeExtraTypes<IResponseData, IExtraReturnTypes>["best60"]
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
    abstract getPlayerInfo(
        username: string,
        type: "refresh" | "classic"
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
}
