import { BaseScoreAdapter } from "@maidraw/lib/adapter";
import { FailedToFetchError, UnsupportedMethodError } from "@maidraw/lib/error";
import * as Database from "@maidraw/mai/lib/database";
import {
    EAchievementTypes,
    EComboTypes,
    EDifficulty,
    ESyncTypes,
    type IScore,
} from "@maidraw/mai/type";
import * as Cheerio from "cheerio";
import type { MaimaiScoreAdapter } from "..";

export class Maishift extends BaseScoreAdapter implements MaimaiScoreAdapter {
    constructor() {
        super({
            baseURL: "https://maimai.shiftpsh.com/en",
        });
    }
    private readonly CURRENT_MINOR = 60;
    private minorToAccumulateVer(minor: number, isDX: boolean = true) {
        if (isDX) {
            if (minor >= 60) return 25;
            if (minor >= 55) return 24;
            if (minor >= 50) return 23;
            if (minor >= 45) return 22;
            if (minor >= 40) return 21;
            if (minor >= 35) return 20;
            if (minor >= 30) return 19;
            if (minor >= 25) return 18;
            if (minor >= 20) return 17;
            if (minor >= 15) return 16;
            if (minor >= 10) return 15;
            if (minor >= 5) return 14;
            return 13;
        } else {
            if (minor >= 97) return 12;
            if (minor >= 95) return 11;
            if (minor >= 90) return 10;
            if (minor >= 85) return 9;
            if (minor >= 80) return 8;
            if (minor >= 70) return 7;
            if (minor >= 60) return 6;
            if (minor >= 50) return 5;
            if (minor >= 40) return 4;
            if (minor >= 30) return 3;
            if (minor >= 20) return 2;
            if (minor >= 10) return 1;
            return 0;
        }
    }
    private async profileScraper(username: string) {
        const HTML = await this.get<string>(
            `/profile/${username}/home`,
            undefined,
            1 * 60 * 1000,
        );
        if (!HTML) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "player profile",
                    "An unknown error has occured.",
                ),
            };
        }
        if (this.isPagePrivate(HTML)) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "player profile",
                    "The user does not have any score or their profile is private.",
                ),
            };
        }
        const $ = Cheerio.load(HTML.replace(/<style.*?>.*?<\/style>/g, ""));
        const profileElement = $("> div", $("body > div")[2])[1];
        const name = $($("> div > span", $("> div", profileElement))[0]).text();
        const avatarUrl = $("> img", profileElement).attr("src");
        const title = $($("> div", $("> div", profileElement))[0]).text();
        const rating = parseInt(
            $($("> div > div", $("> div", profileElement))[1]).text(),
            10,
        );
        if (!name || !avatarUrl || Number.isNaN(rating)) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "player profile",
                    "Failed to parse player profile.",
                ),
            };
        }
        return { data: { name, avatarUrl, title, rating } };
    }
    private getScoresFromDOM($: Cheerio.CheerioAPI, length: number) {
        const DOM = $("> div > div", $("> div", $("body > div")[4])[2]).slice(
            0,
            length,
        );
        const scores = [];
        for (const score of DOM) {
            const level = parseFloat(
                $($("> div", score)[0]).text().replace("+", ""),
            );
            const name = $($("> span", $("> div", score)[1])[0]).text();
            const rank = $($("> div", score)[2]).text();
            const combo = $($("> div", score)[3]).text();
            const sync = $($("> div", score)[4]).text();
            const rating = parseInt(
                $($("> span", $("> div", score)[5])[1]).text(),
                10,
            );
            const rate = parseInt(
                $($("> span", $("> div", score)[5])[0])
                    .text()
                    .replace(".", "")
                    .replace("%", ""),
                10,
            );
            const isDX =
                $($("> img", $("> div", $("> div", score)[1])[0])[0]).attr(
                    "alt",
                ) === "DX";
            if (
                name &&
                level &&
                !Number.isNaN(rate) &&
                !Number.isNaN(rating) &&
                rank
            )
                scores.push({
                    rank,
                    level,
                    rating,
                    name,
                    rate,
                    combo,
                    sync,
                    isDX,
                });
        }
        return scores;
    }
    private async best50Scraper(username: string) {
        const scoresHTML = await this.get<string>(
            `/profile/${username}/records?&v=${(() => {
                if (this.minorToAccumulateVer(this.CURRENT_MINOR) >= 25) {
                    return `${this.minorToAccumulateVer(this.CURRENT_MINOR)},${this.minorToAccumulateVer(this.CURRENT_MINOR) - 1}`;
                } else {
                    return `${this.minorToAccumulateVer(this.CURRENT_MINOR)}`;
                }
            })()}&sort=rating&order=desc`,
            undefined,
            1 * 60 * 1000,
        );
        if (!scoresHTML) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "personal best scores",
                    "An unknown error has occured.",
                ),
            };
        }
        if (this.isPagePrivate(scoresHTML)) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "personal best scores",
                    "The user does not have any score or their profile is private.",
                ),
            };
        }
        const oldScoresHTML = await this.get<string>(
            `/profile/${username}/records?&v=${(() => {
                if (this.minorToAccumulateVer(this.CURRENT_MINOR) >= 25) {
                    return encodeURI(
                        Array.from(
                            Array(
                                this.minorToAccumulateVer(this.CURRENT_MINOR) -
                                    1,
                            ).keys(),
                        ).join(","),
                    );
                } else {
                    return encodeURI(
                        Array.from(
                            Array(
                                this.minorToAccumulateVer(this.CURRENT_MINOR),
                            ).keys(),
                        ).join(","),
                    );
                }
            })()}&sort=rating&order=desc`,
            undefined,
            1 * 60 * 1000,
        );
        if (!oldScoresHTML) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "personal best scores",
                    "An unknown error has occured.",
                ),
            };
        }
        if (this.isPagePrivate(oldScoresHTML)) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "personal best scores",
                    "The user does not have any score or their profile is private.",
                ),
            };
        }
        const $new = Cheerio.load(
            scoresHTML.replace(/<style.*?>.*?<\/style>/g, ""),
        );
        const $old = Cheerio.load(
            oldScoresHTML.replace(/<style.*?>.*?<\/style>/g, ""),
        );

        const newScores = this.getScoresFromDOM($new, 15);
        const oldScores = this.getScoresFromDOM($old, 35);

        return { data: { newScores, oldScores } };
    }
    async getPlayerInfo(username: string) {
        return await this.profileScraper(username);
    }
    async getPlayerProfilePicture(username: string) {
        const res = await this.profileScraper(username);
        if (res.err) return res;
        const buffer = await this.get<Buffer>(
            res.data.avatarUrl,
            undefined,
            2 * 60 * 60 * 1000,
            {
                responseType: "arraybuffer",
            },
        );
        if (!(buffer instanceof Buffer)) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "player profile picture",
                    "An unknown error has occured.",
                ),
            };
        }
        return { data: buffer };
    }
    async getPlayerBest50(username: string) {
        const res = await this.best50Scraper(username);
        if (res.err) return res;
        const scores: IScore[] = [];
        const oldScores: IScore[] = [];
        for (const score of res.data.newScores) {
            const converted = await this.toMaiDrawScore(score);
            if (converted) scores.push(converted);
        }
        for (const score of res.data.oldScores) {
            const converted = await this.toMaiDrawScore(score);
            if (converted) oldScores.push(converted);
        }
        return { data: { new: scores, old: oldScores } };
    }
    private isPagePrivate(HTML: string) {
        return [
            "No Record Found or Profile is Private",
            "找不到記錄或個人檔案設為私人",
            "기록이 존재하지 않거나 비공개입니다",
        ].some((s) => HTML.includes(s));
    }
    private async scoreScraper(
        username: string,
        chartId: number,
        difficulty: EDifficulty,
    ) {
        const chart = Database.getLocalChart(chartId, difficulty);
        if (!chart) return { data: null };
        const addVersion = chart.addVersion.EX ?? chart.addVersion.DX;
        if (!addVersion) return { data: null };
        const accumulateVer = this.minorToAccumulateVer(
            addVersion?.gameVersion.minor,
            chartId > 10000,
        );
        const level =
            (chart.events
                .filter(
                    (e): e is Database.Events.Existence =>
                        e.type === "existence" &&
                        (e.version.region === "EX" ||
                            e.version.region === "DX"),
                )
                .find((e) => e.version.gameVersion.minor >= this.CURRENT_MINOR)
                ?.data.level as number) ?? chart.level;

        const params = new URLSearchParams();
        params.append("version", accumulateVer.toString());
        params.append(
            "level",
            `${Math.trunc(level * 10 - 5)},${Math.trunc(level * 10 + 5)}`,
        );
        params.append("chartType", chartId > 10000 ? "DX" : "STANDARD");
        params.append(
            "difficulty",
            difficulty === EDifficulty.REMASTER
                ? "RE_MASTER"
                : EDifficulty[difficulty],
        );
        params.append("sort", "rating");
        params.append("order", "desc");
        const HTML = await this.get<string>(
            `/profile/${username}/records?${params.toString()}`,
            undefined,
            1 * 60 * 1000,
        );
        if (!HTML) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "player score",
                    "An unknown error has occured.",
                ),
            };
        }
        if (this.isPagePrivate(HTML)) {
            return {
                err: new FailedToFetchError(
                    "maidraw.maimai.adapter.maishift",
                    "player score",
                    "The user does not have any score or their profile is private.",
                ),
            };
        }
        const $ = Cheerio.load(HTML.replace(/<style.*?>.*?<\/style>/g, ""));
        const scores = this.getScoresFromDOM($, 100);
        return {
            data:
                scores.find(
                    (s) => s.name === chart.name && s.isDX === chartId > 10000,
                ) ?? null,
        };
    }

    async getPlayerScore(username: string, chartId: number) {
        const res: {
            basic: IScore | null;
            advanced: IScore | null;
            expert: IScore | null;
            master: IScore | null;
            remaster: IScore | null;
            utage: IScore | null;
        } = {
            basic: null,
            advanced: null,
            expert: null,
            master: null,
            remaster: null,
            utage: null,
        };
        for (
            let difficulty = EDifficulty.BASIC;
            difficulty <= EDifficulty.REMASTER;
            difficulty++
        ) {
            const score = await this.scoreScraper(
                username,
                chartId,
                difficulty,
            );
            if (score.err) {
                return { err: score.err };
            }
            if (score.data) {
                res[EDifficulty[difficulty].toLowerCase() as keyof typeof res] =
                    await this.toMaiDrawScore(score.data);
            }
        }
        return { data: res };
    }
    async toMaiDrawScore(score: {
        rank: string;
        level: number;
        rating: number;
        name: string;
        rate: number;
        combo: string;
        sync: string;
        isDX: boolean;
    }): Promise<IScore | null> {
        const chart = await Database.findLocalChartWithNameAndLevel(
            score.name,
            score.level,
            score.isDX,
        );
        if (!chart) {
            console.log(score.name);
            return null;
        }
        return {
            chart: {
                id: chart.id,
                name: chart.name,
                difficulty: chart.difficulty,
                level: chart.level,
                maxDxScore: chart.meta.maxDXScore,
            },
            combo: (() => {
                switch (score.combo) {
                    case "FC":
                        return EComboTypes.FULL_COMBO;
                    case "FC+":
                        return EComboTypes.FULL_COMBO_PLUS;
                    case "AP":
                        return EComboTypes.ALL_PERFECT;
                    case "AP+":
                        return EComboTypes.ALL_PERFECT_PLUS;
                    default:
                        return EComboTypes.NONE;
                }
            })(),
            sync: (() => {
                switch (score.sync) {
                    case "SYNC":
                        return ESyncTypes.SYNC_PLAY;
                    case "FS":
                        return ESyncTypes.FULL_SYNC;
                    case "FS+":
                        return ESyncTypes.FULL_SYNC_PLUS;
                    case "FDX":
                        return ESyncTypes.FULL_SYNC_DX;
                    case "FDX+":
                        return ESyncTypes.FULL_SYNC_DX_PLUS;
                    default:
                        return ESyncTypes.NONE;
                }
            })(),
            achievement: score.rate / 10000,
            achievementRank: (() => {
                switch (score.rank) {
                    case "SSS+":
                        return EAchievementTypes.SSSP;
                    case "SSS":
                        return EAchievementTypes.SSS;
                    case "SS+":
                        return EAchievementTypes.SSP;
                    case "SS":
                        return EAchievementTypes.SS;
                    case "S+":
                        return EAchievementTypes.SP;
                    case "S":
                        return EAchievementTypes.S;
                    case "AAA":
                        return EAchievementTypes.AAA;
                    case "AA":
                        return EAchievementTypes.AA;
                    case "A":
                        return EAchievementTypes.A;
                    case "BBB":
                        return EAchievementTypes.BBB;
                    case "BB":
                        return EAchievementTypes.BB;
                    case "B":
                        return EAchievementTypes.B;
                    case "C":
                        return EAchievementTypes.C;
                    default:
                        return EAchievementTypes.D;
                }
            })(),
            dxRating: score.rating,
            dxScore: -1,
        };
    }
    async getPlayerLevel50(
        _username: string,
        _level: number,
        _page: number,
        _options: { percise: boolean },
    ) {
        return {
            err: new UnsupportedMethodError(
                "maidraw.maimai.adapter.maishift",
                "getPlayerLevel50",
            ),
        };
    }
}
