import axios, { AxiosInstance } from "axios";
import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    ESyncTypes,
    IScore,
} from "@maidraw/type";
import ScoreTrackerAdapter from "..";
import { Cache } from "memory-cache";

export class KamaiTachi implements ScoreTrackerAdapter {
    private cache = new Cache<string, object>();

    private axios: AxiosInstance;
    constructor(
        auth?: never,
        private baseURL: string = "https://kamai.tachi.ac/",
        private readonly CURRENT_VERSION: KamaiTachi.EGameVersions = KamaiTachi
            .EGameVersions.PRISM
    ) {
        this.axios = axios.create({
            baseURL: this.baseURL,
        });
    }
    private async getRaw<T>(
        endpoint: string,
        data?: any,
        /**
         * Cache TTL in milliseconds. Defaults to 30 minutes.
         */
        cacheTTL: number = 30 * 60 * 1000,
        options: axios.AxiosRequestConfig = {}
    ): Promise<T | undefined> {
        const cacheKey = `${endpoint}-${JSON.stringify(data)}`;
        if (cacheTTL > 0) {
            const cacheContent = this.cache.get(cacheKey);
            if (cacheContent) return cacheContent as T;
        }
        return await this.axios
            .get(endpoint, { params: data, ...options })
            .then((r) => {
                if (cacheTTL > 0) {
                    this.cache.put(cacheKey, r.data, cacheTTL);
                }
                return r.data;
            })
            .catch((e) => {
                return e.response?.data || e;
            });
    }
    private async get<T>(
        endpoint: string,
        data?: any,
        /**
         * Cache TTL in milliseconds. Defaults to 30 minutes.
         */
        cacheTTL: number = 30 * 60 * 1000,
        options: axios.AxiosRequestConfig = {}
    ): Promise<KamaiTachi.IResponse<T> | undefined> {
        return this.getRaw<KamaiTachi.IResponse<T>>(
            endpoint,
            data,
            cacheTTL,
            options
        );
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
        }>(
            `/api/v1/users/${userId}/games/maimaidx/Single/pbs/all`,
            undefined,
            30 * 1000
        );
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
        currentVersion = this.CURRENT_VERSION,
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
            (v) => v.chart.data.displayVersion == currentVersion // Assume new scores does not have omnimix charts.
        );
        const oldScores = pbs.filter(
            (v) =>
                // Chart exists
                v.chart &&
                // Chart version is older than current Version
                KamaiTachi.compareGameVersions(
                    currentVersion,
                    v.chart.data.displayVersion
                ) > 0 &&
                (omnimix || // Omnimix is enabled, all charts are included.
                    !(
                        (
                            v.chart.versions[0].includes("-omni") && // Alternatively, if omnimix is disabled, check if the chart is included in omnimix folder of the latest version, (which should always happen).
                            v.chart.versions[1].includes("-omni")
                        ) // Then check if the second last version is a omnimix folder. If two omnimix folders occur in a row, it is a omnimix chart.
                    )) // Reject that case.
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
    async getPlayerProfilePicture(userId: string) {
        return (
            (await this.getRaw<Buffer>(
                `/api/v1/users/${userId}/pfp`,
                undefined,
                2 * 60 * 60 * 1000,
                { responseType: "arraybuffer" }
            )) || null
        );
    }
    public maimai() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.MAIMAI
        );
    }
    public maimaiPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.MAIMAI_PLUS
        );
    }
    public green() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.GREEN
        );
    }
    public greenPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.GREEN_PLUS
        );
    }
    public orange() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.ORANGE
        );
    }
    public orangePlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.ORANGE_PLUS
        );
    }
    public pink() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.PINK
        );
    }
    public pinkPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.PINK_PLUS
        );
    }
    public murasaki() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.MURASAKI
        );
    }
    public murasakiPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.MURASAKI_PLUS
        );
    }
    public milk() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.MILK
        );
    }
    public milkPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.MILK_PLUS
        );
    }
    public finale() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.FINALE
        );
    }
    public dx() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.DX
        );
    }
    public dxPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.DX_PLUS
        );
    }
    public splash() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.SPLASH
        );
    }
    public splashPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.SPLASH_PLUS
        );
    }
    public universe() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.UNIVERSE
        );
    }
    public universePlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.UNIVERSE_PLUS
        );
    }
    public festival() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.FESTIVAL
        );
    }
    public festivalPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.FESTIVAL_PLUS
        );
    }
    public buddies() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.BUDDIES
        );
    }
    public buddiesPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.BUDDIES_PLUS
        );
    }
    public prism() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.PRISM
        );
    }
    public prismPlus() {
        return new KamaiTachi(
            undefined,
            this.baseURL,
            KamaiTachi.EGameVersions.PRISM_PLUS
        );
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

    export enum EGameVersions {
        PRISM_PLUS = "maimaiでらっくす PRiSM PLUS",
        PRISM = "maimaiでらっくす PRiSM",
        BUDDIES_PLUS = "maimaiでらっくす BUDDiES PLUS",
        BUDDIES = "maimaiでらっくす BUDDiES",
        FESTIVAL_PLUS = "maimaiでらっくす FESTiVAL PLUS",
        FESTIVAL = "maimaiでらっくす FESTiVAL",
        UNIVERSE_PLUS = "maimaiでらっくす UNiVERSE PLUS",
        UNIVERSE = "maimaiでらっくす UNiVERSE",
        SPLASH_PLUS = "maimaiでらっくす Splash PLUS",
        SPLASH = "maimaiでらっくす Splash",
        DX_PLUS = "maimaiでらっくす PLUS",
        DX = "maimaiでらっくす",
        FINALE = "maimai FiNALE",
        MILK_PLUS = "maimai MiLK PLUS",
        MILK = "maimai MiLK",
        MURASAKI_PLUS = "maimai MURASAKi PLUS",
        MURASAKI = "maimai MURASAKi",
        PINK_PLUS = "maimai PiNK PLUS",
        PINK = "maimai PiNK",
        ORANGE_PLUS = "maimai ORANGE PLUS",
        ORANGE = "maimai ORANGE",
        GREEN_PLUS = "maimai GreeN PLUS",
        GREEN = "maimai GreeN",
        MAIMAI_PLUS = "maimai PLUS",
        MAIMAI = "maimai",
    }
    const GameVersions = [
        EGameVersions.MAIMAI,
        EGameVersions.MAIMAI_PLUS,
        EGameVersions.GREEN,
        EGameVersions.GREEN_PLUS,
        EGameVersions.ORANGE,
        EGameVersions.ORANGE_PLUS,
        EGameVersions.PINK,
        EGameVersions.PINK_PLUS,
        EGameVersions.MURASAKI,
        EGameVersions.MURASAKI_PLUS,
        EGameVersions.MILK,
        EGameVersions.MILK_PLUS,
        EGameVersions.FINALE,
        EGameVersions.DX,
        EGameVersions.DX_PLUS,
        EGameVersions.SPLASH,
        EGameVersions.SPLASH_PLUS,
        EGameVersions.UNIVERSE,
        EGameVersions.UNIVERSE_PLUS,
        EGameVersions.FESTIVAL,
        EGameVersions.FESTIVAL_PLUS,
        EGameVersions.BUDDIES,
        EGameVersions.BUDDIES_PLUS,
        EGameVersions.PRISM,
        EGameVersions.PRISM_PLUS,
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
        return GameVersions.indexOf(a) - GameVersions.indexOf(b);
    }
}
