import { Theme } from "@common/painter/theme";
import { AchievementTypes, BellLamp, ComboLamp, type Score } from "@ongeki/lib/types";
import { getMaxPlatinumScore } from "@ongeki/lib/util";
import { type Chart, Difficulty, LunaticType } from "gcm-database/ongeki";
import { join } from "upath";
import { envString } from "../env";
import { getRandomEnum, getRandomString } from "../util";

const best50ThemePath = envString("TEST_BEST_THEME_PATH", join(__dirname, "..", "..", "..", "assets/themes/ongeki/best/refresh/refresh"));
export const best50Theme = new Theme(best50ThemePath, require(join(best50ThemePath, "manifest.json")));
const chartThemePath = envString("TEST_CHART_THEME_PATH", join(__dirname, "..", "..", "..", "assets/themes/ongeki/chart/refresh"));
export const chartTheme = new Theme(chartThemePath, require(join(chartThemePath, "manifest.json")));

// biome-ignore lint/suspicious/noExplicitAny: theme manifest is loaded untyped
export function getElement(theme: Theme<any>, type: string, region?: string) {
    // biome-ignore lint/suspicious/noExplicitAny: theme manifest is loaded untyped
    return theme.content.elements.find((e: any) => e.type === type && (region === undefined || e.region === region));
}

export function getDummyChart(): Chart {
    const difficulty = getRandomEnum(Difficulty);
    return {
        title: getRandomString(Math.floor(Math.random() * 9 + 5)),
        artist: getRandomString(10),
        identifier: (Math.random() * 2000).toFixed(0),
        difficulty,
        level: (Math.random() * 15).toFixed(1),
        internalLevel: Math.random() * 15,
        notes: {
            tap: Math.floor(Math.random() * 800),
            hold: Math.floor(Math.random() * 300),
            side: Math.floor(Math.random() * 200),
            flick: Math.floor(Math.random() * 100),
            bell: Math.floor(Math.random() * 200),
        },
        lunatic: difficulty === Difficulty.LUNATIC ? LunaticType.LUNATIC : LunaticType.NONE,
        boss: {
            character: {
                rarity: "SSR",
                name: getRandomString(6),
                card: "0",
            },
            level: Math.floor(Math.random() * 150),
        },
        bpm: [Math.floor(Math.random() * 200)],
        designer: getRandomString(5),
        optionalData: {},
    };
}

export function getDummyScore(): Score {
    const chart = getDummyChart();
    const maxPlatinumScore = getMaxPlatinumScore(chart);
    return {
        score: Math.floor(Math.random() * 1010000),
        rank: getRandomEnum(AchievementTypes),
        combo: getRandomEnum(ComboLamp),
        bell: getRandomEnum(BellLamp),
        rating: Math.random() * 20,
        starRating: Math.random() * 2,
        platinumScore: Math.floor(Math.random() * maxPlatinumScore),
        chart,
    };
}
