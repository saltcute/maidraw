import { Database } from "gcm-database-local/maimai";
import { Painter } from "../../../src/common/painter/painter";
import { type Folder, FolderLamp } from "../../../src/maimai/lib/types";
import { FolderModule, type FolderModulePainterContext } from "../../../src/maimai/painter/modules/folder";
import { best50Theme, getDummyChart, getDummyScoreOfChart } from "../../utils/maimai/util";
import { localDatabasePath, moduleTestWrapper } from "../../utils/util";

const folders: Folder[] = [
    { title: "Achievement rank", lamp: FolderLamp.ACHIEVEMENT_RANK, elements: Array.from({ length: 23 }, () => getDummyChart()) },
    { title: "Combo lamp", lamp: FolderLamp.COMBO, elements: Array.from({ length: 12 }, () => getDummyChart()) },
    { title: "Sync lamp", lamp: FolderLamp.SYNC, elements: Array.from({ length: 8 }, () => getDummyChart()) },
    { title: "Achievement rate", lamp: FolderLamp.ACHIEVEMENT_RATE, elements: Array.from({ length: 12 }, () => getDummyChart()) },
    { title: "DX score", lamp: FolderLamp.DX_SCORE, elements: Array.from({ length: 12 }, () => getDummyChart()) },
];

// Leave about a third of the charts unplayed to check the jacket only cells.
const scores: FolderModulePainterContext["scores"] = {};
for (const folder of folders) {
    for (const chart of folder.elements) {
        if (Math.random() < 1 / 3) continue;
        scores[chart.identifier] = {
            ...scores[chart.identifier],
            [chart.difficulty]: getDummyScoreOfChart(chart),
        };
    }
}

moduleTestWrapper(2400 + 100, 1600, false, async (canvas) => {
    const module = new FolderModule(new Database(localDatabasePath));

    Painter.registerFonts("assets");

    await module.draw(
        canvas.getContext("2d"),
        best50Theme,
        {
            type: "folder",
            x: 50,
            y: 50,
            width: 2400,
            height: 400,
            margin: 40,
            gap: 32,
            horizontalSize: 16,
            color: { card: "#bbdefa" },
            title: { size: 40, gap: 16, color: "#226180" },
            jacket: { size: 130, gap: 16, margin: 10 },
            bubble: {
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
        { folders, scores },
    );
    return canvas;
});
