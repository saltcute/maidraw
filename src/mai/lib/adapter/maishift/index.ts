import * as Cheerio from "cheerio";

import { MaimaiScoreAdapter } from "..";

import {
    IScore,
    ESyncTypes,
    EComboTypes,
    EAchievementTypes,
    EDifficulty,
} from "@maidraw/mai/type";
import { Database } from "@maidraw/mai/lib/database";

type IBest50ResponseData = {
    "invalid-user": {
        username: string;
    };
};
type IProfileResponseData = IBest50ResponseData & {};
type IProfilePictureResponseData = IBest50ResponseData & {
    "download-failure": {
        username: string;
    };
};
type IScoreResponseData = IBest50ResponseData & {};
type ILevel50ResponseData = {
    "not-supported": null;
};
type IResponseData = {
    best50: IBest50ResponseData;
    profile: IProfileResponseData;
    profilePicture: IProfilePictureResponseData;
    score: IScoreResponseData;
    level50: ILevel50ResponseData;
};

export class Maishift extends MaimaiScoreAdapter<IResponseData> {
    constructor() {
        super({
            baseURL: "https://maimai.shiftpsh.com",
            name: ["maidraw", "adapter", "maishift"],
        });
    }
    private readonly CURRENT_MINOR = 55;
    private readonly CURRENT_ACCUMULATE_VER = 24;
    private minorToAccumulateVer(minor: number, isDX: boolean) {
        if (isDX) {
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
            1 * 60 * 1000
        );
        if (!HTML) return null;
        const $ = Cheerio.load(HTML.replace(/<style.*?>.*?<\/style>/g, ""));
        const profileElement = $("> div", $("body > div")[0])[2];
        const name = $($("> div > span", $("> div", profileElement))[0]).text();
        const avatarUrl = $("> img", profileElement).attr("src");
        const title = $($("> div", $("> div", profileElement))[0]).text();
        const rating = parseInt(
            $($("> div > div", $("> div", profileElement))[1]).text()
        );
        if (!name || isNaN(rating)) return null;
        return { name, avatarUrl, title, rating };
    }
    private getScoresFromDOM($: Cheerio.CheerioAPI, length: number) {
        const DOM = $("body > div > div").slice(15, 15 + length);
        const scores = [];
        for (const score of DOM) {
            const level = parseFloat(
                $($("> div", score)[0]).text().replace("+", "")
            );
            const name = $($("> span", $("> div", score)[1])[0]).text();
            const rank = $($("> div", score)[2]).text();
            const combo = $($("> div", score)[3]).text();
            const sync = $($("> div", score)[4]).text();
            const rating = parseInt(
                $($("> span", $("> div", score)[5])[1]).text()
            );
            const rate = parseInt(
                $($("> span", $("> div", score)[5])[0])
                    .text()
                    .replace(".", "")
                    .replace("%", "")
            );
            const isDX =
                $($("> img", $("> div", $("> div", score)[1])[0])[0]).attr(
                    "alt"
                ) == "DX";
            if (name && level && !isNaN(rate) && !isNaN(rating) && rank)
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
            `/profile/${username}/records?&version=${this.CURRENT_ACCUMULATE_VER}&sort=rating&order=desc`,
            undefined,
            1 * 60 * 1000
        );
        const oldScoresHTML = await this.get<string>(
            `/profile/${username}/records?&version=${encodeURI(Array.from(Array(this.CURRENT_ACCUMULATE_VER).keys()).join(","))}&sort=rating&order=desc`,
            undefined,
            1 * 60 * 1000
        );
        if (!scoresHTML || !oldScoresHTML) return null;
        const $new = Cheerio.load(
            scoresHTML.replace(/<style.*?>.*?<\/style>/g, "")
        );
        const $old = Cheerio.load(
            oldScoresHTML.replace(/<style.*?>.*?<\/style>/g, "")
        );

        const newScores = this.getScoresFromDOM($new, 15);
        const oldScores = this.getScoresFromDOM($old, 35);

        return { newScores, oldScores };
    }
    async getPlayerInfo(username: string) {
        const profile = await this.profileScraper(username);
        if (!profile) {
            const res = {
                status: "invalid-user",
                message: `Cannot find the profile of user ${username}.`,
                data: { username },
            } as const;
            return res;
        }
        const res = {
            status: "success",
            message: "",
            data: {
                name: profile.name,
                rating: profile.rating,
            },
        } as const;
        return res;
    }
    async getPlayerProfilePicture(username: string) {
        const profile = await this.profileScraper(username);
        if (!profile?.avatarUrl) {
            const res = {
                status: "invalid-user",
                message: `Cannot find the profile of user ${username}.`,
                data: { username },
            } as const;
            return res;
        }
        const buffer = await this.get<Buffer>(
            profile.avatarUrl,
            undefined,
            2 * 60 * 60 * 1000,
            {
                responseType: "arraybuffer",
            }
        );
        if (!(buffer instanceof Buffer)) {
            const res = {
                status: "download-failure",
                message: `Failed to download the profile picture of user ${username}.`,
                data: { username },
            } as const;
            return res;
        }
        const res = {
            status: "success",
            message: "",
            data: buffer,
        } as const;
        return res;
    }
    async getPlayerBest50(username: string) {
        const rawScores = await this.best50Scraper(username);
        if (!rawScores) {
            const res = {
                status: "invalid-user",
                message: `Cannot find the profile of user ${username}.`,
                data: { username },
            } as const;
            return res;
        }
        const newScores: IScore[] = [];
        const oldScores: IScore[] = [];
        for (const score of rawScores.newScores) {
            const converted = await this.toMaiDrawScore(score);
            if (converted) newScores.push(converted);
        }
        for (const score of rawScores.oldScores) {
            const converted = await this.toMaiDrawScore(score);
            if (converted) oldScores.push(converted);
        }
        const res = {
            status: "success",
            message: "",
            data: { new: newScores, old: oldScores },
        } as const;
        return res;
    }
    private async scoreScraper(
        username: string,
        chartId: number,
        difficulty: EDifficulty
    ) {
        const chart = Database.getLocalChart(chartId, difficulty);
        if (!chart) return null;
        const addVersion = chart.addVersion.EX ?? chart.addVersion.DX;
        if (!addVersion) return null;
        const accumulateVer = this.minorToAccumulateVer(
            addVersion?.gameVersion.minor,
            chartId > 10000
        );
        const level =
            (chart.events
                .filter(
                    (e) =>
                        e.type == "existence" &&
                        (e.version.region == "EX" || e.version.region == "DX")
                )
                .find((e) => e.version.gameVersion.minor >= this.CURRENT_MINOR)
                ?.data.level as number) ?? chart.level;

        const params = new URLSearchParams();
        params.append("version", accumulateVer.toString());
        params.append(
            "level",
            `${Math.trunc(level * 10 - 5)},${Math.trunc(level * 10 + 5)}`
        );
        params.append("chartType", chartId > 10000 ? "DX" : "STANDARD");
        params.append(
            "difficulty",
            difficulty == EDifficulty.REMASTER
                ? "RE_MASTER"
                : EDifficulty[difficulty]
        );
        params.append("sort", "rating");
        params.append("order", "desc");
        const HTML = await this.get<string>(
            `/profile/${username}/records?${params.toString()}`,
            undefined,
            1 * 60 * 1000
        );
        if (!HTML) return null;
        const $ = Cheerio.load(HTML.replace(/<style.*?>.*?<\/style>/g, ""));
        const scores = this.getScoresFromDOM($, 100);
        return (
            scores.find(
                (s) => s.name == chart.name && s.isDX == chartId > 10000
            ) || null
        );
    }

    async getPlayerScore(username: string, chartId: number) {
        const base: {
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
                difficulty
            );
            if (score) {
                base[
                    EDifficulty[difficulty].toLowerCase() as keyof typeof base
                ] = await this.toMaiDrawScore(score);
            }
        }
        const res = {
            status: "success",
            message: "",
            data: base,
        } as const;
        return res;
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
            score.isDX
        );
        if (!chart) return null;
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
                        return EAchievementTypes.S;
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
                    case "D":
                    default:
                        return EAchievementTypes.D;
                }
            })(),
            dxRating: score.rating,
            dxScore: -1,
        };
    }
    async getPlayerLevel50(
        username: string,
        level: number,
        page: number,
        options: { percise: boolean }
    ) {
        const res = {
            status: "not-supported",
            message: "getPlayerLevel50 is not supported on Maishift.",
            data: null,
        } as const;
        return res;
    }
}
