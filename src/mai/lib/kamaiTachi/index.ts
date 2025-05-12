import { EDifficulty } from "@maidraw/mai/type";
import ScoreTrackerAdapter from "..";
import { Best50 } from "../../best50";

export class KamaiTachi extends ScoreTrackerAdapter {
    private readonly CURRENT_VERSION: KamaiTachi.EGameVersions;
    constructor({
        baseURL = "https://kamai.tachi.ac/",
        currentVersion = KamaiTachi.EGameVersions.PRISM,
    }: {
        baseURL?: string;
        currentVersion?: KamaiTachi.EGameVersions;
    } = {}) {
        super({ baseURL });
        this.CURRENT_VERSION = currentVersion;
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
    private toMaiDrawScore(
        score: KamaiTachi.IPb,
        chart: KamaiTachi.IChart,
        song: KamaiTachi.ISong
    ): Best50.IScore {
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
                        return Best50.EComboTypes.FULL_COMBO;
                    case "FULL COMBO+":
                        return Best50.EComboTypes.FULL_COMBO_PLUS;
                    case "ALL PERFECT":
                        return Best50.EComboTypes.ALL_PERFECT;
                    case "ALL PERFECT+":
                        return Best50.EComboTypes.ALL_PERFECT_PLUS;
                    default:
                        return Best50.EComboTypes.NONE;
                }
            })(),
            sync: Best50.ESyncTypes.NONE,
            achievement: score.scoreData.percent,
            achievementRank: (() => {
                switch (score.scoreData.grade) {
                    case "C":
                        return Best50.EAchievementTypes.C;
                    case "B":
                        return Best50.EAchievementTypes.B;
                    case "BB":
                        return Best50.EAchievementTypes.BB;
                    case "BBB":
                        return Best50.EAchievementTypes.BBB;
                    case "A":
                        return Best50.EAchievementTypes.A;
                    case "AA":
                        return Best50.EAchievementTypes.AA;
                    case "AAA":
                        return Best50.EAchievementTypes.AAA;
                    case "S":
                        return Best50.EAchievementTypes.S;
                    case "S+":
                        return Best50.EAchievementTypes.SP;
                    case "SS":
                        return Best50.EAchievementTypes.SS;
                    case "SS+":
                        return Best50.EAchievementTypes.SSP;
                    case "SSS":
                        return Best50.EAchievementTypes.SSS;
                    case "SSS+":
                        return Best50.EAchievementTypes.SSSP;
                    case "D":
                    default:
                        return Best50.EAchievementTypes.D;
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
        {
            currentVersion = this.CURRENT_VERSION,
            omnimix = true,
            use = "ALL",
        }: {
            currentVersion?: KamaiTachi.EGameVersions;
            omnimix?: boolean;
            use?: "AP" | "FC" | "ALL";
        } = {}
    ) {
        function APFilter(score: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }) {
            return (
                score.pb.scoreData.lamp == "ALL PERFECT" ||
                score.pb.scoreData.lamp == "ALL PERFECT+"
            );
        }
        function FCFilter(score: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }) {
            return (
                score.pb.scoreData.lamp == "FULL COMBO" ||
                score.pb.scoreData.lamp == "FULL COMBO+"
            );
        }
        function useFilter(score: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }) {
            switch (use) {
                case "AP":
                    return APFilter(score);
                case "FC":
                    return APFilter(score) || FCFilter(score);
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
        const newScores = pbs
            .filter(
                (v) => v.chart.data.displayVersion == currentVersion // Assume new scores does not have omnimix charts.
            )
            .filter(useFilter);
        const oldScores = pbs
            .filter(
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
            )
            .filter(useFilter);
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
    async getPlayerInfo(
        userId: string,
        options: {
            currentVersion?: KamaiTachi.EGameVersions;
            omnimix?: boolean;
            use?: "AP" | "FC" | "ALL";
        } = {
            currentVersion: this.CURRENT_VERSION,
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
        const basic = pbs.find(
            (v) =>
                v.chart.difficulty.includes("Basic") &&
                v.chart.data.inGameID == chartId
        );
        const advanced = pbs.find(
            (v) =>
                v.chart.difficulty.includes("Advanced") &&
                v.chart.data.inGameID == chartId
        );
        const expert = pbs.find(
            (v) =>
                v.chart.difficulty.includes("Expert") &&
                v.chart.data.inGameID == chartId
        );
        const master = pbs.find(
            (v) =>
                v.chart.difficulty.includes("Master") &&
                v.chart.data.inGameID == chartId
        );
        const remaster = pbs.find(
            (v) =>
                v.chart.difficulty.includes("Re:Master") &&
                v.chart.data.inGameID == chartId
        );
        const utage = pbs.find(
            (v) =>
                v.chart.difficulty.includes("Utage") &&
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
    public maimai() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.MAIMAI,
        });
    }
    public maimaiPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.MAIMAI_PLUS,
        });
    }
    public green() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.GREEN,
        });
    }
    public greenPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.GREEN_PLUS,
        });
    }
    public orange() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.ORANGE,
        });
    }
    public orangePlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.ORANGE_PLUS,
        });
    }
    public pink() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.PINK,
        });
    }
    public pinkPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.PINK_PLUS,
        });
    }
    public murasaki() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.MURASAKI,
        });
    }
    public murasakiPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.MURASAKI_PLUS,
        });
    }
    public milk() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.MILK,
        });
    }
    public milkPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.MILK_PLUS,
        });
    }
    public finale() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.FINALE,
        });
    }
    public dx() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.DX,
        });
    }
    public dxPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.DX_PLUS,
        });
    }
    public splash() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.SPLASH,
        });
    }
    public splashPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.SPLASH_PLUS,
        });
    }
    public universe() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.UNIVERSE,
        });
    }
    public universePlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.UNIVERSE_PLUS,
        });
    }
    public festival() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.FESTIVAL,
        });
    }
    public festivalPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.FESTIVAL_PLUS,
        });
    }
    public buddies() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.BUDDIES,
        });
    }
    public buddiesPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.BUDDIES_PLUS,
        });
    }
    public prism() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.PRISM,
        });
    }
    public prismPlus() {
        return new KamaiTachi({
            currentVersion: KamaiTachi.EGameVersions.PRISM_PLUS,
        });
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
