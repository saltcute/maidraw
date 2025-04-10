import axios, { AxiosInstance } from "axios";
import { Cache } from "memory-cache";
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

export class LXNS implements ScoreTrackerAdapter {
    private cache = new Cache<string, object>();
    private axios: AxiosInstance;
    constructor(
        private auth: string,
        private baseURL: string = "https://maimai.lxns.net/api/v0/maimai"
    ) {
        this.auth = auth;
        this.axios = axios.create({
            baseURL: this.baseURL,
            headers: {
                Authorization: this.auth,
            },
        });
    }
    private async get<T>(
        endpoint: string,
        data?: any
    ): Promise<LXNS.IAPIResponse<T> | undefined> {
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
    ): Promise<LXNS.IAPIResponse<T> | undefined> {
        return await this.axios
            .post(endpoint, data)
            .then((r) => r.data)
            .catch((e) => e.response?.data);
    }
    async getPlayerBest50(username: string) {
        const b50 = await this.getPlayerRawBest50(username);
        if (!b50?.data) return null;
        let chartList: IChart[];
        if (Chart.Database.hasLocalDatabase()) {
            chartList = [...b50.data.dx, ...b50.data.standard]
                .map((chart) => {
                    return Chart.Database.getLocalChart(
                        chart.id +
                            (chart.type == LXNS.ESongTypes.DX ? 10000 : 0),
                        chart.level_index as unknown as EDifficulty
                    );
                })
                .filter((v) => v !== null);
        } else {
            chartList = await this.getMaiDrawChartList();
        }
        return {
            new: this.toMaiDrawScore(b50.data.dx, chartList),
            old: this.toMaiDrawScore(b50.data.standard, chartList),
        };
    }
    async getPlayerInfo(username: string) {
        const profile = await this.getPlayerRawProfile(username);
        if (!profile?.data) return null;
        return {
            name: profile.data.name,
            rating: profile.data.rating,
        };
    }
    async getPlayerRawBest50(friendCode: string) {
        return await this.get<LXNS.IBest50Response>(
            `/player/${friendCode}/bests`
        );
    }
    async getPlayerRawProfile(friendCode: string) {
        return await this.get<LXNS.IPlayer>(`/player/${friendCode}`);
    }
    async getSong(songId: number): Promise<LXNS.ISong> {
        const songList = await this.getSongList();
        return songList.songs.filter((song) => song.id === songId)[0];
    }
    async getSongList(): Promise<LXNS.ISongListResponse> {
        const cached = this.cache.get(
            "lxns-songList"
        ) as LXNS.ISongListResponse | null;
        if (cached) return cached;
        const res = (await this.get(`/song/list`, { notes: true }).catch(
            (e) => {
                return {
                    songs: [],
                    genres: [],
                    versions: [],
                };
            }
        )) as unknown as LXNS.ISongListResponse;
        this.cache.put("lxns-songList", res, 1000 * 60 * 60);
        return res;
    }
    async getMaiDrawChartList(): Promise<IChart[]> {
        const songList = await this.getSongList();
        const std: IChart[] = songList.songs.flatMap((song) => {
            return song.difficulties.standard.map((chart) => {
                return {
                    id: song.id,
                    name: song.title,
                    level: chart.level_value,
                    difficulty: chart.level_value,
                    maxDxScore: (chart.notes?.total ?? 0) * 3,
                };
            });
        });
        const dx: IChart[] = songList.songs.flatMap((song) => {
            return song.difficulties.dx.map((chart) => {
                return {
                    id: song.id + 100000,
                    name: song.title,
                    level: chart.level_value,
                    difficulty: chart.level_value,
                    maxDxScore: (chart.notes?.total ?? 0) * 3,
                };
            });
        });
        const utage: IChart[] = songList.songs
            .flatMap((song) => {
                return song.difficulties.utage?.map((chart) => {
                    if (chart.is_buddy) {
                        return {
                            id: song.id,
                            name: song.title,
                            level: chart.level_value,
                            difficulty: chart.level_value,
                            maxDxScore:
                                ((chart.notes?.left.total ?? 0) +
                                    (chart.notes?.right.total ?? 0)) *
                                3,
                        };
                    } else {
                        return {
                            id: song.id + 100000,
                            name: song.title,
                            level: chart.level_value,
                            difficulty: chart.level_value,
                            maxDxScore: (chart.notes?.total ?? 0) * 3,
                        };
                    }
                });
            })
            .filter((v) => v !== undefined);

        return [...std, ...dx, ...utage];
    }
    private toMaiDrawScore(
        scores: LXNS.IScore[],
        chartList: IChart[]
    ): IScore[] {
        return scores
            .map((chart) => {
                const chartDetail = chartList.find(
                    (v) =>
                        v.id ===
                        chart.id +
                            (chart.type == LXNS.ESongTypes.DX ? 10000 : 0)
                );
                if (!chartDetail) return null;
                return {
                    chart: chartDetail,
                    achievement: chart.achievements,
                    achievementRank: (() => {
                        switch (chart.rate) {
                            case LXNS.ERateTypes.C:
                                return EAchievementTypes.C;
                            case LXNS.ERateTypes.B:
                                return EAchievementTypes.B;
                            case LXNS.ERateTypes.BB:
                                return EAchievementTypes.BB;
                            case LXNS.ERateTypes.BBB:
                                return EAchievementTypes.BBB;
                            case LXNS.ERateTypes.A:
                                return EAchievementTypes.A;
                            case LXNS.ERateTypes.AA:
                                return EAchievementTypes.AA;
                            case LXNS.ERateTypes.AAA:
                                return EAchievementTypes.AAA;
                            case LXNS.ERateTypes.S:
                                return EAchievementTypes.S;
                            case LXNS.ERateTypes.SP:
                                return EAchievementTypes.SP;
                            case LXNS.ERateTypes.SS:
                                return EAchievementTypes.SS;
                            case LXNS.ERateTypes.SSP:
                                return EAchievementTypes.SSP;
                            case LXNS.ERateTypes.SSS:
                                return EAchievementTypes.SSS;
                            case LXNS.ERateTypes.SSSP:
                                return EAchievementTypes.SSSP;
                            default:
                                return EAchievementTypes.D;
                        }
                    })(),
                    combo: (() => {
                        switch (chart.fc) {
                            case LXNS.EFCTypes.FULL_COMBO:
                                return EComboTypes.FULL_COMBO;
                            case LXNS.EFCTypes.FULL_COMBO_PLUS:
                                return EComboTypes.FULL_COMBO_PLUS;
                            case LXNS.EFCTypes.ALL_PERFECT:
                                return EComboTypes.ALL_PERFECT;
                            case LXNS.EFCTypes.ALL_PERFECT_PLUS:
                                return EComboTypes.ALL_PERFECT_PLUS;
                            default:
                                return EComboTypes.NONE;
                        }
                    })(),
                    sync: (() => {
                        switch (chart.fs) {
                            case LXNS.EFSTypes.SYNC:
                                return ESyncTypes.SYNC_PLAY;
                            case LXNS.EFSTypes.FULL_SYNC:
                                return ESyncTypes.FULL_SYNC;
                            case LXNS.EFSTypes.FULL_SYNC_PLUS:
                                return ESyncTypes.FULL_SYNC_PLUS;
                            case LXNS.EFSTypes.FULL_SYNC_DX:
                                return ESyncTypes.FULL_SYNC_DX;
                            case LXNS.EFSTypes.FULL_SYNC_DX_PLUS:
                                return ESyncTypes.FULL_SYNC_DX_PLUS;
                            default:
                                return ESyncTypes.NONE;
                        }
                    })(),
                    dxRating: chart.dx_rating,
                    dxScore: chart.dx_score,
                };
            })
            .filter((v) => v !== null);
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
        REMASTER,
    }
    export enum EFCTypes {
        FULL_COMBO = "fc",
        FULL_COMBO_PLUS = "fcp",
        ALL_PERFECT = "ap",
        ALL_PERFECT_PLUS = "app",
    }
    export enum EFSTypes {
        SYNC = "sync",
        FULL_SYNC = "fs",
        FULL_SYNC_PLUS = "fsp",
        FULL_SYNC_DX = "fdx",
        FULL_SYNC_DX_PLUS = "fdxp",
    }
    export enum ERateTypes {
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
    export enum ESongTypes {
        UTAGE = "utage",
        STANDARD = "standard",
        DX = "dx",
    }
    export interface ISimpleScore {
        id: number;
        song_name: string;
        /**
         * Chart difficulty string.
         * `"7", "11+", "13", "14+", "15"`
         */
        level: string;
        level_index: ELevelIndex;
        fc: EFCTypes | null;
        fs: EFSTypes | null;
        rate: ERateTypes;
        type: ESongTypes;
    }
    export interface IScore extends ISimpleScore {
        achievements: number;
        dx_score: number;
        dx_rating: number;
        play_time: string;
        upload_time: string;
    }
    export interface ISong {
        id: number;
        title: string;
        artist: string;
        genre: string;
        bpm: number;
        version: number;
        rights: string;
        disabled: boolean;
        difficulties: {
            standard: ISongDifficultyNormal[];
            dx: ISongDifficultyNormal[];
            utage?: (ISongDifficultyUtageNormal | ISongDifficultyUtageBuddy)[];
        };
    }
    export interface ISongDifficulty {
        type: ESongTypes;
        difficulty: ELevelIndex;
        level: string;
        level_value: number;
        note_designer: string;
        version: number;
        notes?: INotes | IBuddyNotes;
    }
    export interface ISongDifficultyNormal extends ISongDifficulty {
        type: ESongTypes.STANDARD | ESongTypes.DX;
        notes?: INotes;
    }

    export interface ISongDifficultyUtage extends ISongDifficulty {
        type: ESongTypes.UTAGE;
        kanji: string;
        description: string;
    }
    export interface ISongDifficultyUtageNormal extends ISongDifficultyUtage {
        is_buddy: false;
        notes?: INotes;
    }
    export interface ISongDifficultyUtageBuddy extends ISongDifficultyUtage {
        is_buddy: true;
        notes?: IBuddyNotes;
    }
    export interface INotes {
        total: number;
        tap: number;
        hold: number;
        slide: number;
        touch: number;
        break: number;
    }
    export interface IBuddyNotes {
        left: INotes;
        right: INotes;
    }
    export interface IPlayer {
        name: string;
        rating: number;
        friend_code: number;
        trophy: any;
        trophy_name: string;
        course_rank: string;
        class_rank: string;
        star: number;
        icon: any;
        name_plate: any;
        frame: any;
        upload_time: any;
    }
    export interface IBest50Response {
        /**
         * Old versions total rating.
         */
        standard_total: number;
        /**
         * New version total rating.
         */
        dx_total: number;
        /**
         * Old versions top 35 scores.
         */
        standard: IScore[];
        /**
         * New version top 15 scores.
         */
        dx: IScore[];
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
     * Versions before Finale is the same as the Japanese version.
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
