import { IScore } from "@maidraw/type";

export default abstract class ScoreTrackerAdapter {
    constructor(auth?: string) {
        throw "Constructor implementation is requred!";
    }
    abstract getPlayerBest50(username: string): Promise<{
        new: IScore[];
        old: IScore[];
    } | null>;
    abstract getPlayerInfo(username: string): Promise<{
        name: string;
        rating: number;
    } | null>;
}
