import { type Folder, FolderLamp } from "@maimai/lib/types";
import { FolderPainter } from "@maimai/painter/folder";
import type { FolderModulePainterContext } from "@maimai/painter/modules/folder";
import { getDummyChart, getDummyScoreOfChart } from "@utils/maimai/util";
import { localDatabasePath, painterTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/maimai";

painterTestWrapper(async () => {
    const painter = new FolderPainter(new Database(localDatabasePath));

    const folders: Folder[] = [
        { title: "Lv. 15", lamp: FolderLamp.ACHIEVEMENT_RANK, elements: Array.from({ length: 15 * Math.random() + 10 }, () => getDummyChart()) },
        { title: "Lv. 14+", lamp: FolderLamp.COMBO, elements: Array.from({ length: 15 * Math.random() + 10 }, () => getDummyChart()) },
        { title: "Lv. 14", lamp: FolderLamp.SYNC, elements: Array.from({ length: 15 * Math.random() + 10 }, () => getDummyChart()) },
        { title: "Lv. 13+", lamp: FolderLamp.DX_SCORE, elements: Array.from({ length: 15 * Math.random() + 10 }, () => getDummyChart()) },
    ];
    const scores: FolderModulePainterContext["scores"] = {};
    for (const folder of folders) {
        for (const chart of folder.elements) {
            if (Math.random() < 1 / 4) continue;
            scores[chart.identifier] = {
                ...scores[chart.identifier],
                [chart.difficulty]: getDummyScoreOfChart(chart),
            };
        }
    }

    return await painter.draw({
        username: "♪Lxns♪",
        rating: 11451,
        folders,
        scores,
    });
});
