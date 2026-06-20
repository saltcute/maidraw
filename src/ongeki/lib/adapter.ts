import type { DataOrError } from "@common/error";
import type { Difficulty } from "gcm-database/ongeki";
import type { Score } from "./types";

export interface OngekiScoreAdapter {
    getPlayerBest55(username: string): Promise<
        DataOrError<{
            recent: Score[];
            new: Score[];
            old: Score[];
            best: Score[];
        }>
    >;
    getPlayerBest60(username: string): Promise<
        DataOrError<{
            new: Score[];
            old: Score[];
            plat: Score[];
            best: Score[];
        }>
    >;
    getPlayerInfo(
        username: string,
        type: "refresh" | "classic",
    ): Promise<
        DataOrError<{
            name: string;
            rating: number;
        }>
    >;
    getPlayerProfilePicture(username: string): Promise<DataOrError<Buffer>>;
    getPlayerScore(username: string, chartIdentifier: string): Promise<DataOrError<Record<Difficulty, Score | null>>>;
}
