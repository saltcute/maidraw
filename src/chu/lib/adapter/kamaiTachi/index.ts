import { ChunithmScoreAdapter } from "..";
import { Database } from "../../database";
import { ChunithmUtil } from "../../util";

import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    IScore,
} from "@maidraw/chu/type";

type IBest50ResponseData = {
    "invalid-user": {
        username: string;
    };
};
type IRecent40ResponseData = IBest50ResponseData & {};
type IProfileResponseData = IBest50ResponseData & {
    "invalid-type": {
        type: string;
    };
};
type IProfilePictureResponseData = IBest50ResponseData & {};
type IScoreResponseData = IBest50ResponseData & {};
type IResponseData = {
    recent40: IRecent40ResponseData;
    best50: IBest50ResponseData;
    profile: IProfileResponseData;
    profilePicture: IProfilePictureResponseData;
    score: IScoreResponseData;
};

export class KamaiTachi extends ChunithmScoreAdapter<IResponseData> {
    private readonly CURRENT_VERSION: KamaiTachi.EGameVersions;
    constructor({
        baseURL = "https://kamai.tachi.ac/",
        currentVersion = KamaiTachi.EGameVersions.CHUNITHM_VERSE,
    }: {
        baseURL?: string;
        currentVersion?: KamaiTachi.EGameVersions;
    } = {}) {
        super({ baseURL, name: ["maidraw", "adapter", "chunithm", "kamai"] });
        this.CURRENT_VERSION = currentVersion;
    }
    async getPlayerScore(username: string, chartId: number) {
        const rawPBs = await this.getPlayerPB(username);
        if (!rawPBs) {
            const res = {
                status: "unknown",
                message: "An unknown error occurred",
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
        const ultima = pbs.find(
            (v) =>
                difficultyCompare(v.chart, "Ultima") &&
                v.chart.data.inGameID == chartId
        );
        const worldsEnd = pbs.find(
            (v) =>
                difficultyCompare(v.chart, "World's End") &&
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
                ultima: ultima
                    ? this.toMaiDrawScore(ultima.pb, ultima.chart, ultima.song)
                    : null,
                worldsEnd: worldsEnd
                    ? this.toMaiDrawScore(
                          worldsEnd.pb,
                          worldsEnd.chart,
                          worldsEnd.song
                      )
                    : null,
            },
        } as const;
        return res;
    }

    async getPlayerPB(userId: string) {
        return this.get<
            KamaiTachi.IResponse<{
                charts: KamaiTachi.IChart[];
                pbs: KamaiTachi.IPb[];
                songs: KamaiTachi.ISong[];
            }>
        >(
            `/api/v1/users/${userId}/games/chunithm/Single/pbs/all`,
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
            `/api/v1/users/${userId}/games/chunithm/Single/scores/recent`,
            undefined,
            60 * 1000
        );
    }
    private getDatabaseDifficulty(chart: KamaiTachi.IChart) {
        switch (true) {
            case chart.difficulty.toUpperCase().includes("ULTIMA"):
                return EDifficulty.ULTIMA;
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
    private getKamaiVersion(version: string) {
        switch (version) {
            case "CHUNITHM":
                return KamaiTachi.EGameVersions.CHUNITHM;
            case "CHUNITHM PLUS":
                return KamaiTachi.EGameVersions.CHUNITHM_PLUS;
            case "CHUNITHM AIR":
                return KamaiTachi.EGameVersions.CHUNITHM_AIR;
            case "CHUNITHM AIR PLUS":
                return KamaiTachi.EGameVersions.CHUNITHM_AIR_PLUS;
            case "CHUNITHM STAR":
                return KamaiTachi.EGameVersions.CHUNITHM_STAR;
            case "CHUNITHM STAR PLUS":
                return KamaiTachi.EGameVersions.CHUNITHM_STAR_PLUS;
            case "CHUNITHM AMAZON":
                return KamaiTachi.EGameVersions.CHUNITHM_AMAZON;
            case "CHUNITHM AMAZON PLUS":
                return KamaiTachi.EGameVersions.CHUNITHM_AMAZON_PLUS;
            case "CHUNITHM CRYSTAL":
                return KamaiTachi.EGameVersions.CHUNITHM_CRYSTAL;
            case "CHUNITHM CRYSTAL PLUS":
                return KamaiTachi.EGameVersions.CHUNITHM_CRYSTAL_PLUS;
            case "CHUNITHM PARADISE":
                return KamaiTachi.EGameVersions.CHUNITHM_PARADISE;
            case "CHUNITHM PARADISE LOST":
                return KamaiTachi.EGameVersions.CHUNITHM_PARADISE_LOST;
            case "CHUNITHM NEW!!":
                return KamaiTachi.EGameVersions.CHUNITHM_NEW;
            case "CHUNITHM NEW PLUS!!":
                return KamaiTachi.EGameVersions.CHUNITHM_NEW_PLUS;
            case "CHUNITHM SUN":
                return KamaiTachi.EGameVersions.CHUNITHM_SUN;
            case "CHUNITHM SUN PLUS":
                return KamaiTachi.EGameVersions.CHUNITHM_SUN_PLUS;
            case "CHUNITHM LUMINOUS":
                return KamaiTachi.EGameVersions.CHUNITHM_LUMINOUS;
            case "CHUNITHM LUMINOUS PLUS":
                return KamaiTachi.EGameVersions.CHUNITHM_LUMINOUS_PLUS;
            case "CHUNITHM VERSE":
                return KamaiTachi.EGameVersions.CHUNITHM_VERSE;
            default:
                return null;
        }
    }
    private toMaiDrawScore(
        score: KamaiTachi.IPb | KamaiTachi.IScore,
        chart: KamaiTachi.IChart,
        song: KamaiTachi.ISong
    ): IScore {
        const localChart = Database.getLocalChart(
            chart.data.inGameID,
            this.getDatabaseDifficulty(chart)
        );
        const internalLevel =
            localChart?.events
                .filter((v) => v.type === "existence")
                .find((v) => {
                    if (
                        this.CURRENT_VERSION ===
                            KamaiTachi.EGameVersions.CHUNITHM_PARADISE ||
                        this.CURRENT_VERSION ===
                            KamaiTachi.EGameVersions.CHUNITHM_PARADISE_LOST
                    ) {
                        return (
                            v.version.name ===
                                KamaiTachi.EGameVersions.CHUNITHM_PARADISE ||
                            v.version.name ===
                                KamaiTachi.EGameVersions.CHUNITHM_PARADISE_LOST
                        );
                    } else return v.version.name === this.CURRENT_VERSION;
                })?.data.level ?? chart.levelNum;
        return {
            chart: (() => {
                return {
                    id: chart.data.inGameID,
                    name: song.title,
                    difficulty: (() => {
                        switch (chart.difficulty) {
                            case "ULTIMA":
                                return EDifficulty.ULTIMA;
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
                };
            })(),
            combo: (() => {
                switch (score.scoreData.noteLamp) {
                    case "FULL COMBO":
                        return EComboTypes.FULL_COMBO;
                    case "ALL JUSTICE":
                        return EComboTypes.ALL_JUSTICE;
                    case "ALL JUSTICE CRITIAL":
                        return EComboTypes.ALL_JUSTICE_CRITICAL;
                    default:
                        return EComboTypes.NONE;
                }
            })(),
            score: score.scoreData.score,
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
                    case "S+":
                        return EAchievementTypes.SP;
                    case "SS":
                        return EAchievementTypes.SS;
                    case "SS+":
                        return EAchievementTypes.SSP;
                    case "SSS":
                        return EAchievementTypes.SSS;
                    case "SSS+":
                        return EAchievementTypes.SSSP;
                    case "D":
                    default:
                        return EAchievementTypes.D;
                }
            })(),
            rating:
                KamaiTachi.compareGameVersions(
                    this.CURRENT_VERSION,
                    KamaiTachi.EGameVersions.CHUNITHM_NEW
                ) >= 0
                    ? ChunithmUtil.calculateRating(
                          internalLevel,
                          score.scoreData.score
                      )
                    : ChunithmUtil.calculatePLostRating(
                          internalLevel,
                          score.scoreData.score
                      ),
        };
    }
    private getDatabaseVersion(
        kchart: KamaiTachi.IChart
    ): KamaiTachi.EGameVersions | null {
        if (!Database.hasLocalDatabase()) return null;
        const diff = this.getDatabaseDifficulty(kchart);
        const chart = Database.getLocalChart(kchart.data.inGameID, diff);
        if (chart) {
            if (diff === EDifficulty.ULTIMA) {
                const addVersion = chart.events.find(
                    (v) => v.type == "existence" && v.version.region == "JPN"
                )?.version;
                if (addVersion) {
                    return this.getKamaiVersion(addVersion?.name);
                }
            } else {
                return this.getKamaiVersion(chart.addVersion.name);
            }
        }
        return null;
    }
    async getPlayerBest50(
        userId: string,
        currentVersion = this.CURRENT_VERSION,
        omnimix = true
    ) {
        const rawPBs = await this.getPlayerPB(userId);
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
                        rawPBs.description || `${userId} is not a valid user.`,
                    data: { username: userId },
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
        const newScores = pbs.filter(
            (v) => v.song.data.displayVersion == currentVersion
        );
        const oldScores = pbs.filter((v) => {
            const diff = this.getDatabaseDifficulty(v.chart);
            const version =
                (diff == EDifficulty.ULTIMA
                    ? this.getDatabaseVersion(v.chart)
                    : null) ?? v.song.data.displayVersion;
            return (
                KamaiTachi.compareGameVersions(currentVersion, version) > 0 &&
                (omnimix ||
                    !(
                        v.chart.versions[0].includes("-omni") &&
                        v.chart.versions[1].includes("-omni")
                    ))
            );
        });
        const res = {
            status: "success",
            message: "",
            data: {
                new: newScores
                    .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                    .sort((a, b) =>
                        b.rating - a.rating
                            ? b.rating - a.rating
                            : b.score - a.score
                    )
                    .slice(0, 20),
                old: oldScores
                    .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                    .sort((a, b) =>
                        b.rating - a.rating
                            ? b.rating - a.rating
                            : b.score - a.score
                    )
                    .slice(0, 30),
                best: pbs
                    .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                    .sort((a, b) =>
                        b.rating - a.rating
                            ? b.rating - a.rating
                            : b.score - a.score
                    )
                    .slice(0, 50),
            },
        } as const;
        return res;
    }
    async getPlayerRecent40(
        userId: string,
        currentVersion = this.CURRENT_VERSION,
        omnimix = true
    ) {
        const rawPBs = await this.getPlayerPB(userId);
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
                        rawPBs.description || `${userId} is not a valid user.`,
                    data: { username: userId },
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
        const rawRecents = await this.getPlayerRecentScores(userId);
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
                        rawPBs.description || `${userId} is not a valid user.`,
                    data: { username: userId },
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
        const recents: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            scores: KamaiTachi.IScore;
        }[] = [];
        for (const pb of rawPBs.body.pbs) {
            let chart = rawPBs.body.charts.find((v) => v.chartID == pb.chartID);
            let song = rawPBs.body.songs.find((v) => v.id == pb.songID);
            if (chart && song) {
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
        const bestScores = pbs.filter((v) => {
            const diff = this.getDatabaseDifficulty(v.chart);
            const version =
                (diff == EDifficulty.ULTIMA
                    ? this.getDatabaseVersion(v.chart)
                    : null) ?? v.song.data.displayVersion;
            return (
                KamaiTachi.compareGameVersions(currentVersion, version) >= 0 &&
                (omnimix ||
                    !(
                        v.chart.versions[0].includes("-omni") &&
                        v.chart.versions[1].includes("-omni")
                    ))
            );
        });
        const recentScores = recents.filter((v) => {
            const diff = this.getDatabaseDifficulty(v.chart);
            const version =
                (diff == EDifficulty.ULTIMA
                    ? this.getDatabaseVersion(v.chart)
                    : null) ?? v.song.data.displayVersion;
            return (
                KamaiTachi.compareGameVersions(currentVersion, version) >= 0 &&
                (omnimix ||
                    !(
                        v.chart.versions[0].includes("-omni") &&
                        v.chart.versions[1].includes("-omni")
                    ))
            );
        });
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
                            this.toMaiDrawScore(v.scores, v.chart, v.song)
                        )
                ),
                best: bestScores
                    .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                    .sort((a, b) => b.rating - a.rating || b.score - a.score)
                    .slice(0, 50),
            },
        } as const;
        return res;
    }
    async getPlayerInfo(userId: string, type: "new" | "recents") {
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
        if (type == "new") {
            const scores = await this.getPlayerBest50(userId);
            if (!(scores.status == "success")) return scores;
            let rating = 0;
            [
                ...scores.data.new.slice(0, 20),
                ...scores.data.old.slice(0, 30),
            ].forEach((v) => (rating += v.rating));
            const res = {
                status: "success",
                message: "",
                data: {
                    name: profile?.body.username,
                    rating: rating / 50,
                },
            } as const;
            return res;
        } else if (type == "recents") {
            const scores = await this.getPlayerRecent40(userId);
            if (!(scores.status == "success")) return scores;
            let rating = 0;
            [
                ...scores.data.recent.slice(0, 10),
                ...scores.data.best.slice(0, 30),
            ].forEach((v) => (rating += v.rating));
            const res = {
                status: "success",
                message: "",
                data: {
                    name: profile?.body.username,
                    rating: rating / 40,
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
    public chunithm() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM,
        });
    }
    public plus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_PLUS,
        });
    }
    public air() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_AIR,
        });
    }
    public airPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_AIR_PLUS,
        });
    }
    public star() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_STAR,
        });
    }
    public starPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_STAR_PLUS,
        });
    }
    public amazon() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_AMAZON,
        });
    }
    public amazonPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_AMAZON_PLUS,
        });
    }
    public crystal() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_CRYSTAL,
        });
    }
    public crystalPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_CRYSTAL_PLUS,
        });
    }
    public superstar() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_SUPERSTAR,
        });
    }
    public paradise() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_PARADISE,
        });
    }
    public paradiseLost() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_PARADISE_LOST,
        });
    }
    public superstarPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_SUPERSTAR_PLUS,
        });
    }
    public new() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_NEW,
        });
    }
    public newPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_NEW_PLUS,
        });
    }
    public sun() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_SUN,
        });
    }
    public sunPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_SUN_PLUS,
        });
    }
    public luminous() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_LUMINOUS,
        });
    }
    public luminousPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_LUMINOUS_PLUS,
        });
    }
    public verse() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_VERSE,
        });
    }
    public xverse() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.CHUNITHM_XVERSE,
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
            displayVersion: EGameVersions;
            genre: string;
        };
        id: number;
        searchTerms: string[];
        title: string;
    }
    export interface IScore {
        chartID: string;
        userID: number;
        calculatedData: {
            rating: number;
        };
        game: string;
        highlight: boolean;
        isPrimary: boolean;
        playtype: string;
        scoreData: {
            score: number;
            noteLamp: string;
            clearLamp: string;
            judgements: {
                jcrit: number;
                justice: number;
                attack: number;
                miss: number;
            };
            optional: {
                fast?: number;
                slow?: number;
                maxCombo?: number;
                enumIndexes: {
                    lamp?: number;
                    grade?: number;
                };
            };
            grade: string;
            enumIndexes: {
                noteLamp: number;
                clearLamp: number;
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
            clearLamp: string;
            judgements: {
                jcrit: number;
                justice: number;
                attack: number;
                miss: number;
            };
            optional: {
                fast?: number;
                slow?: number;
                maxCombo?: number;
                enumIndexes: {
                    lamp?: number;
                    grade?: number;
                };
            };
            grade: string;
            enumIndexes: {
                noteLamp: number;
                clearLamp: number;
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
        CHUNITHM_XVERSE = "CHUNITHM X-VERSE",
        CHUNITHM_VERSE = "CHUNITHM VERSE",
        CHUNITHM_LUMINOUS_PLUS = "CHUNITHM LUMINOUS PLUS",
        CHUNITHM_LUMINOUS = "CHUNITHM LUMINOUS",
        CHUNITHM_SUN_PLUS = "CHUNITHM SUN PLUS",
        CHUNITHM_SUN = "CHUNITHM SUN",
        CHUNITHM_NEW_PLUS = "CHUNITHM NEW PLUS",
        CHUNITHM_NEW = "CHUNITHM NEW",
        CHUNITHM_SUPERSTAR_PLUS = "CHUNITHM SUPER STAR PLUS",
        CHUNITHM_PARADISE_LOST = "CHUNITHM PARADISE LOST",
        CHUNITHM_PARADISE = "CHUNITHM PARADISE",
        CHUNITHM_SUPERSTAR = "CHUNITHM SUPERSTAR",
        CHUNITHM_CRYSTAL_PLUS = "CHUNITHM CRYSTAL PLUS",
        CHUNITHM_CRYSTAL = "CHUNITHM CRYSTAL",
        CHUNITHM_AMAZON_PLUS = "CHUNITHM AMAZON PLUS",
        CHUNITHM_AMAZON = "CHUNITHM AMAZON",
        CHUNITHM_STAR_PLUS = "CHUNITHM STAR PLUS",
        CHUNITHM_STAR = "CHUNITHM STAR",
        CHUNITHM_AIR_PLUS = "CHUNITHM AIR PLUS",
        CHUNITHM_AIR = "CHUNITHM AIR",
        CHUNITHM_PLUS = "CHUNITHM PLUS",
        CHUNITHM = "CHUNITHM",
    }
    const GameVersions = [
        EGameVersions.CHUNITHM_XVERSE,
        EGameVersions.CHUNITHM_VERSE,
        EGameVersions.CHUNITHM_LUMINOUS_PLUS,
        EGameVersions.CHUNITHM_LUMINOUS,
        EGameVersions.CHUNITHM_SUN_PLUS,
        EGameVersions.CHUNITHM_SUN,
        EGameVersions.CHUNITHM_NEW_PLUS,
        EGameVersions.CHUNITHM_NEW,
        EGameVersions.CHUNITHM_PARADISE_LOST,
        EGameVersions.CHUNITHM_SUPERSTAR_PLUS,
        EGameVersions.CHUNITHM_PARADISE,
        EGameVersions.CHUNITHM_CRYSTAL_PLUS,
        EGameVersions.CHUNITHM_SUPERSTAR,
        EGameVersions.CHUNITHM_CRYSTAL,
        EGameVersions.CHUNITHM_AMAZON_PLUS,
        EGameVersions.CHUNITHM_AMAZON,
        EGameVersions.CHUNITHM_STAR_PLUS,
        EGameVersions.CHUNITHM_STAR,
        EGameVersions.CHUNITHM_AIR_PLUS,
        EGameVersions.CHUNITHM_AIR,
        EGameVersions.CHUNITHM_PLUS,
        EGameVersions.CHUNITHM,
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
