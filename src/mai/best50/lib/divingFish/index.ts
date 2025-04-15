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
import { Chart } from "@maidraw/mai/chart";
import { Cache } from "memory-cache";

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
        records: IPlayResult[];
        nickname: string;
        plate: string;
        rating: number;
        username: string;
    }
    export type ISongListResponse = ISongData[];
    export interface ISongData {
        basic_info: {
            title: string;
            artist: string;
            genre: string;
            from: string;
            is_new: boolean;
            bpm: number;
            release_date: string;
        };
        charts: {
            charter: string;
            /**
             * Number of each type of notes.
             *
             * From 0 to 4, each number represents the number of Tap, Hold, Slide, Touch and Break notes.
             */
            notes: [number, number, number, number, number];
        }[];
        cids: number[];
        /**
         * Internal level of each level of the song.
         */
        ds: number[];
        id: string;
        /**
         * Level catergory of each level of the song.
         */
        level: string[];
        title: string;
        type: "SD" | "DX";
    }
}

export class DivingFish extends ScoreTrackerAdapter {
    constructor({
        auth,
        baseURL = "https://www.diving-fish.com/api/maimaidxprober/",
    }: {
        auth: string;
        baseURL?: string;
    }) {
        super({ baseURL });
        this.axios.defaults.headers.common["Developer-Token"] = auth;
    }
    async getPlayerBest50(username: string) {
        const pbs = await this.getPlayerRawBest50(username);
        if (!pbs) {
            return null;
        }
        let chartList: IChart[] = [];
        if (Chart.Database.hasLocalDatabase()) {
            chartList = pbs.records
                .map((chart) => {
                    return Chart.Database.getLocalChart(
                        chart.song_id,
                        chart.level_index as unknown as EDifficulty
                    );
                })
                .filter((v) => v !== null);
        } else {
            chartList = await this.getMaiDrawChartList();
        }
        const newScores = pbs.records.filter(
            async (v) =>
                (await this.getSong(v.song_id.toString()))?.basic_info.is_new
        );
        const oldScores = pbs.records.filter(
            async (v) =>
                !(await this.getSong(v.song_id.toString()))?.basic_info.is_new
        );
        return {
            new: this.toMaiDrawScore(newScores, chartList),
            old: this.toMaiDrawScore(oldScores, chartList),
        };
    }

    async getMaiDrawChartList(): Promise<IChart[]> {
        const songList = await this.getSongList();
        return songList.flatMap((song) => {
            return song.charts.map((chart, index) => {
                return {
                    id: parseInt(song.id),
                    name: song.title,
                    level: song.ds[index],
                    difficulty: index,
                    maxDxScore: chart.notes.reduce((p, v) => p + v) * 3,
                };
            });
        });
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
    async getPlayerRawBest50(username: string) {
        return await this.get<DivingFish.IBest50Response>(
            "/dev/player/records",
            {
                username,
            },
            60 * 1000
        );
    }
    async getSong(id: string) {
        return (await this.getSongList()).find((v) => v.id == id) || null;
    }
    async getSongList(): Promise<DivingFish.ISongListResponse> {
        const cached = (await this.cache.get(
            "divingfish-songList"
        )) as DivingFish.ISongListResponse | null;
        if (cached) return cached;
        const res = (await this.get(`/music_data`).catch(
            (e) => []
        )) as unknown as DivingFish.ISongListResponse;
        this.cache.put("divingfish-songList", res, 24 * 60 * 60 * 1000);
        return res;
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
    async getPlayerProfilePicture(username: string): Promise<Buffer | null> {
        return null;
    }
}
