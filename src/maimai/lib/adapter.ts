import type { DataOrError } from "@common/error";
import type { Difficulty } from "gcm-database/maimai";
import type { Score } from "./types";

export interface MaimaiScoreAdapter {
    getPlayerBest50(username: string): Promise<
        DataOrError<{
            new: Score[];
            old: Score[];
        }>
    >;
    getPlayerInfo(username: string): Promise<
        DataOrError<{
            name: string;
            rating: number;
        }>
    >;
    getPlayerProfilePicture(username: string): Promise<DataOrError<Buffer>>;
    getPlayerScore(username: string, chartIdentifier: string): Promise<DataOrError<Record<Difficulty, Score | null>>>;
    getPlayerLevel50(
        username: string,
        level: number,
        page: number,
        options?: {
            percise: boolean;
        },
    ): Promise<DataOrError<Score[]>>;
}
