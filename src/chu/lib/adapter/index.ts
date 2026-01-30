import { IScore } from "@maidraw/chu/type";
import { DataOrError } from "@maidraw/lib/error";

export interface ChunithmScoreAdapter {
    getPlayerRecent40(username: string): Promise<
        DataOrError<{
            recent: IScore[];
            best: IScore[];
        }>
    >;
    getPlayerBest50(username: string): Promise<
        DataOrError<{
            new: IScore[];
            old: IScore[];
            best?: IScore[];
        }>
    >;
    getPlayerInfo(
        username: string,
        type: "new" | "recents"
    ): Promise<
        DataOrError<{
            name: string;
            rating: number;
        }>
    >;
    getPlayerProfilePicture(username: string): Promise<DataOrError<Buffer>>;
    getPlayerScore(
        username: string,
        chartId: number
    ): Promise<
        DataOrError<{
            basic: IScore | null;
            advanced: IScore | null;
            expert: IScore | null;
            master: IScore | null;
            ultima: IScore | null;
            worldsEnd: IScore | null;
        }>
    >;
}
