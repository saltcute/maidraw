import * as Cheerio from "cheerio";

import { ScoreTrackerAdapter } from "..";

import {
    IScore,
    ESyncTypes,
    EComboTypes,
    EAchievementTypes,
} from "@maidraw/mai/type";
import { Database } from "@maidraw/mai/lib/database";

export class Maishift extends ScoreTrackerAdapter {
    constructor() {
        super({
            baseURL: "https://maimai.shiftpsh.com",
        });
    }
    private async pageScraper(username: string) {
        const html = await this.get<string>(`/profile/${username}/home`);
        if (!html) return null;
        const $ = Cheerio.load(html.replace(/<style.*?>.*?<\/style>/g, ""));

        const name = $("body > div > div > div > div > span > span").text();
        const avatarUrl = $($("body > div > div > img")[0]).attr("src");
        const title = $($("body > div > div > div > div > div")[0]).text();
        const rating = parseInt(
            $($("body > div > div > div > div > div")[1]).text()
        );

        const newScoresDOM = $($("body > div > div")[14]).children();
        const newScores = [];
        for (const score of newScoresDOM) {
            const rank = $($("div", score)[2]).text();
            const level = parseFloat(
                $($("div", score)[6]).text().replace("+", "")
            );
            const rating = parseInt($($("span", $("div", score)[5])[0]).text());
            const name = $($("div", score)[8]).text();
            const rate = parseFloat(
                $($("span", $("div", score)[9])[0])
                    .text()
                    .replace("%", "")
            );
            const isDX = $($("img", score)[1]).attr("alt") == "DX";
            newScores.push({ rank, level, rating, name, rate, isDX });
        }

        const oldScoresDOM = $($("body > div > div")[16]).children();
        const oldScores = [];
        for (const score of oldScoresDOM) {
            const rank = $($("div", score)[2]).text();
            const level = parseFloat(
                $($("div", score)[6]).text().replace("+", "")
            );
            const rating = parseInt($($("span", $("div", score)[5])[0]).text());
            const name = $($("div", score)[8]).text();
            const rate = parseFloat(
                $($("span", $("div", score)[9])[0])
                    .text()
                    .replace("%", "")
            );
            const isDX = $($("img", score)[1]).attr("alt") == "DX";
            oldScores.push({ rank, level, rating, name, rate, isDX });
        }

        return { name, avatarUrl, title, rating, newScores, oldScores };
    }
    async getPlayerInfo(username: string) {
        const res = await this.pageScraper(username);
        if (!res) return null;
        return {
            name: res.name,
            rating: res.rating,
        };
    }
    async getPlayerProfilePicture(username: string) {
        const res = await this.pageScraper(username);
        if (!res?.avatarUrl) return null;
        const buffer = await this.get<Buffer>(
            res.avatarUrl,
            undefined,
            2 * 60 * 60 * 1000,
            {
                responseType: "arraybuffer",
            }
        );
        if (!(buffer instanceof Buffer)) return null;
        return buffer;
    }
    async getPlayerBest50(
        username: string
    ): Promise<{ new: IScore[]; old: IScore[] } | null> {
        const res = await this.pageScraper(username);
        if (!res) return null;
        const newScores: IScore[] = [];
        const oldScores: IScore[] = [];
        for (const score of res.newScores) {
            const converted = await this.toMaiDrawScore(score);
            if (converted) newScores.push(converted);
        }
        for (const score of res.oldScores) {
            const converted = await this.toMaiDrawScore(score);
            if (converted) oldScores.push(converted);
        }
        return { new: newScores, old: oldScores };
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
    async toMaiDrawScore(score: {
        rank: string;
        level: number;
        rating: number;
        name: string;
        rate: number;
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

            combo: EComboTypes.NONE,
            sync: ESyncTypes.NONE,
            achievement: score.rate,
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
        return null;
    }
}
