import { Database } from "gcm-database-local/maimai";
import { Painter } from "../../../src/common/painter/painter";
import { ScoreGridModule } from "../../../src/maimai/painter/modules/scoreGrid";
import { best50Theme, getDummyScore } from "../../utils/maimai/util";
import { moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(2080 + 100, 855 + 100, false, async (canvas) => {
    const module = new ScoreGridModule(new Database("../maimai-songs-database"));

    Painter.registerFonts("assets");

    await module.draw(
        canvas.getContext("2d"),
        best50Theme,
        {
            type: "score-grid",
            x: 50,
            y: 50,
            horizontalSize: 7,
            verticalSize: 5,
            region: "old",
            index: 0,
            scoreBubble: {
                width: 280,
                height: 155,
                margin: 10,
                gap: 20,
                color: {
                    basic: "#70E262",
                    advanced: "#FFBB00",
                    expert: "#FF4A5A",
                    master: "#A04FDA",
                    remaster: "#DDBDF5",
                    utage: "#70E262",
                },
            },
            sprites: {
                achievement: {
                    d: "../../circle/assets/achievement/d.webp",
                    c: "../../circle/assets/achievement/c.webp",
                    b: "../../circle/assets/achievement/b.webp",
                    bb: "../../circle/assets/achievement/bb.webp",
                    bbb: "../../circle/assets/achievement/bbb.webp",
                    a: "../../circle/assets/achievement/a.webp",
                    aa: "../../circle/assets/achievement/aa.webp",
                    aaa: "../../circle/assets/achievement/aaa.webp",
                    s: "../../circle/assets/achievement/s.webp",
                    sp: "../../circle/assets/achievement/sp.webp",
                    ss: "../../circle/assets/achievement/ss.webp",
                    ssp: "../../circle/assets/achievement/ssp.webp",
                    sss: "../../circle/assets/achievement/sss.webp",
                    sssp: "../../circle/assets/achievement/sssp.webp",
                },
                mode: {
                    standard: "../../versionless/mode/jp/standard.webp",
                    dx: "../../versionless/mode/jp/dx.webp",
                },
                milestone: {
                    ap: "../../versionless/milestone/ap.webp",
                    app: "../../versionless/milestone/app.webp",
                    fc: "../../versionless/milestone/fc.webp",
                    fcp: "../../versionless/milestone/fcp.webp",
                    fdx: "../../versionless/milestone/fdx.webp",
                    fdxp: "../../versionless/milestone/fdxp.webp",
                    fs: "../../versionless/milestone/fs.webp",
                    fsp: "../../versionless/milestone/fsp.webp",
                    sync: "../../versionless/milestone/sync.webp",
                    none: "../../versionless/milestone/none.webp",
                },
            },
        },
        { scores: { old: Array.from({ length: 33 }, () => getDummyScore()) } },
    );
    return canvas;
});
