import { Database } from "gcm-database-local/chunithm";
import { ScoreGridModule } from "../../../src/chunithm/painter/modules/scoreGrid";
import { Painter } from "../../../src/common/painter/painter";
import { best50Theme, getDummyScore } from "../../utils/chunithm/util";
import { localDatabasePath, moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(1220 + 100, 855 + 100, false, async (canvas) => {
    const module = new ScoreGridModule(new Database(localDatabasePath));

    Painter.registerFonts("assets");

    await module.draw(
        canvas.getContext("2d"),
        best50Theme,
        {
            type: "score-grid",
            x: 50,
            y: 50,
            horizontalSize: 4,
            verticalSize: 5,
            region: "new",
            index: 0,
            scoreBubble: {
                width: 290,
                height: 155,
                margin: 10,
                gap: 20,
                color: {
                    basic: "#70E262",
                    advanced: "#FFBB00",
                    expert: "#FF4A5A",
                    master: "#A04FDA",
                    ultima: "#591C28",
                    worldsEnd: "#70E262",
                },
            },
            sprites: {
                achievement: {
                    d: "../../verse/assets/achievement/D.webp",
                    c: "../../verse/assets/achievement/C.webp",
                    b: "../../verse/assets/achievement/B.webp",
                    bb: "../../verse/assets/achievement/BB.webp",
                    bbb: "../../verse/assets/achievement/BBB.webp",
                    a: "../../verse/assets/achievement/A.webp",
                    aa: "../../verse/assets/achievement/AA.webp",
                    aaa: "../../verse/assets/achievement/AAA.webp",
                    s: "../../verse/assets/achievement/S.webp",
                    sp: "../../verse/assets/achievement/SP.webp",
                    ss: "../../verse/assets/achievement/SS.webp",
                    ssp: "../../verse/assets/achievement/SSP.webp",
                    sss: "../../verse/assets/achievement/SSS.webp",
                    sssp: "../../verse/assets/achievement/SSSP.webp",
                },
                milestone: {
                    aj: "../../versionless/milestone/aj.webp",
                    ajc: "../../versionless/milestone/ajc.webp",
                    fc: "../../versionless/milestone/fc.webp",
                    none: "../../versionless/void.webp",
                },
            },
        },
        { scores: { new: Array.from({ length: 15 }, () => getDummyScore()) } },
    );
    return canvas;
});
