import { type Chart, Difficulty } from "gcm-database/chunithm";
import { join } from "upath";
import { AchievementTypes, ChainLamp, ClearLamp, ComboLamp, type Score } from "../../../src/chunithm/lib/types";
import { Theme } from "../../../src/common/painter/theme";
import { getRandomEnum, getRandomString } from "../util";

export const best50Theme = new Theme(
    join(__dirname, "..", "..", "..", "assets/themes/chunithm/best/xversex/new"),
    require(join(__dirname, "..", "..", "..", "assets/themes/chunithm/best/xversex/new/manifest.json")),
);
export const chartTheme = new Theme(
    join(__dirname, "..", "..", "..", "assets/themes/chunithm/chart/xversex"),
    require(join(__dirname, "..", "..", "..", "assets/themes/chunithm/chart/xversex/manifest.json")),
);

export function getDummyChart(): Chart {
    const difficulty = getRandomEnum(Difficulty);
    return {
        title: getRandomString(Math.floor(Math.random() * 9 + 5)),
        artist: getRandomString(10),
        identifier: (Math.random() * 2000).toFixed(0),
        difficulty,
        level: (Math.random() * 15).toFixed(1),
        notes: {
            tap: Math.random() * 150,
            hold: Math.random() * 150,
            slide: Math.random() * 150,
            air: Math.random() * 150,
            flick: difficulty === Difficulty.MASTER || difficulty === Difficulty.ULTIMA ? Math.random() * 150 : undefined,
        },
        bpm: [Math.floor(Math.random() * 200)],
        designer: getRandomString(5),
        optionalData: {},
    };
}

export function getDummyScore(): Score {
    return {
        score: Math.floor(Math.random() * 1010000),
        rank: getRandomEnum(AchievementTypes),
        combo: getRandomEnum(ComboLamp),
        chain: getRandomEnum(ChainLamp),
        clear: getRandomEnum(ClearLamp),
        rating: 11.4,
        chart: getDummyChart(),
    };
}
