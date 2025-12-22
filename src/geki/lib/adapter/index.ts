import { IScore } from "@maidraw/geki/type";

export interface OngekiScoreAdapter {
    getPlayerBest55(username: string): Promise<{
        recent: IScore[];
        new: IScore[];
        old: IScore[];
        best: IScore[];
    } | null>;
    getPlayerBest60(username: string): Promise<{
        new: IScore[];
        old: IScore[];
        plat: IScore[];
        best: IScore[];
    } | null>;
    getPlayerScore(
        username: string,
        chartId: number
    ): Promise<{
        basic: IScore | null;
        advanced: IScore | null;
        expert: IScore | null;
        master: IScore | null;
        lunatic: IScore | null;
    } | null>;
    getPlayerInfo(
        username: string,
        type: "refresh" | "classic"
    ): Promise<{
        name: string;
        rating: number;
    } | null>;
    getPlayerProfilePicture(username: string): Promise<Buffer | null>;
}
