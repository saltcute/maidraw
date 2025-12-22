import { IScore } from "@maidraw/chu/type";

export interface ChunithmScoreAdapter {
    getPlayerRecent40(username: string): Promise<{
        recent: IScore[];
        best: IScore[];
    } | null>;
    getPlayerBest50(username: string): Promise<{
        new: IScore[];
        old: IScore[];
        best?: IScore[];
    } | null>;
    getPlayerInfo(
        username: string,
        type: "new" | "recents"
    ): Promise<{
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
        ultima: IScore | null;
        worldsEnd: IScore | null;
    }>;
}
