import axios, { AxiosInstance } from "axios";
import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    ESyncTypes,
    IScore,
} from "@maidraw/type";
import ScoreTrackerAdapter from "..";
import { MaiDraw } from "@maidraw/index";

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
                pcrit: number;
                perfect: number;
                great: number;
                good: number;
                miss: number;
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
}

export class KamaiTachi implements ScoreTrackerAdapter {
    private axios: AxiosInstance;
    constructor(
        private maiDraw: MaiDraw,
        auth?: never,
        private baseURL: string = "https://kamai.tachi.ac/"
    ) {
        this.axios = axios.create({
            baseURL: this.baseURL,
        });
    }
    private async get<T>(
        endpoint: string,
        data?: any
    ): Promise<KamaiTachi.IResponse<T> | undefined> {
        return await this.axios
            .get(endpoint, { params: data })
            .then((r) => r.data)
            .catch((e) => {
                e.response?.data
                    ? console.error(e.response?.data)
                    : console.error(e);
                return e.response?.data;
            });
    }
    private async post<T>(
        endpoint: string,
        data?: any
    ): Promise<KamaiTachi.IResponse<T> | undefined> {
        return await this.axios
            .post(endpoint, data)
            .then((r) => r.data)
            .catch((e) => e.response?.data);
    }
    async getPlayerPB(userId: string) {
        return this.get<{
            charts: KamaiTachi.IChart[];
            pbs: KamaiTachi.IPb[];
            songs: KamaiTachi.ISong[];
        }>(`/api/v1/users/${userId}/games/maimaidx/Single/pbs/all`);
    }
    private toMaiDrawScore(
        score: KamaiTachi.IPb,
        chart: KamaiTachi.IChart,
        song: KamaiTachi.ISong
    ): IScore {
        return {
            chart: (() => {
                return {
                    id: chart.data.inGameID,
                    name: song.title,
                    difficulty: (() => {
                        switch (chart.difficulty) {
                            case "Re:Master":
                            case "DX Re:Master":
                                return EDifficulty.REMASTER;
                            case "Master":
                            case "DX Master":
                                return EDifficulty.MASTER;
                            case "Expert":
                            case "DX Expert":
                                return EDifficulty.EXPERT;
                            case "Advanced":
                            case "DX Advanced":
                                return EDifficulty.ADVANCED;
                            case "Basic":
                            case "DX Basic":
                            default:
                                return EDifficulty.BASIC;
                        }
                    })(),
                    level: chart.levelNum,
                    maxDxScore: (() => {
                        return (
                            (score.scoreData.judgements.pcrit +
                                score.scoreData.judgements.perfect +
                                score.scoreData.judgements.great +
                                score.scoreData.judgements.good +
                                score.scoreData.judgements.miss) *
                            3
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
            dxRating: score.calculatedData.rate,
            dxScore: (() => {
                return (
                    score.scoreData.judgements.pcrit * 3 +
                    score.scoreData.judgements.perfect * 2 +
                    score.scoreData.judgements.great
                );
            })(),
        };
    }
    async getPlayerBest50(
        userId: string,
        currentVersion = "buddiesplus",
        omnimix = true
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
            if (chart && song) {
                pbs.push({ pb, chart, song });
            }
        }
        const newScores = pbs.filter(
            (v) =>
                v.chart.versions[0] == currentVersion &&
                (omnimix ||
                    !v.chart.versions.find(
                        (v) => v == `${currentVersion}-omnimix`
                    ))
        );
        const oldScores = pbs.filter(
            (v) =>
                v.chart.versions[0] != currentVersion &&
                (omnimix ||
                    !v.chart.versions.find(
                        (v) => v == `${currentVersion}-omnimix`
                    ))
        );
        return {
            new: newScores
                .sort((a, b) =>
                    b.pb.calculatedData.rate - a.pb.calculatedData.rate
                        ? b.pb.calculatedData.rate - a.pb.calculatedData.rate
                        : b.pb.scoreData.percent - a.pb.scoreData.percent
                )
                .slice(0, 15)
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song)),
            old: oldScores
                .sort((a, b) =>
                    b.pb.calculatedData.rate - a.pb.calculatedData.rate
                        ? b.pb.calculatedData.rate - a.pb.calculatedData.rate
                        : b.pb.scoreData.percent - a.pb.scoreData.percent
                )
                .slice(0, 35)
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song)),
        };
    }
    async getPlayerInfo(userId: string) {
        const profile = await this.getPlayerProfileRaw(userId);
        const scores = await this.getPlayerBest50(userId);
        if (!profile?.body || !scores) return null;
        let dxRating = 0;
        [...scores.new, ...scores.old].forEach((v) => (dxRating += v.dxRating));
        return {
            name: profile?.body.username,
            rating: dxRating,
        };
    }
    private async getPlayerProfileRaw(userId: string) {
        return this.get<{
            username: string;
            id: number;
            about: string;
        }>(`/api/v1/users/${userId}`);
    }
}
