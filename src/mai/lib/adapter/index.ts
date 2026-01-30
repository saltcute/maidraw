import { DataOrError } from "@maidraw/lib/error";
import { IScore } from "../../type";

export interface MaimaiScoreAdapter {
    getPlayerBest50(username: string): Promise<
        DataOrError<{
            new: IScore[];
            old: IScore[];
        }>
    >;
    getPlayerInfo(username: string): Promise<
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
            remaster: IScore | null;
            utage: IScore | null;
        }>
    >;
    getPlayerLevel50(
        username: string,
        level: number,
        page: number,
        options?: {
            percise: boolean;
        }
    ): Promise<DataOrError<IScore[]>>;
}
