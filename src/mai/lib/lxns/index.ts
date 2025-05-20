import { EDifficulty } from "@maidraw/mai/type";
import ScoreTrackerAdapter from "..";
import { Chart } from "@maidraw/mai/chart";
import { Best50 } from "../../best50";

export class LXNS extends ScoreTrackerAdapter {
    constructor({
        auth,
        baseURL = "https://maimai.lxns.net/api/v0/maimai",
    }: {
        auth: string;
        baseURL?: string;
    }) {
        super({ baseURL });
        this.axios.defaults.headers.common["Authorization"] = auth;
    }
    async getPlayerBest50(username: string) {
        const b50 = await this.getPlayerRawBest50(username);
        if (!b50?.data) return null;
        let chartList: Best50.IChart[];
        if (Chart.Database.hasLocalDatabase()) {
            chartList = [...b50.data.dx, ...b50.data.standard]
                .map((chart) => {
                    return Chart.Database.getLocalChart(
                        chart.id +
                            (chart.type == LXNS.ESongTypes.DX ? 10000 : 0),
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
                                    .filter((v) => v.version.region == "CN")
                                    .filter((v) => v.type == "existence")
                                    .sort(
                                        (a, b) =>
                                            a.version.gameVersion.release -
                                            b.version.gameVersion.release
                                    )
                                    .pop()?.data.level;
                            })() || v.level,
                        difficulty: v.difficulty,
                        maxDxScore: v.meta.maxDXScore,
                    };
                });
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
        return await this.get<LXNS.IAPIResponse<LXNS.IBest50Response>>(
            `/player/${friendCode}/bests`,
            undefined,
            60 * 1000
        );
    }
    async getPlayerRawProfile(friendCode: string) {
        return await this.get<LXNS.IAPIResponse<LXNS.IPlayer>>(
            `/player/${friendCode}`
        );
    }
    async getSong(songId: number): Promise<LXNS.ISong> {
        const songList = await this.getSongList();
        return songList.songs.filter((song) => song.id === songId)[0];
    }
    async getSongList(): Promise<LXNS.ISongListResponse> {
        const cached = (await this.cache.get(
            "lxns-songList-maimai"
        )) as LXNS.ISongListResponse | null;
        if (cached) return cached;
        const res = (await this.get<LXNS.ISongListResponse>(`/song/list`, {
            notes: true,
        }).catch(() => {})) || {
            songs: [],
            genres: [],
            versions: [],
        };
        this.cache.put("lxns-songList-maimai", res, 24 * 60 * 60 * 1000);
        return res;
    }
    async getMaiDrawChartList(): Promise<Best50.IChart[]> {
        const songList = await this.getSongList();
        const std: Best50.IChart[] = songList.songs.flatMap((song) => {
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
        const dx: Best50.IChart[] = songList.songs.flatMap((song) => {
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
        const utage: Best50.IChart[] = songList.songs
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
        chartList: Best50.IChart[]
    ): Best50.IScore[] {
        return scores
            .map((chart) => {
                const chartDetail = chartList.find(
                    (v) =>
                        v.id ===
                            chart.id +
                                (chart.type == LXNS.ESongTypes.DX
                                    ? 10000
                                    : 0) &&
                        v.difficulty ==
                            (chart.level_index as unknown as EDifficulty)
                );
                if (!chartDetail) return null;
                return {
                    chart: chartDetail,
                    achievement: chart.achievements,
                    achievementRank: (() => {
                        switch (chart.rate) {
                            case LXNS.ERateTypes.C:
                                return Best50.EAchievementTypes.C;
                            case LXNS.ERateTypes.B:
                                return Best50.EAchievementTypes.B;
                            case LXNS.ERateTypes.BB:
                                return Best50.EAchievementTypes.BB;
                            case LXNS.ERateTypes.BBB:
                                return Best50.EAchievementTypes.BBB;
                            case LXNS.ERateTypes.A:
                                return Best50.EAchievementTypes.A;
                            case LXNS.ERateTypes.AA:
                                return Best50.EAchievementTypes.AA;
                            case LXNS.ERateTypes.AAA:
                                return Best50.EAchievementTypes.AAA;
                            case LXNS.ERateTypes.S:
                                return Best50.EAchievementTypes.S;
                            case LXNS.ERateTypes.SP:
                                return Best50.EAchievementTypes.SP;
                            case LXNS.ERateTypes.SS:
                                return Best50.EAchievementTypes.SS;
                            case LXNS.ERateTypes.SSP:
                                return Best50.EAchievementTypes.SSP;
                            case LXNS.ERateTypes.SSS:
                                return Best50.EAchievementTypes.SSS;
                            case LXNS.ERateTypes.SSSP:
                                return Best50.EAchievementTypes.SSSP;
                            default:
                                return Best50.EAchievementTypes.D;
                        }
                    })(),
                    combo: (() => {
                        switch (chart.fc) {
                            case LXNS.EFCTypes.FULL_COMBO:
                                return Best50.EComboTypes.FULL_COMBO;
                            case LXNS.EFCTypes.FULL_COMBO_PLUS:
                                return Best50.EComboTypes.FULL_COMBO_PLUS;
                            case LXNS.EFCTypes.ALL_PERFECT:
                                return Best50.EComboTypes.ALL_PERFECT;
                            case LXNS.EFCTypes.ALL_PERFECT_PLUS:
                                return Best50.EComboTypes.ALL_PERFECT_PLUS;
                            default:
                                return Best50.EComboTypes.NONE;
                        }
                    })(),
                    sync: (() => {
                        switch (chart.fs) {
                            case LXNS.EFSTypes.SYNC:
                                return Best50.ESyncTypes.SYNC_PLAY;
                            case LXNS.EFSTypes.FULL_SYNC:
                                return Best50.ESyncTypes.FULL_SYNC;
                            case LXNS.EFSTypes.FULL_SYNC_PLUS:
                                return Best50.ESyncTypes.FULL_SYNC_PLUS;
                            case LXNS.EFSTypes.FULL_SYNC_DX:
                                return Best50.ESyncTypes.FULL_SYNC_DX;
                            case LXNS.EFSTypes.FULL_SYNC_DX_PLUS:
                                return Best50.ESyncTypes.FULL_SYNC_DX_PLUS;
                            default:
                                return Best50.ESyncTypes.NONE;
                        }
                    })(),
                    dxRating: chart.dx_rating,
                    dxScore: chart.dx_score,
                };
            })
            .filter((v) => v !== null);
    }
    async getPlayerProfilePicture(username: string): Promise<Buffer | null> {
        const player = await this.getPlayerRawProfile(username);
        if (!player?.data) return null;
        const iconInfo = player.data.icon;
        const iconImage = await this.get<Buffer>(
            `/maimai/icon/${iconInfo.id}.png`,
            undefined,
            24 * 60 * 60 * 1000,
            {
                baseURL: "https://assets2.lxns.net",
                responseType: "arraybuffer",
            }
        );
        if (!iconImage) return null;
        return iconImage;
    }
    async getPlayerScore(username: string, chartId: number) {
        return {
            basic: null,
            advanced: null,
            expert: null,
            master: null,
            remaster: null,
            utage: null,
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
        icon: ICollection;
        name_plate: ICollection;
        frame: ICollection;
        upload_time: any;
    }
    export interface ICollection {
        id: number;
        name: string;
        color: string;
        description: string;
        genre: string;
        required: any;
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
