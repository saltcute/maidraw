import { Theme } from "@common/painter/theme";
import { AchievementTypes, ComboLamp, type Score, SyncLamp } from "@maimai/lib/types";
import { getMaxDxScore } from "@maimai/lib/util";
import { type Chart, Difficulty, Type } from "gcm-database/maimai";
import { join } from "upath";
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

/**
 * Dummy score of a known chart, with a DX score that stays within the maximum of that chart.
 */
export function getDummyScoreOfChart(chart: Chart): Score {
    return {
        ...getDummyScore(),
        chart,
        dxScore: Math.floor(getMaxDxScore(chart) * (0.8 + Math.random() * 0.2)),
    };
}
