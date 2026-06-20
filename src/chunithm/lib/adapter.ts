import type { Score } from "@chunithm/lib/types";
import type { DataOrError } from "@common/error";
import type { Difficulty } from "gcm-database/chunithm";

export interface ChunithmScoreAdapter {
    getPlayerRecent40(username: string): Promise<
        DataOrError<{
            recent: Score[];
            best: Score[];
        }>
    >;
    getPlayerBest50(username: string): Promise<
        DataOrError<{
            new: Score[];
            old: Score[];
            best?: Score[];
        }>
    >;
    getPlayerInfo(
        username: string,
        type: "new" | "recents",
    ): Promise<
        DataOrError<{
            name: string;
            rating: number;
        }>
    >;
    getPlayerProfilePicture(username: string): Promise<DataOrError<Buffer>>;
    getPlayerScore(username: string, chartIdentifier: string): Promise<DataOrError<Record<Difficulty, Score | null>>>;
}
