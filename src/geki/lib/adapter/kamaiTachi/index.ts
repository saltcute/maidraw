import {
    EAchievementTypes,
    EBellTypes,
    EComboTypes,
    EDifficulty,
    IScore,
} from "@maidraw/geki/type";
import ScoreTrackerAdapter from "..";
import { Util } from "@maidraw/lib/util";

export class KamaiTachi extends ScoreTrackerAdapter {
    private readonly CURRENT_VERSION: KamaiTachi.EGameVersions;
    constructor({
        baseURL = "https://kamai.tachi.ac/",
        currentVersion = KamaiTachi.EGameVersions.REFRESH,
    }: {
        baseURL?: string;
        currentVersion?: KamaiTachi.EGameVersions;
    } = {}) {
        super({ baseURL });
        this.CURRENT_VERSION = currentVersion;
    }

    getPlatinumScore(score: KamaiTachi.IScore | KamaiTachi.IPb) {
        const ASSUMED_PLAT_SCORE_RATE = 0;
        if (score.scoreData.platinumScore) return score.scoreData.platinumScore;
        else if (score.scoreData.optional.platScore)
            return score.scoreData.optional.platScore;
        else {
            let platScore =
                (1 + ASSUMED_PLAT_SCORE_RATE) *
                score.scoreData.judgements.cbreak;
            if (score.scoreData.optional.damage)
                platScore -= 2 * score.scoreData.optional.damage;
            if (
                score.scoreData.optional.totalBellCount &&
                score.scoreData.optional.bellCount
            )
                platScore -=
                    2 *
                    (score.scoreData.optional.totalBellCount -
                        score.scoreData.optional.bellCount);
            return platScore;
        }
    }

    getPlatinumScoreRatio(
        chart: KamaiTachi.IChart,
        score: KamaiTachi.IScore | KamaiTachi.IPb
    ) {
        return this.getPlatinumScore(score) / chart.data.maxPlatScore;
    }

    async getPlayerPB(userId: string) {
        return this.get<
            KamaiTachi.IResponse<{
                charts: KamaiTachi.IChart[];
                pbs: KamaiTachi.IPb[];
                songs: KamaiTachi.ISong[];
            }>
        >(
            `/api/v1/users/${userId}/games/ongeki/Single/pbs/all`,
            undefined,
            60 * 1000
        );
    }
    async getPlayerRecentScores(userId: string) {
        return this.get<
            KamaiTachi.IResponse<{
                charts: KamaiTachi.IChart[];
                scores: KamaiTachi.IScore[];
                songs: KamaiTachi.ISong[];
            }>
        >(
            `/api/v1/users/${userId}/games/ongeki/Single/scores/recent`,
            undefined,
            60 * 1000
        );
    }
    private toMaiDrawScore(
        score: KamaiTachi.IPb | KamaiTachi.IScore,
        chart: KamaiTachi.IChart,
        song: KamaiTachi.ISong,
        type: "refresh" | "classic" = "refresh"
    ): IScore {
        return {
            chart: (() => {
                return {
                    id: chart.data.inGameID,
                    name: song.title,
                    difficulty: (() => {
                        switch (chart.difficulty) {
                            case "LUNATIC":
                                return EDifficulty.LUNATIC;
                            case "MASTER":
                                return EDifficulty.MASTER;
                            case "EXPERT":
                                return EDifficulty.EXPERT;
                            case "ADVANCED":
                                return EDifficulty.ADVANCED;
                            case "BASIC":
                            default:
                                return EDifficulty.BASIC;
                        }
                    })(),
                    level: chart.levelNum,
                    maxPlatinumScore: chart.data.maxPlatScore,
                };
            })(),
            combo: (() => {
                switch (score.scoreData.noteLamp) {
                    case "FULL COMBO":
                        return EComboTypes.FULL_COMBO;
                    case "ALL BREAK":
                        return EComboTypes.ALL_BREAK;
                    case "ALL BREAK+":
                        return EComboTypes.ALL_BREAK_PLUS;
                    default:
                        return EComboTypes.NONE;
                }
            })(),
            bell: (() => {
                switch (score.scoreData.bellLamp) {
                    case "FULL BELL":
                        return EBellTypes.FULL_BELL;
                    default:
                        return EBellTypes.NONE;
                }
            })(),
            score: score.scoreData.score,
            platinumScore: this.getPlatinumScore(score),
            rank: (() => {
                switch (score.scoreData.grade) {
                    case "C":
                        return EAchievementTypes.C;
                    case "B":
                        return EAchievementTypes.B;
                    case "BB":
                        return EAchievementTypes.BB;
                    case "BBB":
                        return EAchievementTypes.BBB;
                    case "A":
                        return EAchievementTypes.A;
                    case "AA":
                        return EAchievementTypes.AA;
                    case "AAA":
                        return EAchievementTypes.AAA;
                    case "S":
                        return EAchievementTypes.S;
                    case "SS":
                        return EAchievementTypes.SS;
                    case "SSS":
                        return EAchievementTypes.SSS;
                    case "SSS+":
                        return EAchievementTypes.SSSP;
                    case "D":
                    default:
                        return EAchievementTypes.D;
                }
            })(),
            rating: (() => {
                const RANK_RATING_ADJUSTMENT = {
                    "1010000": 2.0,
                    "1007500": 1.75,
                    "1000000": 1.25,
                    "990000": 0.75,
                    "970000": 0,
                    "900000": -4,
                    "800000": -6,
                };
                if (type == "classic") return score.calculatedData.rating;
                else return score.calculatedData.scoreRating;
                // else {
                //     let rating = 0,
                //         scoreNum = score.scoreData.score;

                //     if (scoreNum > 1007500) {
                //         rating +=
                //             ((scoreNum - 1007500) / 2500) *
                //                 (RANK_RATING_ADJUSTMENT["1010000"] -
                //                     RANK_RATING_ADJUSTMENT["1007500"]) +
                //             RANK_RATING_ADJUSTMENT["1007500"];
                //     } else if (scoreNum > 1000000) {
                //         rating +=
                //             ((scoreNum - 1000000) / 7500) *
                //                 (RANK_RATING_ADJUSTMENT["1007500"] -
                //                     RANK_RATING_ADJUSTMENT["1000000"]) +
                //             RANK_RATING_ADJUSTMENT["1000000"];
                //     } else if (scoreNum > 990000) {
                //         rating +=
                //             ((scoreNum - 990000) / 10000) *
                //                 (RANK_RATING_ADJUSTMENT["1000000"] -
                //                     RANK_RATING_ADJUSTMENT["990000"]) +
                //             RANK_RATING_ADJUSTMENT["990000"];
                //     } else if (scoreNum > 970000) {
                //         rating +=
                //             ((scoreNum - 970000) / 20000) *
                //             RANK_RATING_ADJUSTMENT["990000"];
                //     } else if (scoreNum > 900000) {
                //         rating +=
                //             (1 - (scoreNum - 900000) / 70000) *
                //             RANK_RATING_ADJUSTMENT["900000"];
                //     } else if (scoreNum > 800000) {
                //         rating +=
                //             (1 - (scoreNum - 800000) / 100000) *
                //                 (RANK_RATING_ADJUSTMENT["800000"] -
                //                     RANK_RATING_ADJUSTMENT["900000"]) +
                //             RANK_RATING_ADJUSTMENT["900000"];
                //     } else if (scoreNum > 500000) {
                //         rating *=
                //             ((scoreNum - 500000) / 300000) *
                //             (chart.levelNum + RANK_RATING_ADJUSTMENT["800000"]);
                //     } else rating = 0;

                //     switch (score.scoreData.noteLamp) {
                //         case "FULL COMBO":
                //             rating += 0.1;
                //             break;
                //         case "ALL BREAK":
                //             rating += 0.3;
                //             break;
                //         case "ALL BREAK+":
                //             rating += 0.35;
                //             break;
                //     }
                //     switch (score.scoreData.bellLamp) {
                //         case "FULL BELL":
                //             rating += 0.05;
                //             break;
                //     }
                //     switch (score.scoreData.grade) {
                //         case "SS":
                //             rating += 0.1;
                //         case "SSS":
                //             rating += 0.2;
                //         case "SSS+":
                //             rating += 0.3;
                //     }

                //     rating += chart.levelNum;
                //     return rating;
                // }
            })(),
        };
    }
    async getPlayerBest60(
        userId: string,
        currentVersion = this.CURRENT_VERSION
    ) {
        const rawPBs = await this.getPlayerPB(userId);
        if (!rawPBs?.body) return null;
        const pbs: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }[] = [];
        for (const pb of rawPBs.body.pbs) {
            let chart = rawPBs.body.charts.find((v) => v.chartID == pb.chartID);
            let song = rawPBs.body.songs.find((v) => v.id == pb.songID);
            if (chart && song && chart.levelNum > 0) {
                pbs.push({ pb, chart, song });
            }
        }
        const newScores = pbs.filter(
            (v) => v.chart.data.displayVersion == currentVersion
        );
        const oldScores = pbs.filter(
            (v) =>
                v.chart &&
                KamaiTachi.compareGameVersions(
                    currentVersion,
                    v.chart.data.displayVersion
                ) > 0
        );
        const bestScores = pbs.filter(
            (v) =>
                v.chart &&
                KamaiTachi.compareGameVersions(
                    currentVersion,
                    v.chart.data.displayVersion
                ) >= 0
        );
        return {
            new: newScores
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                .sort((a, b) =>
                    b.rating - a.rating
                        ? b.rating - a.rating
                        : b.score - a.score
                )
                .slice(0, 10),
            old: oldScores
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                .sort((a, b) =>
                    b.rating - a.rating
                        ? b.rating - a.rating
                        : b.score - a.score
                )
                .slice(0, 50),
            plat: bestScores
                .sort((a, b) => {
                    return (
                        // this.getPlatinumScoreRatio(b.chart, b.pb) -
                        //     this.getPlatinumScoreRatio(a.chart, a.pb) ||
                        b.pb.calculatedData.starRating -
                            a.pb.calculatedData.starRating ||
                        b.pb.calculatedData.scoreRating -
                            a.pb.calculatedData.scoreRating ||
                        // b.pb.calculatedData.rating -
                        //     a.pb.calculatedData.rating ||
                        b.pb.scoreData.score - a.pb.scoreData.score
                    );
                })
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                .slice(0, 50),
            best: bestScores
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                .sort((a, b) =>
                    b.rating - a.rating
                        ? b.rating - a.rating
                        : b.score - a.score
                )
                .slice(0, 60),
        };
    }
    async getPlayerBest55(
        userId: string,
        currentVersion = this.CURRENT_VERSION
    ) {
        const rawPBs = await this.getPlayerPB(userId);
        const rawRecents = await this.getPlayerRecentScores(userId);
        if (!rawPBs?.body || !rawRecents?.body) return null;
        const pbs: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }[] = [];
        const recents: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            scores: KamaiTachi.IScore;
        }[] = [];
        for (const pb of rawPBs.body.pbs) {
            let chart = rawPBs.body.charts.find((v) => v.chartID == pb.chartID);
            let song = rawPBs.body.songs.find((v) => v.id == pb.songID);
            if (chart && song && chart.levelNum > 0) {
                pbs.push({ pb, chart, song });
            }
        }
        for (const recent of rawRecents.body.scores) {
            let chart = rawRecents.body.charts.find(
                (v) => v.chartID == recent.chartID
            );
            let song = rawRecents.body.songs.find((v) => v.id == recent.songID);
            if (chart && song) {
                recents.push({ scores: recent, chart, song });
            }
        }
        const newScores = pbs.filter(
            (v) => v.chart.data.displayVersion == currentVersion
        );
        const oldScores = pbs.filter(
            (v) =>
                v.chart &&
                KamaiTachi.compareGameVersions(
                    currentVersion,
                    v.chart.data.displayVersion
                ) > 0
        );
        const recentScores = recents.filter(
            (v) =>
                v.chart &&
                KamaiTachi.compareGameVersions(
                    currentVersion,
                    v.chart.data.displayVersion
                ) >= 0
        );
        function ratingGuardSimulation(scores: IScore[]) {
            let r30: {
                score: IScore;
                order: number;
            }[] = [];
            for (let i = 0; i < scores.length; i++) {
                r30 = r30.sort((a, b) => a.order - b.order);
                const score = scores[i];
                // console.log(`#${i} ${score.chart.name} Rating: ${score.rating}`);
                if (r30.length < 30) {
                    // console.log(`Recents is not full, adding directly to recents.`);
                    r30.push({ score, order: i });
                } else {
                    switch (score.rank) {
                        case EAchievementTypes.SSS:
                        case EAchievementTypes.SSSP:
                            while (r30.length > 30) {
                                r30.shift();
                            }
                            // console.log(`SSS rating guard triggered.`);
                            if (r30.length >= 30) {
                                const best10 = r30
                                    .sort((a, b) =>
                                        a.score.rating == b.score.rating
                                            ? b.score.score - a.score.score
                                            : b.score.rating - a.score.rating
                                    )
                                    .slice(0, 10);
                                for (let j = 0; j < r30.length; ++j) {
                                    if (!best10.includes(r30[j])) {
                                        // console.log(`This score will replace: ${r30[j].score.chart.name}, rating: ${r30[j].score.rating}`);
                                        r30[j] = { score, order: i };
                                        break;
                                    }
                                }
                                break;
                            }
                        default:
                            // console.log(`Pushing to the end of recents.`);
                            r30.push({ score, order: i });
                            while (r30.length > 30) {
                                // console.log(`Removing the oldest score.`);
                                r30.shift();
                            }
                    }
                    // console.log("Current recents:");
                    // console.log(
                    //     r30.map(
                    //         (v) =>
                    //             `#${v.order} ${v.score.chart.name.slice(0, 4)} ${v.score.rating}`
                    //     )
                    // );
                }
            }
            return r30
                .sort((a, b) =>
                    a.score.rating == b.score.rating
                        ? b.score.score - a.score.score
                        : b.score.rating - a.score.rating
                )
                .slice(0, 10)
                .map((v) => v.score);
        }
        return {
            recent: ratingGuardSimulation(
                recentScores
                    .reverse()
                    .map((v) =>
                        this.toMaiDrawScore(
                            v.scores,
                            v.chart,
                            v.song,
                            "classic"
                        )
                    )
                    .filter((v) => v.chart.difficulty != EDifficulty.LUNATIC)
            ),
            new: newScores
                .sort((a, b) =>
                    b.pb.calculatedData.rating - a.pb.calculatedData.rating
                        ? b.pb.calculatedData.rating -
                          a.pb.calculatedData.rating
                        : b.pb.scoreData.score - a.pb.scoreData.score
                )
                .slice(0, 15)
                .map((v) =>
                    this.toMaiDrawScore(v.pb, v.chart, v.song, "classic")
                ),
            old: oldScores
                .sort((a, b) =>
                    b.pb.calculatedData.rating - a.pb.calculatedData.rating
                        ? b.pb.calculatedData.rating -
                          a.pb.calculatedData.rating
                        : b.pb.scoreData.score - a.pb.scoreData.score
                )
                .slice(0, 30)
                .map((v) =>
                    this.toMaiDrawScore(v.pb, v.chart, v.song, "classic")
                ),
            best: pbs
                .sort((a, b) =>
                    b.pb.calculatedData.rating - a.pb.calculatedData.rating
                        ? b.pb.calculatedData.rating -
                          a.pb.calculatedData.rating
                        : b.pb.scoreData.score - a.pb.scoreData.score
                )
                .slice(0, 45)
                .map((v) =>
                    this.toMaiDrawScore(v.pb, v.chart, v.song, "classic")
                ),
        };
    }
    async getPlayerInfo(userId: string, type: "refresh" | "classic") {
        const profile = await this.getPlayerProfileRaw(userId);
        if (type == "refresh") {
            const scores = await this.getPlayerBest60(userId);
            if (!profile?.body || !scores) return null;
            const newRating = scores.new
                .map((v) => Util.truncateNumber(v.rating / 5, 3))
                .reduce((sum, v) => sum + v, 0);
            const oldRating = scores.old
                .map((v) => v.rating)
                .reduce((sum, v) => sum + v, 0);
            const platRating = scores.plat
                .map((v) => {
                    const platinumScoreRatio =
                        v.platinumScore / v.chart.maxPlatinumScore;
                    let coefficient = 0;
                    if (platinumScoreRatio >= 0.98) coefficient = 5;
                    else if (platinumScoreRatio >= 0.97) coefficient = 4;
                    else if (platinumScoreRatio >= 0.96) coefficient = 3;
                    else if (platinumScoreRatio >= 0.95) coefficient = 2;
                    else if (platinumScoreRatio >= 0.94) coefficient = 1;
                    return (
                        Math.floor(
                            coefficient * v.chart.level * v.chart.level
                        ) / 1000
                    );
                })
                .reduce((sum, v) => sum + v, 0);
            return {
                name: profile?.body.username,
                rating:
                    Util.truncateNumber(newRating / 10, 3) +
                    Util.truncateNumber(oldRating / 50, 3) +
                    Util.truncateNumber(platRating / 50, 3),
            };
        } else if (type == "classic") {
            const scores = await this.getPlayerBest55(userId);
            if (!profile?.body || !scores) return null;
            let rating = 0;
            [...scores.recent, ...scores.new, ...scores.old].forEach(
                (v) => (rating += v.rating)
            );
            return {
                name: profile?.body.username,
                rating: rating / 55,
            };
        } else return null;
    }
    private async getPlayerProfileRaw(userId: string) {
        return this.get<
            KamaiTachi.IResponse<{
                username: string;
                id: number;
                about: string;
            }>
        >(`/api/v1/users/${userId}`);
    }
    async getPlayerProfilePicture(userId: string) {
        return (
            (await this.get<Buffer>(
                `/api/v1/users/${userId}/pfp`,
                undefined,
                2 * 60 * 60 * 1000,
                { responseType: "arraybuffer" }
            )) || null
        );
    }
    public ongeki() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.ONGEKI,
        });
    }
    public plus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.ONGEKI_PLUS,
        });
    }
    public summer() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.SUMMER,
        });
    }
    public summerPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.SUMMER_PLUS,
        });
    }
    public red() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.RED,
        });
    }
    public redPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.RED_PLUS,
        });
    }
    public bright() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.BRIGHT,
        });
    }
    public brightMemoryAct1() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.BRIGHT_MEMORY_ACT_1,
        });
    }
    public brightMemoryAct2() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.BRIGHT_MEMORY_ACT_2,
        });
    }
    public brightMemoryAct3() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.BRIGHT_MEMORY_ACT_3,
        });
    }
    public refresh() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.REFRESH,
        });
    }
}

export namespace KamaiTachi {
    export interface IResponse<T> {
        success: boolean;
        description: string;
        body: T;
    }
    export interface IChart {
        chartID: string;
        data: {
            inGameID: number;
            displayVersion: EGameVersions;
            chartViewURL: string;
            maxPlatScore: number;
        };
        difficulty: string;
        isPrimary: boolean;
        level: string;
        levelNum: number;
        playtype: string;
        songID: number;
        versions: string[];
    }
    export interface ISong {
        altTitles: string[];
        artist: string;
        data: {
            genre: string;
        };
        id: number;
        searchTerms: string[];
        title: string;
    }
    export interface IScore {
        chartID: string;
        userID: number;
        comment: string | null;
        importType: string;
        calculatedData: {
            rating: number;
            scoreRating: number;
            starRating: number;
        };
        game: string;
        highlight: boolean;
        isPrimary: boolean;
        playtype: string;
        scoreData: {
            score: number;
            noteLamp: string;
            bellLamp: string;
            platinumScore: number;
            platinumStars: number;
            judgements: {
                cbreak: number;
                break: number;
                hit: number;
                miss: number;
            };
            optional: {
                bellCount?: number;
                bellGraph?: number[];
                damage?: number;
                lifeGraph: number[];
                fast?: number;
                slow?: number;
                platScore?: number;
                scoreGraph: number[];
                totalBellCount?: number;
                enumIndexes: {
                    lamp?: number;
                    grade?: number;
                };
            };
            grade: string;
            enumIndexes: {
                noteLamp: number;
                bellLamp: number;
                grade: number;
            };
        };
        songID: number;
        scoreID: string;
        scoreMeta: any;
        timeAdded: number;
        timeAchieved: number;
        service: string;
    }
    export interface IPb {
        chartID: string;
        userID: number;
        calculatedData: {
            rating: number;
            scoreRating: number;
            starRating: number;
        };
        game: string;
        highlight: boolean;
        isPrimary: boolean;
        playtype: string;
        rankingData: {
            rank: number;
            outOf: number;
            rivalRank: number | null;
        };
        scoreData: {
            score: number;
            noteLamp: string;
            bellLamp: string;
            platinumScore: number;
            platinumStars: number;
            judgements: {
                cbreak: number;
                break: number;
                hit: number;
                miss: number;
            };
            optional: {
                bellCount?: number;
                damage?: number;
                fast?: number;
                slow?: number;
                platScore?: number;
                totalBellCount?: number;
                enumIndexes: {
                    lamp?: number;
                    grade?: number;
                };
            };
            grade: string;
            enumIndexes: {
                noteLamp: number;
                bellLamp: number;
                grade: number;
            };
        };
        songID: number;
        timeAchieved: number;
        composedFrom: {
            name: string;
            scoreID: string;
        }[];
    }

    export enum EGameVersions {
        REFRESH = "オンゲキ Re:Fresh",
        BRIGHT_MEMORY_ACT_3 = "オンゲキ bright MEMORY Act.3",
        BRIGHT_MEMORY_ACT_2 = "オンゲキ bright MEMORY Act.2",
        BRIGHT_MEMORY_ACT_1 = "オンゲキ bright MEMORY Act.1",
        BRIGHT = "オンゲキ bright",
        RED_PLUS = "オンゲキ R.E.D. PLUS",
        RED = "オンゲキ R.E.D.",
        SUMMER_PLUS = "オンゲキ SUMMER PLUS",
        SUMMER = "オンゲキ SUMMER",
        ONGEKI_PLUS = "オンゲキ PLUS",
        ONGEKI = "オンゲキ",
    }
    const GameVersions = [
        EGameVersions.REFRESH,
        EGameVersions.BRIGHT_MEMORY_ACT_3,
        EGameVersions.BRIGHT_MEMORY_ACT_2,
        EGameVersions.BRIGHT_MEMORY_ACT_1,
        EGameVersions.BRIGHT,
        EGameVersions.RED_PLUS,
        EGameVersions.RED,
        EGameVersions.SUMMER_PLUS,
        EGameVersions.SUMMER,
        EGameVersions.ONGEKI_PLUS,
        EGameVersions.ONGEKI,
    ];
    /**
     * Compare two game versions and calculate which is newer.
     *
     * @param a Game version.
     * @param b Game version.
     * @returns positive if a is newer, negative if b is newer, 0 if they are the same.
     */
    export function compareGameVersions(
        a: EGameVersions,
        b: EGameVersions
    ): number {
        if (!GameVersions.includes(a)) return -1;
        if (!GameVersions.includes(b)) return 1;
        if (a == b) return 0;
        return GameVersions.indexOf(b) - GameVersions.indexOf(a);
    }
}
