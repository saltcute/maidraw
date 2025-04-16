import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    ESyncTypes,
    IScore,
} from "@maidraw/chu/type";
import ScoreTrackerAdapter from "..";

export class KamaiTachi extends ScoreTrackerAdapter {
    private readonly CURRENT_VERSION: KamaiTachi.EGameVersions;
    constructor({
        baseURL = "https://kamai.tachi.ac/",
        currentVersion = KamaiTachi.EGameVersions.CHUNITHM_SUN_PLUS,
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
            `/api/v1/users/${userId}/games/chunithm/Single/pbs/all`,
            undefined,
            60 * 1000
        );
    }
    async getPlayerRecentPB(userId: string) {
        return this.get<
            KamaiTachi.IResponse<{
                charts: KamaiTachi.IChart[];
                pbs: KamaiTachi.IPb[];
                songs: KamaiTachi.ISong[];
            }>
        >(
            `/api/v1/users/${userId}/games/chunithm/Single/scores/recent`,
            undefined,
            60 * 1000
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
                    level: chart.levelNum,
                };
            })(),
            combo: (() => {
                switch (score.scoreData.lamp) {
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
            rating: score.calculatedData.rating,
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
            (v) => v.song.data.displayVersion == currentVersion
        );
        const oldScores = pbs.filter(
            (v) =>
                v.chart &&
                KamaiTachi.compareGameVersions(
                    currentVersion,
                    v.song.data.displayVersion
                ) > 0 &&
                (omnimix ||
                    !(
                        v.chart.versions[0].includes("-omni") &&
                        v.chart.versions[1].includes("-omni")
                    ))
        );
        return {
            new: newScores
                .sort((a, b) =>
                    b.pb.calculatedData.rating - a.pb.calculatedData.rating
                        ? b.pb.calculatedData.rating -
                          a.pb.calculatedData.rating
                        : b.pb.scoreData.score - a.pb.scoreData.score
                )
                .slice(0, 20)
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song)),
            old: oldScores
                .sort((a, b) =>
                    b.pb.calculatedData.rating - a.pb.calculatedData.rating
                        ? b.pb.calculatedData.rating -
                          a.pb.calculatedData.rating
                        : b.pb.scoreData.score - a.pb.scoreData.score
                )
                .slice(0, 30)
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song)),
            best: pbs
                .sort((a, b) =>
                    b.pb.calculatedData.rating - a.pb.calculatedData.rating
                        ? b.pb.calculatedData.rating -
                          a.pb.calculatedData.rating
                        : b.pb.scoreData.score - a.pb.scoreData.score
                )
                .slice(0, 50)
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song)),
        };
    }
    async getPlayerRecent40(
        userId: string,
        currentVersion = this.CURRENT_VERSION,
        omnimix = true
    ) {
        const rawPBs = await this.getPlayerPB(userId);
        const rawRecents = await this.getPlayerRecentPB(userId);
        if (!rawPBs?.body || !rawRecents?.body) return null;
        const pbs: {
            chart: KamaiTachi.IChart;
            song: KamaiTachi.ISong;
            pb: KamaiTachi.IPb;
        }[] = [];
        const recents: {
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
        for (const recent of rawPBs.body.pbs) {
            let chart = rawRecents.body.charts.find(
                (v) => v.chartID == recent.chartID
            );
            let song = rawRecents.body.songs.find((v) => v.id == recent.songID);
            if (chart && song) {
                recents.push({ pb: recent, chart, song });
            }
        }
        const bestScores = pbs.filter(
            (v) =>
                v.chart &&
                KamaiTachi.compareGameVersions(
                    currentVersion,
                    v.song.data.displayVersion
                ) >= 0 &&
                (omnimix ||
                    !(
                        v.chart.versions[0].includes("-omni") &&
                        v.chart.versions[1].includes("-omni")
                    ))
        );
        const recentScores = recents.filter(
            (v) =>
                v.chart &&
                KamaiTachi.compareGameVersions(
                    currentVersion,
                    v.song.data.displayVersion
                ) >= 0 &&
                (omnimix ||
                    !(
                        v.chart.versions[0].includes("-omni") &&
                        v.chart.versions[1].includes("-omni")
                    ))
        );
        function ratingGuardSimulation(scores: IScore[]) {
            let r30: {
                score: IScore;
                order: number;
            }[] = [];
            for (let i = 0; i < scores.length; i++) {
                const score = scores[i];
                if (r30.length < 30) {
                    r30.push({ score, order: i });
                } else {
                    switch (score.rank) {
                        case EAchievementTypes.SSS:
                        case EAchievementTypes.SSSP:
                            while (r30.length > 30) {
                                r30.shift();
                            }
                            if (r30.length >= 30) {
                                const best10 = r30.sort((a, b) =>
                                    a.score.rating == b.score.rating
                                        ? b.score.score - a.score.score
                                        : b.score.rating - a.score.rating
                                );
                                for (let j = 0; j < r30.length; ++j) {
                                    if (!best10.includes(r30[j])) {
                                        r30[j] = { score, order: i };
                                        break;
                                    }
                                }
                                r30 = r30.sort((a, b) => a.order - b.order);
                                break;
                            }
                        default:
                            r30.push({ score, order: i });
                            while (r30.length > 30) {
                                r30.shift();
                            }
                    }
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
        return {
            recent: ratingGuardSimulation(
                recentScores.map((v) =>
                    this.toMaiDrawScore(v.pb, v.chart, v.song)
                )
            ),
            best: bestScores
                .sort((a, b) =>
                    b.pb.calculatedData.rating - a.pb.calculatedData.rating
                        ? b.pb.calculatedData.rating -
                          a.pb.calculatedData.rating
                        : b.pb.scoreData.score - a.pb.scoreData.score
                )
                .slice(0, 50)
                .map((v) => this.toMaiDrawScore(v.pb, v.chart, v.song)),
        };
    }
    async getPlayerInfo(userId: string, type: "new" | "recents") {
        const profile = await this.getPlayerProfileRaw(userId);
        if (type == "new") {
            const scores = await this.getPlayerBest50(userId);
            if (!profile?.body || !scores) return null;
            let rating = 0;
            [...scores.new, ...scores.old].forEach((v) => (rating += v.rating));
            return {
                name: profile?.body.username,
                rating: rating / 50,
            };
        } else if (type == "recents") {
            const scores = await this.getPlayerRecent40(userId);
            if (!profile?.body || !scores) return null;
            let rating = 0;
            [...scores.recent, ...scores.best.slice(0, 30)].forEach(
                (v) => (rating += v.rating)
            );
            return {
                name: profile?.body.username,
                rating: rating / 40,
            };
        } else return null;
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
    export interface IPb {
        chartID: string;
        userID: number;
        calculatedData: {
            rating: number;
        };
        composedFrom: {
            name: string;
            scoreID: string;
        }[];
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
            lamp: string;
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
                lamp: number;
                grade: number;
            };
        };
        songID: number;
        timeAchieved: number;
    }

    export enum EGameVersions {
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
