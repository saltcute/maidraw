import { type Chart, Difficulty, Type } from "gcm-database/maimai";
import { join } from "upath";
import { Theme } from "../../../src/common/painter/theme";
import { AchievementTypes, ComboLamp, type Score, SyncLamp } from "../../../src/maimai/lib/types";
import { getRandomEnum, getRandomString } from "../util";

export const best50Theme = new Theme(
    join(__dirname, "..", "..", "..", "assets/themes/maimai/best50/circleplus/landscape"),
    require(join(__dirname, "..", "..", "..", "assets/themes/maimai/best50/circleplus/landscape/manifest.json")),
);
export const chartTheme = new Theme(
    join(__dirname, "..", "..", "..", "assets/themes/maimai/chart/circleplus"),
    require(join(__dirname, "..", "..", "..", "assets/themes/maimai/chart/circleplus/manifest.json")),
);

export function getDummyChart(): Chart {
    return {
        title: getRandomString(Math.floor(Math.random() * 9 + 5)),
        artist: getRandomString(10),
        identifier: (Math.random() * 2000).toFixed(0),
        difficulty: getRandomEnum(Difficulty),
        type: getRandomEnum(Type),
        level: (Math.random() * 15).toFixed(1),
        notes: {
            tap: Math.random() * 150,
            hold: Math.random() * 150,
            slide: Math.random() * 150,
            touch: Math.random() * 150,
            break: Math.random() * 150,
        },
        bpm: [Math.floor(Math.random() * 200)],
        designer: getRandomString(5),
        optionalData: {},
    };
}

export function getDummyScore(): Score {
    return {
        achievement: Math.random() * 101,
        achievementRank: getRandomEnum(AchievementTypes),
        combo: getRandomEnum(ComboLamp),
        sync: getRandomEnum(SyncLamp),
        dxRating: 114,
        dxScore: 1919,
        chart: getDummyChart(),
    };
}
