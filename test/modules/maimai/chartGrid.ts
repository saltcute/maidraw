import { type Chart, Difficulty } from "gcm-database/maimai";
import { Database } from "gcm-database-local/maimai";
import { join } from "upath";
import { Painter } from "../../../src/common/painter/painter";
import { AchievementTypes, ComboLamp, type Score, SyncLamp } from "../../../src/maimai/lib/types";
import { ChartGridModule } from "../../../src/maimai/painter/modules/chartGrid";
import { chartTheme } from "../../utils/maimai/util";
import { moduleTestWrapper } from "../../utils/util";

function randomEnum<T extends object>(anEnum: T): T[keyof T] {
    const enumValues = Object.values(anEnum) as unknown as T[keyof T][];
    const randomIndex = Math.floor(Math.random() * enumValues.length);
    const randomEnumValue = enumValues[randomIndex];
    return randomEnumValue;
}

function getDummyScore(chart: Chart): Score {
    return {
        achievement: Math.random() * 101,
        achievementRank: randomEnum(AchievementTypes),
        combo: randomEnum(ComboLamp),
        sync: randomEnum(SyncLamp),
        dxRating: 114,
        dxScore: 1919,
        chart,
    };
}

moduleTestWrapper(1645 + 100, 1045 + 100, false, async (canvas) => {
    const database = new Database(join(__dirname, "..", "..", "..", "..", "maimai-songs-database"));
    const module = new ChartGridModule(database);

    Painter.registerFonts("assets");
    const identifier = "11686";
    await module.draw(
        canvas.getContext("2d"),
        chartTheme,
        {
            type: "chart-grid",
            x: 50,
            y: 50,
            width: 1645,
            height: 1045,
            margin: 70,
            gap: 40,
            bubble: {
                margin: 20,
                color: {
                    basic: "#70E262",
                    advanced: "#FFBB00",
                    expert: "#FF4A5A",
                    master: "#A04FDA",
                    remaster: "#DDBDF5",
                    utage: "#70E262",
                },
            },
            color: {
                card: "#ffa7c5",
            },
            sprites: {
                achievement: {
                    d: "../../best50/circle/assets/achievement/d.webp",
                    c: "../../best50/circle/assets/achievement/c.webp",
                    b: "../../best50/circle/assets/achievement/b.webp",
                    bb: "../../best50/circle/assets/achievement/bb.webp",
                    bbb: "../../best50/circle/assets/achievement/bbb.webp",
                    a: "../../best50/circle/assets/achievement/a.webp",
                    aa: "../../best50/circle/assets/achievement/aa.webp",
                    aaa: "../../best50/circle/assets/achievement/aaa.webp",
                    s: "../../best50/circle/assets/achievement/s.webp",
                    sp: "../../best50/circle/assets/achievement/sp.webp",
                    ss: "../../best50/circle/assets/achievement/ss.webp",
                    ssp: "../../best50/circle/assets/achievement/ssp.webp",
                    sss: "../../best50/circle/assets/achievement/sss.webp",
                    sssp: "../../best50/circle/assets/achievement/sssp.webp",
                },
                milestone: {
                    ap: "../../best50/versionless/milestone/ap.webp",
                    app: "../../best50/versionless/milestone/app.webp",
                    fc: "../../best50/versionless/milestone/fc.webp",
                    fcp: "../../best50/versionless/milestone/fcp.webp",
                    fdx: "../../best50/versionless/milestone/fdx.webp",
                    fdxp: "../../best50/versionless/milestone/fdxp.webp",
                    fs: "../../best50/versionless/milestone/fs.webp",
                    fsp: "../../best50/versionless/milestone/fsp.webp",
                    sync: "../../best50/versionless/milestone/sync.webp",
                    none: "../../best50/versionless/milestone/none.webp",
                },
                versions: {
                    // biome-ignore lint/style/useNamingConvention: region code
                    OLD: {
                        "0": "../versionless/logo/jp/100.webp",
                        "10": "../versionless/logo/jp/110.webp",
                        "20": "../versionless/logo/jp/120.webp",
                        "30": "../versionless/logo/jp/130.webp",
                        "40": "../versionless/logo/jp/140.webp",
                        "50": "../versionless/logo/jp/150.webp",
                        "60": "../versionless/logo/jp/160.webp",
                        "70": "../versionless/logo/jp/170.webp",
                        "80": "../versionless/logo/jp/180.webp",
                        "85": "../versionless/logo/jp/185.webp",
                        "90": "../versionless/logo/jp/190.webp",
                        "95": "../versionless/logo/jp/195.webp",
                        "99": "../versionless/logo/jp/199.webp",
                    },
                    // biome-ignore lint/style/useNamingConvention: region code
                    DX: {
                        "0": "../versionless/logo/jp/200.webp",
                        "5": "../versionless/logo/jp/205.webp",
                        "10": "../versionless/logo/jp/210.webp",
                        "15": "../versionless/logo/jp/215.webp",
                        "20": "../versionless/logo/jp/220.webp",
                        "25": "../versionless/logo/jp/225.webp",
                        "30": "../versionless/logo/jp/230.webp",
                        "35": "../versionless/logo/jp/235.webp",
                        "40": "../versionless/logo/jp/240.webp",
                        "45": "../versionless/logo/jp/245.webp",
                        "50": "../versionless/logo/jp/250.webp",
                        "55": "../versionless/logo/jp/255.webp",
                        "60": "../versionless/logo/jp/260.webp",
                        "65": "../versionless/logo/jp/265.webp",
                    },
                    // biome-ignore lint/style/useNamingConvention: region code
                    EX: {
                        "10": "../versionless/logo/intl/210.webp",
                        "15": "../versionless/logo/intl/215.webp",
                    },
                    // biome-ignore lint/style/useNamingConvention: region code
                    CN: {
                        "0": "../versionless/logo/cn/200.webp",
                        "10": "../versionless/logo/cn/210.webp",
                        "20": "../versionless/logo/cn/220.webp",
                        "30": "../versionless/logo/cn/230.webp",
                        "40": "../versionless/logo/cn/240.webp",
                        "50": "../versionless/logo/cn/250.webp",
                        "55": "../versionless/logo/cn/255.webp",
                    },
                },
            },
        },
        {
            chartIdentifier: identifier,
            scores: Object.fromEntries(
                await Promise.all(
                    Object.values(Difficulty).map(async (v) => {
                        const { data: chart } = await database.getChart(identifier, v);
                        if (chart) return [v, getDummyScore(chart)];
                        else return [v, undefined];
                    }),
                ),
            ) as unknown as Record<Difficulty, Score>,
        },
    );
    return canvas;
});
