import {
    EAchievementTypes,
    EBellTypes,
    EComboTypes,
    EDifficulty,
    IScore,
} from "@maidraw/geki/type";
import { OngekiScoreAdapter } from "..";
import { Util } from "@maidraw/lib/util";
import { OngekiUtil } from "../../util";
import { Database } from "../../database";

type IBest55ResponseData = {
    "invalid-user": {
        username: string;
    };
};
type IBest60ResponseData = IBest55ResponseData & {};
type IProfileResponseData = IBest55ResponseData & {
    "invalid-type": {
        type: string;
    };
};
type IProfilePictureResponseData = IBest55ResponseData & {};
type IScoreResponseData = IBest55ResponseData & {};
type IResponseData = {
    best55: IBest55ResponseData;
    best60: IBest60ResponseData;
    profile: IProfileResponseData;
    profilePicture: IProfilePictureResponseData;
    score: IScoreResponseData;
};

export class KamaiTachi extends OngekiScoreAdapter<IResponseData> {
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

    async getPlayerScore(username: string, chartId: number) {
        const rawPBs = await this.getPlayerPB(username);
        if (!rawPBs) {
            const res = {
                status: "unknown",
                message: "An unknown error occurred.",
                data: null,
            } as const;
            return res;
        }
        if (!rawPBs.success) {
            if (rawPBs.description.includes("does not exist")) {
                const res = {
                    status: "invalid-user",
                    message:
                        rawPBs.description ||
                        `${username} is not a valid user.`,
                    data: { username },
                } as const;
                return res;
            } else {
                const res = {
                    status: "unknown",
                    message: "An unknown error occurred: " + rawPBs.description,
                    data: null,
                } as const;
                return res;
            }
        }
        const pbs: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }[] = [];
        for (const pb of rawPBs.body.pbs) {
            let chart = rawPBs.body.charts.find((v) => v.chartID == pb.chartID);
            let song = rawPBs.body.songs.find((v) => v.id == pb.songID);
            if (chart && song) {
                pbs.push({ pb, chart, song });
            }
        }
        function difficultyCompare(payload: KamaiTachi.IChart, target: string) {
            return payload.difficulty.toLowerCase() == target.toLowerCase();
        }
        const basic = pbs.find(
            (v) =>
                difficultyCompare(v.chart, "Basic") &&
                v.chart.data.inGameID == chartId
        );
        const advanced = pbs.find(
            (v) =>
                difficultyCompare(v.chart, "Advanced") &&
                v.chart.data.inGameID == chartId
        );
        const expert = pbs.find(
            (v) =>
                difficultyCompare(v.chart, "Expert") &&
                v.chart.data.inGameID == chartId
        );
        const master = pbs.find(
            (v) =>
                difficultyCompare(v.chart, "Master") &&
                v.chart.data.inGameID == chartId
        );
        const lunatic = pbs.find(
            (v) =>
                difficultyCompare(v.chart, "Lunatic") &&
                v.chart.data.inGameID == chartId
        );
        const res = {
            status: "success",
            message: "",
            data: {
                basic: basic
                    ? this.toMaiDrawScore(basic.pb, basic.chart, basic.song)
                    : null,
                advanced: advanced
                    ? this.toMaiDrawScore(
                          advanced.pb,
                          advanced.chart,
                          advanced.song
                      )
                    : null,
                expert: expert
                    ? this.toMaiDrawScore(expert.pb, expert.chart, expert.song)
                    : null,
                master: master
                    ? this.toMaiDrawScore(master.pb, master.chart, master.song)
                    : null,
                lunatic: lunatic
                    ? this.toMaiDrawScore(
                          lunatic.pb,
                          lunatic.chart,
                          lunatic.song
                      )
                    : null,
            },
        } as const;
        return res;
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
    private getDatabaseDifficulty(chart: KamaiTachi.IChart) {
        switch (true) {
            case chart.difficulty.toUpperCase().includes("LUNATIC"):
                return EDifficulty.LUNATIC;
            case chart.difficulty.toUpperCase().includes("MASTER"):
                return EDifficulty.MASTER;
            case chart.difficulty.toUpperCase().includes("EXPERT"):
                return EDifficulty.EXPERT;
            case chart.difficulty.toUpperCase().includes("ADVANCED"):
                return EDifficulty.ADVANCED;
            case chart.difficulty.toUpperCase().includes("BASIC"):
            default:
                return EDifficulty.BASIC;
        }
    }
    private toMaiDrawScore(
        score: KamaiTachi.IPb | KamaiTachi.IScore,
        chart: KamaiTachi.IChart,
        song: KamaiTachi.ISong,
        type: "refresh" | "classic" = "refresh"
    ): IScore {
        const localChart = Database.getLocalChart(
            chart.data.inGameID,
            this.getDatabaseDifficulty(chart)
        );
        const internalLevel =
            localChart?.events
                .filter((v) => v.type === "existence")
                .find((v) => v.version.name == this.CURRENT_VERSION)?.data
                .level ?? chart.levelNum;
        const combo = (() => {
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
        })();
        const bell = (() => {
            switch (score.scoreData.bellLamp) {
                case "FULL BELL":
                    return EBellTypes.FULL_BELL;
                default:
                    return EBellTypes.NONE;
            }
        })();
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
                    level: internalLevel,
                    maxPlatinumScore: chart.data.maxPlatScore,
                };
            })(),
            combo,
            bell,
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
                if (type == "classic")
                    return OngekiUtil.calculateScoreRating(
                        internalLevel,
                        score.scoreData.score
                    );
                else
                    return OngekiUtil.calculateReFreshScoreRating(
                        internalLevel,
                        score.scoreData.score,
                        bell,
                        combo
                    );
                // if (type == "classic") return score.calculatedData.rating;
                // else return score.calculatedData.scoreRating;
            })(),
            starRating: (() => {
                if (score.scoreData.platinumStars)
                    return OngekiUtil.calculateReFreshStarRating(
                        internalLevel,
                        score.scoreData.platinumStars
                    );
                else return 0;
            })(),
        };
    }
    async getPlayerBest60(
        username: string,
        currentVersion = this.CURRENT_VERSION
    ) {
        const rawPBs = await this.getPlayerPB(username);
        if (!rawPBs) {
            const res = {
                status: "unknown",
                message: "An unknown error occurred.",
                data: null,
            } as const;
            return res;
        }
        if (!rawPBs.success) {
            if (rawPBs.description.includes("does not exist")) {
                const res = {
                    status: "invalid-user",
                    message:
                        rawPBs.description ||
                        `${username} is not a valid user.`,
                    data: { username },
                } as const;
                return res;
            } else {
                const res = {
                    status: "unknown",
                    message: "An unknown error occurred: " + rawPBs.description,
                    data: null,
                } as const;
                return res;
            }
        }
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
        const res = {
            status: "success",
            message: "",
            data: {
                new: newScores
                    .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                    .sort((a, b) => b.rating - a.rating || b.score - a.score)
                    .slice(0, 10),
                old: oldScores
                    .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                    .sort((a, b) => b.rating - a.rating || b.score - a.score)
                    .slice(0, 50),
                plat: bestScores
                    .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                    .sort(
                        (a, b) =>
                            b.starRating - a.starRating || b.score - a.score
                    )
                    .filter((v) => v.starRating > 0)
                    .slice(0, 50),
                best: bestScores
                    .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                    .sort((a, b) => b.rating - a.rating || b.score - a.score)
                    .slice(0, 60),
            },
        } as const;
        return res;
    }
    async getPlayerBest55(
        username: string,
        currentVersion = this.CURRENT_VERSION
    ) {
        const rawPBs = await this.getPlayerPB(username);
        if (!rawPBs) {
            const res = {
                status: "unknown",
                message: "An unknown error occurred.",
                data: null,
            } as const;
            return res;
        }
        if (!rawPBs.success) {
            if (rawPBs.description.includes("does not exist")) {
                const res = {
                    status: "invalid-user",
                    message:
                        rawPBs.description ||
                        `${username} is not a valid user.`,
                    data: { username },
                } as const;
                return res;
            } else {
                const res = {
                    status: "unknown",
                    message: "An unknown error occurred: " + rawPBs.description,
                    data: null,
                } as const;
                return res;
            }
        }
        const rawRecents = await this.getPlayerRecentScores(username);
        if (!rawRecents) {
            const res = {
                status: "unknown",
                message: "An unknown error occurred.",
                data: null,
            } as const;
            return res;
        }
        if (!rawRecents.success) {
            if (rawRecents.description.includes("does not exist")) {
                const res = {
                    status: "invalid-user",
                    message:
                        rawRecents.description ||
                        `${username} is not a valid user.`,
                    data: { username },
                } as const;
                return res;
            } else {
                const res = {
                    status: "unknown",
                    message:
                        "An unknown error occurred: " + rawRecents.description,
                    data: null,
                } as const;
                return res;
            }
        }
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
        const res = {
            status: "success",
            message: "",
            data: {
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
                        .filter(
                            (v) => v.chart.difficulty != EDifficulty.LUNATIC
                        )
                ),
                new: newScores
                    .map((v) =>
                        this.toMaiDrawScore(v.pb, v.chart, v.song, "classic")
                    )
                    .sort((a, b) => b.rating - a.rating || b.score - a.score)
                    .slice(0, 15),
                old: oldScores
                    .map((v) =>
                        this.toMaiDrawScore(v.pb, v.chart, v.song, "classic")
                    )
                    .sort((a, b) => b.rating - a.rating || b.score - a.score)
                    .slice(0, 30),
                best: pbs
                    .map((v) =>
                        this.toMaiDrawScore(v.pb, v.chart, v.song, "classic")
                    )
                    .sort((a, b) => b.rating - a.rating || b.score - a.score)
                    .slice(0, 45),
            },
        } as const;
        return res;
    }
    async getPlayerInfo(userId: string, type: "refresh" | "classic") {
        const profile = await this.getPlayerProfileRaw(userId);
        if (!profile) {
            const res = {
                status: "unknown",
                message: "An unknown error occurred.",
                data: null,
            } as const;
            return res;
        }
        if (!profile.success) {
            if (profile.description.includes("does not exist")) {
                const res = {
                    status: "invalid-user",
                    message:
                        profile.description || `${userId} is not a valid user.`,
                    data: { username: userId },
                } as const;
                return res;
            } else {
                const res = {
                    status: "unknown",
                    message:
                        "An unknown error occurred: " + profile.description,
                    data: null,
                } as const;
                return res;
            }
        }
        if (type == "refresh") {
            const scores = await this.getPlayerBest60(userId);
            if (!(scores.status == "success")) return scores;
            const newRating = scores.data.new
                .map((v) => Util.truncateNumber(v.rating / 5, 3))
                .reduce((sum, v) => sum + v, 0);
            const oldRating = scores.data.old
                .map((v) => v.rating)
                .reduce((sum, v) => sum + v, 0);
            const platRating = scores.data.plat
                .map((v) => v.starRating)
                .reduce((sum, v) => sum + v, 0);
            const res = {
                status: "success",
                message: "",
                data: {
                    name: profile?.body.username,
                    rating:
                        Util.truncateNumber(newRating / 10, 3) +
                        Util.truncateNumber(oldRating / 50, 3) +
                        Util.truncateNumber(platRating / 50, 3),
                },
            } as const;
            return res;
        } else if (type == "classic") {
            const scores = await this.getPlayerBest55(userId);
            if (!(scores.status == "success")) return scores;
            let rating = 0;
            [
                ...scores.data.recent,
                ...scores.data.new,
                ...scores.data.old,
            ].forEach((v) => (rating += v.rating));
            const res = {
                status: "success",
                message: "",
                data: {
                    name: profile?.body.username,
                    rating: Util.truncateNumber(rating / 55, 2),
                },
            } as const;
            return res;
        } else {
            const res = {
                status: "invalid-type",
                message: `${type} is not a valid type.` as string,
                data: { type: type as string },
            } as const;
            return res;
        }
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
        const pfp =
            (await this.get<Buffer>(
                `/api/v1/users/${userId}/pfp`,
                undefined,
                2 * 60 * 60 * 1000,
                { responseType: "arraybuffer" }
            )) || null;
        if (!pfp) {
            const res = {
                status: "unknown",
                message: "An unknown error occurred.",
                data: null,
            } as const;
            return res;
        }
        function isFailureResponse(
            payload: any
        ): payload is KamaiTachi.IFailureResponse {
            return (
                typeof payload.success === "boolean" &&
                payload.success === false &&
                typeof payload.description === "string"
            );
        }
        if (isFailureResponse(pfp)) {
            if (pfp.description.includes("does not exist")) {
                const res = {
                    status: "invalid-user",
                    message:
                        pfp.description || `${userId} is not a valid user.`,
                    data: { username: userId },
                } as const;
                return res;
            } else {
                const res = {
                    status: "unknown",
                    message: "An unknown error occurred: " + pfp.description,
                    data: null,
                } as const;
                return res;
            }
        }
        const res = {
            status: "success",
            message: "",
            data: pfp,
        } as const;
        return res;
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
    interface IBaseResponse {
        success: boolean;
        description: string;
    }
    export interface ISuccessResponse<T> extends IBaseResponse {
        success: true;
        description: string;
        body: T;
    }
    export interface IFailureResponse extends IBaseResponse {
        success: false;
        description: string;
    }
    export type IResponse<T> = ISuccessResponse<T> | IFailureResponse;
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
