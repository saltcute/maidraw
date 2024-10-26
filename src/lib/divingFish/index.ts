import axios, { AxiosInstance } from "axios";
import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    ESyncTypes,
    IChart,
    IScore,
} from "@maidraw/type";
import ScoreTrackerAdapter from "..";
import { MaiDraw } from "@maidraw/index";

export namespace DivingFish {
    export interface IPlayResult {
        achievements: number;
        ds: number;
        dxScore: number;
        fc: "" | "fc" | "fcp" | "ap" | "app";
        fs: "" | "sync" | "fs" | "fsp" | "fsd" | "fsdp";
        level: string;
        level_index: number;
        level_label: string;
        ra: number;
        rate:
            | "d"
            | "c"
            | "b"
            | "bb"
            | "bbb"
            | "a"
            | "aa"
            | "aaa"
            | "s"
            | "sp"
            | "ss"
            | "ssp"
            | "sss"
            | "sssp";
        song_id: number;
        title: string;
        type: "SD" | "DX";
    }
    export interface IBest50Response {
        additional_rating: 0;
        charts: {
            dx: IPlayResult[];
            sd: IPlayResult[];
        };
        nickname: string;
        plate: string;
        rating: number;
        user_general_data: null;
        username: string;
    }
}

export class DivingFish implements ScoreTrackerAdapter {
    private axios: AxiosInstance;
    constructor(
        private maiDraw: MaiDraw,
        auth?: never,
        private baseURL: string = "https://www.diving-fish.com/api/maimaidxprober/"
    ) {
        this.axios = axios.create({
            baseURL: this.baseURL,
        });
    }
    private async get<T>(endpoint: string, data?: any): Promise<any> {
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
    private async post<T>(endpoint: string, data?: any): Promise<any> {
        return await this.axios
            .post(endpoint, data)
            .then((r) => r.data)
            .catch((e) => e.response?.data);
    }
    async getPlayerBest50(username: string) {
        const b50 = await this.getPlayerRawBest50(username);
        if (!b50) {
            return null;
        }
        let chartList: IChart[] = [];
        if (this.maiDraw.hasLocalDatabase()) {
            chartList = [...b50.charts.dx, ...b50.charts.sd]
                .map((chart) => {
                    return this.maiDraw.getLocalChart(
                        chart.song_id,
                        chart.level_index as unknown as EDifficulty
                    );
                })
                .filter((v) => v !== null);
        }
        return {
            new: this.toMaiDrawScore(b50.charts.dx, chartList),
            old: this.toMaiDrawScore(b50.charts.sd, chartList),
        };
    }
    async getPlayerInfo(username: string) {
        const b50 = await this.getPlayerRawBest50(username);
        if (!b50) {
            return null;
        } else {
            return {
                name: b50.nickname,
                rating: b50.rating,
            };
        }
    }
    async getPlayerRawBest50(
        username: string
    ): Promise<DivingFish.IBest50Response> {
        return (
            await this.post("/query/player", {
                username,
                b50: true,
            })
        ).data;
    }
    private toMaiDrawScore(
        scores: DivingFish.IPlayResult[],
        charts: IChart[]
    ): IScore[] {
        return scores.map((score) => {
            return {
                chart: (() => {
                    const chart = charts.find(
                        (chart) => chart.id === score.song_id
                    );
                    return {
                        id: score.song_id,
                        name: score.title,
                        difficulty: (() => {
                            switch (score.level_index) {
                                case 1:
                                    return EDifficulty.ADVANCED;
                                case 2:
                                    return EDifficulty.EXPERT;
                                case 3:
                                    return EDifficulty.MASTER;
                                case 4:
                                    return EDifficulty.REMASTER;
                                case 5:
                                    return EDifficulty.UTAGE;
                                default:
                                    return EDifficulty.BASIC;
                            }
                        })(),
                        level: score.ds,
                        maxDxScore: chart?.maxDxScore || 0,
                    };
                })(),
                combo: (() => {
                    switch (score.fc) {
                        case "fc":
                            return EComboTypes.FULL_COMBO;
                        case "fcp":
                            return EComboTypes.FULL_COMBO_PLUS;
                        case "ap":
                            return EComboTypes.ALL_PERFECT;
                        case "app":
                            return EComboTypes.ALL_PERFECT_PLUS;
                        default:
                            return EComboTypes.NONE;
                    }
                })(),
                sync: (() => {
                    switch (score.fs) {
                        case "sync":
                            return ESyncTypes.SYNC_PLAY;
                        case "fs":
                            return ESyncTypes.FULL_SYNC;
                        case "fsp":
                            return ESyncTypes.FULL_SYNC_PLUS;
                        case "fsd":
                            return ESyncTypes.FULL_SYNC_DX;
                        case "fsdp":
                            return ESyncTypes.FULL_SYNC_DX_PLUS;
                        default:
                            return ESyncTypes.NONE;
                    }
                })(),
                achievement: score.achievements,
                achievementRank: (() => {
                    switch (score.rate) {
                        case "c":
                            return EAchievementTypes.C;
                        case "b":
                            return EAchievementTypes.B;
                        case "bb":
                            return EAchievementTypes.BB;
                        case "bbb":
                            return EAchievementTypes.BBB;
                        case "a":
                            return EAchievementTypes.A;
                        case "aa":
                            return EAchievementTypes.AA;
                        case "aaa":
                            return EAchievementTypes.AAA;
                        case "s":
                            return EAchievementTypes.S;
                        case "sp":
                            return EAchievementTypes.SP;
                        case "ss":
                            return EAchievementTypes.SS;
                        case "ssp":
                            return EAchievementTypes.SSP;
                        case "sss":
                            return EAchievementTypes.SSS;
                        case "sssp":
                            return EAchievementTypes.SSSP;
                        default:
                            return EAchievementTypes.D;
                    }
                })(),
                dxRating: score.ra,
                dxScore: score.dxScore,
            };
        });
    }
}
