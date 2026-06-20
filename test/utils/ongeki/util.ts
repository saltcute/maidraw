import { type Chart, Difficulty, LunaticType } from "gcm-database/ongeki";
import { join } from "upath";
import { Theme } from "../../../src/common/painter/theme";
import { AchievementTypes, BellLamp, ComboLamp, type Score } from "../../../src/ongeki/lib/types";
import { getMaxPlatinumScore } from "../../../src/ongeki/lib/util";
import { getRandomEnum, getRandomString } from "../util";

export const best50Theme = new Theme(
    join(__dirname, "..", "..", "..", "assets/themes/ongeki/best/refresh/refresh"),
    require(join(__dirname, "..", "..", "..", "assets/themes/ongeki/best/refresh/refresh/manifest.json")),
);
export const chartTheme = new Theme(
    join(__dirname, "..", "..", "..", "assets/themes/ongeki/chart/refresh"),
    require(join(__dirname, "..", "..", "..", "assets/themes/ongeki/chart/refresh/manifest.json")),
);

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
