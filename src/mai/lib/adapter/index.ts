import { IScore } from "../../type";

export interface MaimaiScoreAdapter {
    getPlayerBest50(username: string): Promise<{
        new: IScore[];
        old: IScore[];
    } | null>;
    getPlayerInfo(username: string): Promise<{
        name: string;
        rating: number;
    } | null>;
    getPlayerProfilePicture(username: string): Promise<Buffer | null>;
    getPlayerScore(
        username: string,
        chartId: number
    ): Promise<{
        basic: IScore | null;
        advanced: IScore | null;
        expert: IScore | null;
        master: IScore | null;
        remaster: IScore | null;
        utage: IScore | null;
    }>;
    getPlayerLevel50(
        username: string,
        level: number,
        page: number,
        options?: {
            percise: boolean;
        }
    ): Promise<IScore[] | null>;
}
