import { Difficulty } from "gcm-database/chunithm";
import { Database } from "gcm-database-local/chunithm";
import type { Score } from "../../../src/chunithm/lib/types";
import { ChartGridModule } from "../../../src/chunithm/painter/modules/chartGrid";
import { Painter } from "../../../src/common/painter/painter";
import { chartTheme, getDummyScore } from "../../utils/chunithm/util";
import { localDatabasePath, moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(1645 + 100, 1045 + 100, false, async (canvas) => {
    const database = new Database(localDatabasePath);
    const module = new ChartGridModule(database);

    Painter.registerFonts("assets");
    const identifier = "2718";
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
                    ultima: "#591C28",
                    worldsEnd: "#70E262",
                },
            },
            color: {
                card: "#b8bbf2",
            },
            sprites: {
                achievement: {
                    d: "../../best/verse/assets/achievement/D.webp",
                    c: "../../best/verse/assets/achievement/C.webp",
                    b: "../../best/verse/assets/achievement/B.webp",
                    bb: "../../best/verse/assets/achievement/BB.webp",
                    bbb: "../../best/verse/assets/achievement/BBB.webp",
                    a: "../../best/verse/assets/achievement/A.webp",
                    aa: "../../best/verse/assets/achievement/AA.webp",
                    aaa: "../../best/verse/assets/achievement/AAA.webp",
                    s: "../../best/verse/assets/achievement/S.webp",
                    sp: "../../best/verse/assets/achievement/SP.webp",
                    ss: "../../best/verse/assets/achievement/SS.webp",
                    ssp: "../../best/verse/assets/achievement/SSP.webp",
                    sss: "../../best/verse/assets/achievement/SSS.webp",
                    sssp: "../../best/verse/assets/achievement/SSSP.webp",
                },
                milestone: {
                    aj: "../../best/versionless/milestone/aj.webp",
                    ajc: "../../best/versionless/milestone/ajc.webp",
                    fc: "../../best/versionless/milestone/fc.webp",
                    none: "../../best/versionless/void.webp",
                },
                versions: {
                    // biome-ignore lint/style/useNamingConvention: region code
                    JPN: {
                        "100": "../versionless/logo/jpn/100.webp",
                        "105": "../versionless/logo/jpn/105.webp",
                        "110": "../versionless/logo/jpn/110.webp",
                        "115": "../versionless/logo/jpn/115.webp",
                        "120": "../versionless/logo/jpn/120.webp",
                        "125": "../versionless/logo/jpn/125.webp",
                        "130": "../versionless/logo/jpn/130.webp",
                        "135": "../versionless/logo/jpn/135.webp",
                        "140": "../versionless/logo/jpn/140.webp",
                        "145": "../versionless/logo/jpn/145.webp",
                        "150": "../versionless/logo/jpn/150.webp",
                        "155": "../versionless/logo/jpn/155.webp",
                        "200": "../versionless/logo/jpn/200.webp",
                        "205": "../versionless/logo/jpn/205.webp",
                        "210": "../versionless/logo/jpn/210.webp",
                        "215": "../versionless/logo/jpn/215.webp",
                        "220": "../versionless/logo/jpn/220.webp",
                        "225": "../versionless/logo/jpn/225.webp",
                        "230": "../versionless/logo/jpn/230.webp",
                        "240": "../versionless/logo/jpn/240.webp",
                        "245": "../versionless/logo/jpn/245.webp",
                    },
                    // biome-ignore lint/style/useNamingConvention: region code
                    INT: {
                        "100": "../versionless/logo/int/100.webp",
                        "105": "../versionless/logo/int/105.webp",
                        "110": "../versionless/logo/jpn/200.webp",
                        "115": "../versionless/logo/jpn/205.webp",
                        "120": "../versionless/logo/jpn/210.webp",
                        "125": "../versionless/logo/jpn/215.webp",
                        "130": "../versionless/logo/jpn/220.webp",
                        "135": "../versionless/logo/jpn/225.webp",
                        "140": "../versionless/logo/jpn/230.webp",
                    },
                    // biome-ignore lint/style/useNamingConvention: region code
                    CHN: {
                        "100": "../versionless/logo/chn/100.webp",
                        "110": "../versionless/logo/chn/110.webp",
                        "120": "../versionless/logo/chn/120.webp",
                        "130": "../versionless/logo/chn/130.webp",
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
                        if (chart) return [v, getDummyScore()];
                        else return [v, undefined];
                    }),
                ),
            ) as unknown as Record<Difficulty, Score>,
        },
    );
    return canvas;
});
