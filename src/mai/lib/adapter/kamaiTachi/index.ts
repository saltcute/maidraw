import _ from "lodash";

import ScoreTrackerAdapter from "..";
import { MaimaiUtil } from "../../util";

import {
    IScore,
    ESyncTypes,
    EComboTypes,
    EDifficulty,
    EAchievementTypes,
} from "@maidraw/mai/type";
import { Database } from "@maidraw/mai/lib/database";

export class KamaiTachi extends ScoreTrackerAdapter {
    private currentVersion: KamaiTachi.GameVersions;
    private currentRegion: "DX" | "EX" | "CN";
    constructor({
        baseURL = "https://kamai.tachi.ac/",
        version = KamaiTachi.GameVersions.PRISM_PLUS,
        region = "DX",
    }: {
        baseURL?: string;
        version?: KamaiTachi.GameVersions;
        region?: "DX" | "EX" | "CN";
    } = {}) {
        super({ baseURL });
        this.currentVersion = version;
        this.currentRegion = region;
    }

    versions() {
        return new KamaiTachiBuilder();
    }

    async getPlayerPB(userId: string) {
        return this.get<
            KamaiTachi.IResponse<{
                charts: KamaiTachi.IChart[];
                pbs: KamaiTachi.IPb[];
                songs: KamaiTachi.ISong[];
            }>
        >(
            `/api/v1/users/${userId}/games/maimaidx/Single/pbs/all`,
            undefined,
            60 * 1000
        );
    }
    public async getScoreHistory(userId: string, chartId: string) {
        return this.get<KamaiTachi.IResponse<KamaiTachi.IScore[]>>(
            `/api/v1/users/${userId}/games/maimaidx/Single/scores/${chartId}`,
            undefined,
            60 * 1000
        );
    }
    private toMaiDrawScore(
        score: KamaiTachi.IPb,
        chart: KamaiTachi.IChart,
        song: KamaiTachi.ISong
    ): IScore {
        const localChart = Database.getLocalChart(
            chart.data.inGameID,
            this.getDatabaseDifficulty(chart)
        );
        const internalLevel = localChart
            ? localChart.events
                  .filter((v) => v.type === "existence")
                  .find(
                      (v) =>
                          v.version.name ==
                          this.currentVersion[this.currentRegion]
                  )?.data.level
            : undefined;
        return {
            chart: (() => {
                return {
                    id: chart.data.inGameID,
                    name: song.title,
                    difficulty: (() => {
                        switch (chart.difficulty.toUpperCase()) {
                            case "RE:MASTER":
                            case "DX RE:MASTER":
                                return EDifficulty.REMASTER;
                            case "MASTER":
                            case "DX MASTER":
                                return EDifficulty.MASTER;
                            case "EXPERT":
                            case "DX EXPERT":
                                return EDifficulty.EXPERT;
                            case "ADVANCED":
                            case "DX ADVANCED":
                                return EDifficulty.ADVANCED;
                            case "BASIC":
                            case "DX BASIC":
                            default:
                                return EDifficulty.BASIC;
                        }
                    })(),
                    level: internalLevel || chart.levelNum,
                    maxDxScore:
                        localChart?.meta.maxDXScore ||
                        (() => {
                            return (
                                (score.scoreData.judgements.pcrit || 0) +
                                (score.scoreData.judgements.perfect || 0) +
                                (score.scoreData.judgements.great || 0) +
                                (score.scoreData.judgements.good || 0) +
                                (score.scoreData.judgements.miss || 0) * 3
                            );
                        })(),
                };
            })(),
            combo: (() => {
                switch (score.scoreData.lamp) {
                    case "FULL COMBO":
                        return EComboTypes.FULL_COMBO;
                    case "FULL COMBO+":
                        return EComboTypes.FULL_COMBO_PLUS;
                    case "ALL PERFECT":
                        return EComboTypes.ALL_PERFECT;
                    case "ALL PERFECT+":
                        return EComboTypes.ALL_PERFECT_PLUS;
                    default:
                        return EComboTypes.NONE;
                }
            })(),
            sync: ESyncTypes.NONE,
            achievement: score.scoreData.percent,
            achievementRank: (() => {
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
            dxRating: internalLevel
                ? MaimaiUtil.calculateRating(
                      internalLevel,
                      score.scoreData.percent
                  )
                : score.calculatedData.rate,
            dxScore: (() => {
                return (
                    (score.scoreData.judgements.pcrit || 0) * 3 +
                    (score.scoreData.judgements.perfect || 0) * 2 +
                    (score.scoreData.judgements.great || 0)
                );
            })(),

            optionalData: {
                kt: {
                    chartId: chart.chartID,
                },
            },
        };
    }
    private getDatabaseDifficulty(chart: KamaiTachi.IChart) {
        switch (true) {
            case chart.difficulty.toUpperCase().includes("RE:MASTER"):
                return EDifficulty.REMASTER;
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
    async getPlayerBest50(
        userId: string,
        {
            omnimix = true,
            use = "ALL",
        }: {
            omnimix?: boolean;
            use?: "AP" | "FC" | "ALL";
        } = {}
    ) {
        function filterAP(score: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }) {
            return (
                score.pb.scoreData.lamp == "ALL PERFECT" ||
                score.pb.scoreData.lamp == "ALL PERFECT+"
            );
        }
        function filterFC(score: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }) {
            return (
                score.pb.scoreData.lamp == "FULL COMBO" ||
                score.pb.scoreData.lamp == "FULL COMBO+"
            );
        }
        function filterUseAchievementFilter(score: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }) {
            switch (use) {
                case "AP":
                    return filterFC(score);
                case "FC":
                    return filterAP(score) || filterFC(score);
                case "ALL":
                default:
                    return true;
            }
        }
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
            if (chart && song) {
                pbs.push({ pb, chart, song });
            }
        }
        let newScores: {
                chart: KamaiTachi.IChart;
                song: KamaiTachi.ISong;
                pb: KamaiTachi.IPb;
            }[] = [],
            oldScores: {
                chart: KamaiTachi.IChart;
                song: KamaiTachi.ISong;
                pb: KamaiTachi.IPb;
            }[] = [];
        newScores = pbs.filter((v) => {
            const diff = KamaiTachi.compareGameVersions(
                this.currentVersion,
                KamaiTachi.getGameVersion(v.chart.data.displayVersion)
            );
            if (
                KamaiTachi.compareGameVersions(
                    this.currentVersion,
                    KamaiTachi.GameVersions.CIRCLE
                ) >= 0
            ) {
                return 0 <= diff && diff <= 1;
            } else {
                return diff == 0;
            }
        });
        oldScores = pbs.filter((v) => {
            const diff = KamaiTachi.compareGameVersions(
                this.currentVersion,
                KamaiTachi.getGameVersion(v.chart.data.displayVersion)
            );
            if (
                KamaiTachi.compareGameVersions(
                    this.currentVersion,
                    KamaiTachi.GameVersions.CIRCLE
                ) >= 0
            ) {
                // Chart version is 2 versions older than current Version
                return (
                    diff > 1 &&
                    (omnimix || // Omnimix is enabled, all charts are included.
                        !(
                            (
                                v.chart.versions[0].includes("-omni") && // Alternatively, if omnimix is disabled, check if the chart is included in omnimix folder of the latest version, (which should always happen).
                                v.chart.versions[1].includes("-omni")
                            ) // Then check if the second last version is a omnimix folder. If two omnimix folders occur in a row, it is a omnimix chart.
                        ))
                ); // Reject that case.
            } else {
                return (
                    // Chart version is older than current Version
                    diff > 0 &&
                    (omnimix || // Omnimix is enabled, all charts are included.
                        !(
                            (
                                v.chart.versions[0].includes("-omni") && // Alternatively, if omnimix is disabled, check if the chart is included in omnimix folder of the latest version, (which should always happen).
                                v.chart.versions[1].includes("-omni")
                            ) // Then check if the second last version is a omnimix folder. If two omnimix folders occur in a row, it is a omnimix chart.
                        ))
                ); // Reject that case.
            }
        });

        newScores = newScores.filter(filterUseAchievementFilter);
        oldScores = oldScores.filter(filterUseAchievementFilter);

        return {
            new: newScores
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                .sort((a, b) =>
                    b.dxRating - a.dxRating
                        ? b.dxRating - a.dxRating
                        : b.achievement - a.achievement
                )
                .slice(0, 15),
            old: oldScores
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
                .sort((a, b) =>
                    b.dxRating - a.dxRating
                        ? b.dxRating - a.dxRating
                        : b.achievement - a.achievement
                )
                .slice(0, 35),
        };
    }
    async getPlayerInfo(
        userId: string,
        options: {
            omnimix?: boolean;
            use?: "AP" | "FC" | "ALL";
        } = {
            omnimix: true,
            use: "ALL",
        }
    ) {
        const profile = await this.getPlayerProfileRaw(userId);
        const scores = await this.getPlayerBest50(userId, options);
        if (!profile?.body || !scores) return null;
        let dxRating = 0;
        [...scores.new, ...scores.old].forEach((v) => (dxRating += v.dxRating));
        return {
            name: profile?.body.username,
            rating: dxRating,
        };
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
    async getPlayerScore(username: string, chartId: number) {
        const rawPBs = await this.getPlayerPB(username);
        if (!rawPBs?.body)
            return {
                basic: null,
                advanced: null,
                expert: null,
                master: null,
                remaster: null,
                utage: null,
            };
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
            return (
                payload.difficulty ==
                `${payload.data.inGameID >= 10000 && payload.data.inGameID < 100000 ? "DX " : ""}${target}`
            );
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
        const remaster = pbs.find(
            (v) =>
                difficultyCompare(v.chart, "Re:Master") &&
                v.chart.data.inGameID == chartId
        );
        const utage = pbs.find(
            (v) =>
                difficultyCompare(v.chart, "UTAGE") &&
                v.chart.data.inGameID == chartId
        );
        return {
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
            remaster: remaster
                ? this.toMaiDrawScore(
                      remaster.pb,
                      remaster.chart,
                      remaster.song
                  )
                : null,
            utage: utage
                ? this.toMaiDrawScore(utage.pb, utage.chart, utage.song)
                : null,
        };
    }
    public async getPlayerLevel50(
        username: string,
        level: number,
        page: number,
        options: { percise: boolean } = { percise: false }
    ) {
        if (page < 1) page = 1;
        const rawPBs = await this.getPlayerPB(username);
        if (!rawPBs?.body) return null;
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
        return pbs
            .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song))
            .sort(
                (a, b) =>
                    b.achievement - a.achievement ||
                    b.chart.level - a.chart.level
            )
            .filter((v) =>
                options.percise
                    ? v.chart.level == level
                    : this.levelBoundChecker(v.chart.level, level, 6)
            )
            .slice((page - 1) * 50, (page - 1) * 50 + 50);
    }
    private levelBoundChecker(payload: number, target: number, border: number) {
        let lb = 0,
            hb = 0;
        if ((target * 10) % 10 < border) {
            lb = Math.trunc(target);
            hb = Math.trunc(target) + (border - 1) * 0.1;
        } else {
            lb = Math.trunc(target) + border * 0.1;
            hb = Math.ceil(target) - 0.1;
        }
        return lb <= payload && payload <= hb;
    }
}

export class KamaiTachiBuilder {
    public maimai(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.MAIMAI,
            region,
        });
    }
    public maimaiPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.MAIMAI_PLUS,
            region,
        });
    }
    public green(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.GREEN,
            region,
        });
    }
    public greenPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.GREEN_PLUS,
            region,
        });
    }
    public orange(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.ORANGE,
            region,
        });
    }
    public orangePlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.ORANGE_PLUS,
            region,
        });
    }
    public pink(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.PINK,
            region,
        });
    }
    public pinkPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.PINK_PLUS,
            region,
        });
    }
    public murasaki(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.MURASAKI,
            region,
        });
    }
    public murasakiPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.MURASAKI_PLUS,
            region,
        });
    }
    public milk(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.MILK,
            region,
        });
    }
    public milkPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.MILK_PLUS,
            region,
        });
    }
    public finale(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.FINALE,
            region,
        });
    }
    public dx(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.DX,
            region,
        });
    }
    public dxPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.DX_PLUS,
            region,
        });
    }
    public splash(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.SPLASH,
            region,
        });
    }
    public splashPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.SPLASH_PLUS,
            region,
        });
    }
    public universe(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.UNIVERSE,
            region,
        });
    }
    public universePlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.UNIVERSE_PLUS,
            region,
        });
    }
    public festival(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.FESTIVAL,
            region,
        });
    }
    public festivalPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.FESTIVAL_PLUS,
            region,
        });
    }
    public buddies(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.BUDDIES,
            region,
        });
    }
    public buddiesPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.BUDDIES_PLUS,
            region,
        });
    }
    public prism(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.PRISM,
            region,
        });
    }
    public prismPlus(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.PRISM_PLUS,
            region,
        });
    }
    public circle(region?: "DX" | "EX") {
        return new KamaiTachi({
            version: KamaiTachi.GameVersions.CIRCLE,
            region,
        });
    }
    public CN() {
        return {
            DX() {
                return new KamaiTachi({
                    version: KamaiTachi.GameVersions.DX,
                    region: "CN",
                });
            },
            DX2021() {
                return new KamaiTachi({
                    version: KamaiTachi.GameVersions.SPLASH,
                    region: "CN",
                });
            },
            DX2022() {
                return new KamaiTachi({
                    version: KamaiTachi.GameVersions.UNIVERSE,
                    region: "CN",
                });
            },
            DX2023() {
                return new KamaiTachi({
                    version: KamaiTachi.GameVersions.FESTIVAL,
                    region: "CN",
                });
            },
            DX2024() {
                return new KamaiTachi({
                    version: KamaiTachi.GameVersions.BUDDIES,
                    region: "CN",
                });
            },
            DX2025() {
                return new KamaiTachi({
                    version: KamaiTachi.GameVersions.PRISM,
                    region: "CN",
                });
            },
        };
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
            displayVersion: KamaiGameVersions;
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
            displayVersion: string;
            genre: string;
        };
        id: number;
        searchTerms: string[];
        title: string;
    }
    export interface IScore {
        calculatedData: {
            rate: number;
        };
        chartID: string;
        comment: string | null;
        game: string;
        highlight: boolean;
        importType: string;
        isPrimary: boolean;
        playtype: string;
        scoreData: {
            percent: number;
            lamp: string;
            judgements: {
                pcrit?: number;
                perfect?: number;
                great?: number;
                good?: number;
                miss?: number;
            };
            optional: {
                fast: number;
                slow: number;
                maxCombo: number;
                enumIndexes: any;
            };
            grade: string;
            enumIndexes: {
                lamp: number;
                grade: number;
            };
        };
        scoreID: string;
        scoreMeta: any;
        service: string;
        songID: number;
        timeAchieved: number;
        timeAdded: number;
        userID: number;
    }
    export interface IPb {
        chartID: string;
        userID: number;
        calculatedData: {
            rate: number;
        };
        composedFrom: [
            {
                name: string;
                scoreID: string;
            },
            {
                name: string;
                scoreID: string;
            },
        ];
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
            percent: number;
            lamp: string;
            judgements: {
                pcrit?: number;
                perfect?: number;
                great?: number;
                good?: number;
                miss?: number;
            };
            optional: {
                fast: number;
                slow: number;
                maxCombo: number;
                enumIndexes: any;
            };
            grade: string;
            enumIndexes: {
                lamp: number;
                grade: number;
            };
        };
        songID: number;
        timeAchieved: number;
    }

    export const GameVersions = {
        CIRCLE: {
            kamai: "maimaiでらっくす CiRCLE",
            DX: "maimai でらっくす CiRCLE",
            EX: "maimai DX CiRCLE",
            CN: "舞萌DX 2026",
        },
        PRISM_PLUS: {
            kamai: "maimaiでらっくす PRiSM PLUS",
            DX: "maimai でらっくす PRiSM PLUS",
            EX: "maimai DX PRiSM PLUS",
            CN: "",
        },
        PRISM: {
            kamai: "maimaiでらっくす PRiSM",
            DX: "maimai でらっくす PRiSM",
            EX: "maimai DX PRiSM",
            CN: "舞萌DX 2025",
        },
        BUDDIES_PLUS: {
            kamai: "maimaiでらっくす BUDDiES PLUS",
            DX: "maimai でらっくす BUDDiES PLUS",
            EX: "maimai DX BUDDiES PLUS",
            CN: "",
        },
        BUDDIES: {
            kamai: "maimaiでらっくす BUDDiES",
            DX: "maimai でらっくす BUDDiES",
            EX: "maimai DX BUDDiES",
            CN: "舞萌DX 2024",
        },
        FESTIVAL_PLUS: {
            kamai: "maimaiでらっくす FESTiVAL PLUS",
            DX: "maimai でらっくす FESTiVAL PLUS",
            EX: "maimai DX FESTiVAL PLUS",
            CN: "",
        },
        FESTIVAL: {
            kamai: "maimaiでらっくす FESTiVAL",
            DX: "maimai でらっくす FESTiVAL",
            EX: "maimai DX FESTiVAL",
            CN: "舞萌DX 2023",
        },
        UNIVERSE_PLUS: {
            kamai: "maimaiでらっくす UNiVERSE PLUS",
            DX: "maimai でらっくす UNiVERSE PLUS",
            EX: "maimai DX UNiVERSE PLUS",
            CN: "",
        },
        UNIVERSE: {
            kamai: "maimaiでらっくす UNiVERSE",
            DX: "maimai でらっくす UNiVERSE",
            EX: "maimai DX UNiVERSE",
            CN: "舞萌DX 2022",
        },
        SPLASH_PLUS: {
            kamai: "maimaiでらっくす Splash PLUS",
            DX: "maimai でらっくす Splash PLUS",
            EX: "maimai DX Splash PLUS",
            CN: "",
        },
        SPLASH: {
            kamai: "maimaiでらっくす Splash",
            DX: "maimai でらっくす Splash",
            EX: "maimai DX Splash",
            CN: "舞萌DX 2021",
        },
        DX_PLUS: {
            kamai: "maimaiでらっくす PLUS",
            DX: "maimai でらっくす PLUS",
            EX: "maimai DX PLUS",
            CN: "",
        },
        DX: {
            kamai: "maimaiでらっくす",
            DX: "maimai でらっくす",
            EX: "maimai DX",
            CN: "舞萌DX",
        },
        FINALE: {
            kamai: "maimai FiNALE",
            DX: "maimai FiNALE",
            EX: "maimai FiNALE",
            CN: "maimai FiNALE",
        },
        MILK_PLUS: {
            kamai: "maimai MiLK PLUS",
            DX: "maimai MiLK PLUS",
            EX: "maimai MiLK PLUS",
            CN: "maimai MiLK PLUS",
        },
        MILK: {
            kamai: "maimai MiLK",
            DX: "maimai MiLK",
            EX: "maimai MiLK",
            CN: "maimai MiLK",
        },
        MURASAKI_PLUS: {
            kamai: "maimai MURASAKi PLUS",
            DX: "maimai MURASAKi PLUS",
            EX: "maimai MURASAKi PLUS",
            CN: "maimai MURASAKi PLUS",
        },
        MURASAKI: {
            kamai: "maimai MURASAKi",
            DX: "maimai MURASAKi",
            EX: "maimai MURASAKi",
            CN: "maimai MURASAKi",
        },
        PINK_PLUS: {
            kamai: "maimai PiNK PLUS",
            DX: "maimai PiNK PLUS",
            EX: "maimai PiNK PLUS",
            CN: "maimai PiNK PLUS",
        },
        PINK: {
            kamai: "maimai PiNK",
            DX: "maimai PiNK",
            EX: "maimai PiNK",
            CN: "maimai PiNK",
        },
        ORANGE_PLUS: {
            kamai: "maimai ORANGE PLUS",
            DX: "maimai ORANGE PLUS",
            EX: "maimai ORANGE PLUS",
            CN: "maimai ORANGE PLUS",
        },
        ORANGE: {
            kamai: "maimai ORANGE",
            DX: "maimai ORANGE",
            EX: "maimai ORANGE",
            CN: "maimai ORANGE",
        },
        GREEN_PLUS: {
            kamai: "maimai GreeN PLUS",
            DX: "maimai GreeN PLUS",
            EX: "maimai GreeN PLUS",
            CN: "maimai GreeN PLUS",
        },
        GREEN: {
            kamai: "maimai GreeN",
            DX: "maimai GreeN",
            EX: "maimai GreeN",
            CN: "maimai GreeN",
        },
        MAIMAI_PLUS: {
            kamai: "maimai PLUS",
            DX: "maimai PLUS",
            EX: "maimai PLUS",
            CN: "maimai PLUS",
        },
        MAIMAI: {
            kamai: "maimai",
            DX: "maimai",
            EX: "maimai",
            CN: "maimai",
        },
    } as const;
    export type GameVersions = (typeof GameVersions)[keyof typeof GameVersions];
    export type KamaiGameVersions =
        (typeof GameVersions)[keyof typeof GameVersions]["kamai"];
    export type AllGameVersions = GameVersions;

    const GameVersionOrder = [
        GameVersions.MAIMAI,
        GameVersions.MAIMAI_PLUS,
        GameVersions.GREEN,
        GameVersions.GREEN_PLUS,
        GameVersions.ORANGE,
        GameVersions.ORANGE_PLUS,
        GameVersions.PINK,
        GameVersions.PINK_PLUS,
        GameVersions.MURASAKI,
        GameVersions.MURASAKI_PLUS,
        GameVersions.MILK,
        GameVersions.MILK_PLUS,
        GameVersions.FINALE,
        GameVersions.DX,
        GameVersions.DX_PLUS,
        GameVersions.SPLASH,
        GameVersions.SPLASH_PLUS,
        GameVersions.UNIVERSE,
        GameVersions.UNIVERSE_PLUS,
        GameVersions.FESTIVAL,
        GameVersions.FESTIVAL_PLUS,
        GameVersions.BUDDIES,
        GameVersions.BUDDIES_PLUS,
        GameVersions.PRISM,
        GameVersions.PRISM_PLUS,
        GameVersions.CIRCLE,
    ] as const;

    export function getGameVersion(payload: string): AllGameVersions | null {
        for (const version of Object.values(GameVersions)) {
            if (
                version.kamai.toLowerCase() === payload.toLowerCase() ||
                version.DX.toLowerCase() === payload.toLowerCase() ||
                version.EX.toLowerCase() === payload.toLowerCase() ||
                version.CN.toLowerCase() === payload.toLowerCase()
            ) {
                return version;
            }
        }
        return null;
    }

    /**
     * Compare two game versions and calculate which is newer.
     *
     * @param a Game version.
     * @param b Game version.
     * @returns positive if a is newer, negative if b is newer, 0 if they are the same.
     */
    export function compareGameVersions(
        a: AllGameVersions | null,
        b: AllGameVersions | null
    ): number {
        if (!a && !b) return 0;
        if (!a) return -1; // b is newer
        if (!b) return 1; // a is newer
        return GameVersionOrder.indexOf(a) - GameVersionOrder.indexOf(b);
    }
}
