import { ChartPainter } from "@maimai/painter/chart";
import { getDummyScore } from "@utils/maimai/util";
import { localDatabasePath, painterTestWrapper } from "@utils/util";
import { Difficulty } from "gcm-database/maimai";
import { Database } from "gcm-database-local/maimai";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new ChartPainter(database);

    return await painter.draw({
        username: "♪Lxns♪",
        rating: 11451,
        chartIdentifier: "11822",
        scores: {
            [Difficulty.EASY]: null,
            [Difficulty.BASIC]: null,
            [Difficulty.ADVANCED]: getDummyScore(),
            [Difficulty.EXPERT]: null,
            [Difficulty.MASTER]: null,
            [Difficulty.RE_MASTER]: null,
            [Difficulty.UTAGE]: null,
        },
    });
});
