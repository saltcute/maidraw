import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    IChart,
    IScore,
} from "@maidraw/chu/type";
import ScoreTrackerAdapter from "..";
import { Chart } from "@maidraw/chu/chart";

export class LXNS extends ScoreTrackerAdapter {
    constructor({
        auth,
        baseURL = "https://maimai.lxns.net/api/v0/chunithm",
    }: {
        auth: string;
        baseURL?: string;
    }) {
        super({ baseURL });
        this.axios.defaults.headers.common["Authorization"] = auth;
    }

    async getPlayerRawBest40(friendCode: string) {
        return this.get<LXNS.IAPIResponse<LXNS.IBest40Response>>(
            `/player/${friendCode}/bests`,
            undefined,
            60 * 1000
        );
    }
    private toMaiDrawScore(
        scores: LXNS.IScore[],
        chartList: IChart[]
    ): IScore[] {
        return scores
            .map((chart) => {
                const chartDetail = chartList.find(
                    (v) =>
                        v.id === chart.id &&
                        v.difficulty ==
                            (chart.level_index as unknown as EDifficulty)
                );
                if (!chartDetail) return null;
                return {
                    chart: chartDetail,
                    score: chart.score,
                    rank: (() => {
                        switch (chart.rank) {
                            case LXNS.ERankTypes.C:
                                return EAchievementTypes.C;
                            case LXNS.ERankTypes.B:
                                return EAchievementTypes.B;
                            case LXNS.ERankTypes.BB:
                                return EAchievementTypes.BB;
                            case LXNS.ERankTypes.BBB:
                                return EAchievementTypes.BBB;
                            case LXNS.ERankTypes.A:
                                return EAchievementTypes.A;
                            case LXNS.ERankTypes.AA:
                                return EAchievementTypes.AA;
                            case LXNS.ERankTypes.AAA:
                                return EAchievementTypes.AAA;
                            case LXNS.ERankTypes.S:
                                return EAchievementTypes.S;
                            case LXNS.ERankTypes.SP:
                                return EAchievementTypes.SP;
                            case LXNS.ERankTypes.SS:
                                return EAchievementTypes.SS;
                            case LXNS.ERankTypes.SSP:
                                return EAchievementTypes.SSP;
                            case LXNS.ERankTypes.SSS:
                                return EAchievementTypes.SSS;
                            case LXNS.ERankTypes.SSSP:
                                return EAchievementTypes.SSSP;
                            default:
                                return EAchievementTypes.D;
                        }
                    })(),
                    combo: (() => {
                        switch (chart.full_combo) {
                            case LXNS.EComboTypes.FULL_COMBO:
                                return EComboTypes.FULL_COMBO;
                            case LXNS.EComboTypes.ALL_JUSTICE:
                                return EComboTypes.ALL_JUSTICE;
                            case LXNS.EComboTypes.ALL_PERFECT_PLUS:
                                return EComboTypes.ALL_JUSTICE_CRITICAL;
                            default:
                                return EComboTypes.NONE;
                        }
                    })(),
                    rating: chart.rating,
                };
            })
            .filter((v) => v !== null);
    }
    async getPlayerBest50(friendCode: string) {
        return {
            new: [],
            old: [],
            best: [],
        };
    }
    async getSongList(): Promise<LXNS.ISongListResponse> {
        const cached = (await this.cache.get(
            "lxns-songList-chunithm"
        )) as LXNS.ISongListResponse | null;
        if (cached) return cached;
        const res = (await this.get<LXNS.ISongListResponse>(`/song/list`, {
            notes: true,
        }).catch(() => {})) || {
            songs: [],
            genres: [],
            versions: [],
        };
        this.cache.put("lxns-songList-chunithm", res, 24 * 60 * 60 * 1000);
        return res;
    }
    async getMaiDrawChartList(): Promise<IChart[]> {
        const songList = await this.getSongList();

        return songList.songs.flatMap((song) => {
            return song.difficulties.map((chart) => {
                return {
                    id: song.id,
                    name: song.title,
                    level: chart.level_value,
                    difficulty: chart.difficulty as unknown as EDifficulty,
                };
            });
        });
    }
    async getPlayerRecent40(friendCode: string) {
        const b50 = await this.getPlayerRawBest40(friendCode);
        if (!b50?.data) return null;
        const chartList = await this.getChartList([
            ...b50.data.recents,
            ...b50.data.bests,
        ]);
        return {
            recent: this.toMaiDrawScore(b50.data.recents, chartList),
            best: this.toMaiDrawScore(b50.data.bests, chartList),
        };
    }
    async getPlayerInfo(friendCode: string, type: "new" | "recents") {
        if (type == "new") {
            return null;
        } else if (type == "recents") {
            const profile = await this.getPlayerRawProfile(friendCode);
            if (!profile?.data) return null;
            return {
                name: profile.data.name,
                rating: profile.data.rating,
            };
        } else return null;
    }
    async getPlayerRawProfile(friendCode: string) {
        return await this.get<LXNS.IAPIResponse<LXNS.IPlayer>>(
            `/player/${friendCode}`
        );
    }
    async getPlayerProfilePicture(friendCode: string) {
        return null;
    }
    private async getChartList(targets: LXNS.IScore[]) {
        let chartList: IChart[];
        if (Chart.Database.hasLocalDatabase()) {
            chartList = targets
                .map((chart) => {
                    return Chart.Database.getLocalChart(
                        chart.id,
                        chart.level_index as unknown as EDifficulty
                    );
                })
                .filter((v) => v !== null)
                .map((v) => {
                    return {
                        id: v.id,
                        name: v.name,
                        level:
                            (() => {
                                return v.events
                                    .filter((v) => v.type == "existence")
                                    .sort(
                                        (a, b) =>
                                            b.version.gameVersion.release -
                                            a.version.gameVersion.release
                                    )
                                    .sort((a, b) => {
                                        switch (a.version.region) {
                                            case "CHN":
                                                return -1;
                                            case "INT":
                                                return 1;
                                            case "JPN":
                                                if (b.version.region == "CHN")
                                                    return 1;
                                                else return -1;
                                        }
                                    })
                                    .pop()?.data.level;
                            })() || 0,
                        difficulty: v.difficulty,
                    };
                });
        } else {
            chartList = await this.getMaiDrawChartList();
        }
        return chartList;
    }
    async getPlayerScore(username: string, chartId: number) {
        const NUL = {
            basic: null,
            advanced: null,
            expert: null,
            master: null,
            ultima: null,
            worldsEnd: null,
        };
        const res = await this.get<LXNS.IAPIResponse<LXNS.IScore[]>>(
            `/player/${username}/bests`,
            {
                song_id: chartId,
            }
        );
        if (!res?.data) return NUL;
        const chartList = await this.getChartList(res.data);
        const scores = this.toMaiDrawScore(res?.data, chartList);
        return {
            ...NUL,
            basic:
                scores.find((v) => v.chart.difficulty == EDifficulty.BASIC) ||
                null,
            advanced:
                scores.find(
                    (v) => v.chart.difficulty == EDifficulty.ADVANCED
                ) || null,
            expert:
                scores.find((v) => v.chart.difficulty == EDifficulty.EXPERT) ||
                null,
            master:
                scores.find((v) => v.chart.difficulty == EDifficulty.MASTER) ||
                null,
            ultima:
                scores.find((v) => v.chart.difficulty == EDifficulty.ULTIMA) ||
                null,
        };
    }
}

export namespace LXNS {
    /**
     * Utage charts uses `ELevelIndex.BASIC`,
     */
    export enum ELevelIndex {
        BASIC,
        ADVANCED,
        EXPERT,
        MASTER,
        ULTIMA,
        WORLDS_END,
    }
    export enum EComboTypes {
        FULL_COMBO = "fullcombo",
        ALL_JUSTICE = "alljustice",
        ALL_PERFECT_PLUS = "alljusticecritical",
    }
    export enum EChainTypes {
        FULL_CHAIN_PLAT = "fullchain",
        FULL_CHAIN_GOLD = "fullchain2",
    }
    export enum EClearTypes {
        CATASTROPHY = "catastrophy",
        ABSOLUTE_PLUS = "absolutep",
        ABSOLUTE = "absolute",
        HARD = "hard",
        CLEAR = "clear",
        FAILED = "failed",
    }
    export enum ERankTypes {
        D = "d",
        C = "c",
        B = "b",
        BB = "bb",
        BBB = "bbb",
        A = "a",
        AA = "aa",
        AAA = "aaa",
        S = "s",
        SP = "sp",
        SS = "ss",
        SSP = "ssp",
        SSS = "sss",
        SSSP = "sssp",
    }
    export interface IScore {
        id: number;
        song_name: string;
        /**
         * Chart difficulty string.
         * `"7", "11+", "13", "14+", "15"`
         */
        level: string;
        level_index: ELevelIndex;
        score: number;
        rating: number;
        over_power: number;
        clear: EClearTypes | null;
        full_combo: EComboTypes | null;
        full_chain: EChainTypes | null;
        rank: ERankTypes;
        play_time: string;
        upload_time: string;
        last_played_time: string;
    }
    export interface ISong {
        id: number;
        title: string;
        artist: string;
        genre: string;
        bpm: number;
        map: string;
        version: number;
        disabled: boolean;
        difficulties: ISongDifficulty[];
    }
    export interface ISongDifficulty {
        difficulty: ELevelIndex;
        level: string;
        level_value: number;
        note_designer: string;
        version: number;
        notes?: INotes;
    }
    export interface IWorldsEndDifficulty extends ISongDifficulty {
        origin_id: number;
        kanji: string;
        star: number;
    }
    export interface INotes {
        total: number;
        tap: number;
        hold: number;
        slide: number;
        air: number;
        flick: number;
    }
    export interface IPlayer {
        name: string;
        level: number;
        rating: number;
        rating_possession: string;
        friend_code: number;
        class_emblem: IClassEmblem;
        reborn_count: number;
        over_power: number;
        over_power_progress: number;
        currency: number;
        total_currency: number;
        total_play_count: number;
        trophy: any;
        character?: any;
        name_plate?: any;
        map_icon?: any;
        upload_time: string;
    }
    export interface IClassEmblem {
        base: number;
        medal: number;
    }
    export interface ICollection {
        id: number;
        name: string;
        color: string;
        description: string;
        genre: string;
        required: any;
    }
    export interface IBest40Response {
        /**
         * Top 30 scores.
         */
        bests: IScore[];
        /**
         * Recents top 10 scores.
         */
        recents: IScore[];
        selections: IScore[];
    }
    export interface IGenre {
        id: number;
        /**
         * Chinese name of the genre.
         */
        title: string;
        /**
         * Japanese name of the genre.
         */
        genre: string;
    }
    /**
     * All versions are Chinese.
     */
    export interface IVersion {
        id: 0;
        title: string;
        version: number;
    }
    export interface ISongListResponse {
        songs: ISong[];
        genres: IGenre[];
        versions: IVersion[];
    }

    export interface IAPIResponse<T extends any> {
        success: boolean;
        code: number;
        message: string;
        data: T;
    }
}
