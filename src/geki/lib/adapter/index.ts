import { IScore } from "@maidraw/geki/type";
import { DataOrError } from "@maidraw/lib/type";

export interface OngekiScoreAdapter {
    getPlayerBest55(username: string): Promise<
        DataOrError<{
            recent: IScore[];
            new: IScore[];
            old: IScore[];
            best: IScore[];
        }>
    >;
    getPlayerBest60(username: string): Promise<
        DataOrError<{
            new: IScore[];
            old: IScore[];
            plat: IScore[];
            best: IScore[];
        }>
    >;
    getPlayerScore(
        username: string,
        chartId: number
    ): Promise<
        DataOrError<{
            basic: IScore | null;
            advanced: IScore | null;
            expert: IScore | null;
            master: IScore | null;
            lunatic: IScore | null;
        }>
    >;
    getPlayerInfo(
        username: string,
        type: "refresh" | "classic"
    ): Promise<
        DataOrError<{
            name: string;
            rating: number;
        }>
    >;
    getPlayerProfilePicture(username: string): Promise<DataOrError<Buffer>>;
}
