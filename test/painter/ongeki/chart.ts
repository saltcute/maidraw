import { Difficulty } from "gcm-database/ongeki";
import { Database } from "gcm-database-local/ongeki";
import { ChartPainter } from "../../../src/ongeki/painter/chart";
import { getDummyScore } from "../../utils/ongeki/util";
import { localDatabasePath, painterTestWrapper } from "../../utils/util";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new ChartPainter(database);

    return await painter.draw({
        username: "♪Lxns♪",
        rating: 22.69,
        chartIdentifier: "1027",
        type: "refresh",
        scores: {
            [Difficulty.BASIC]: null,
            [Difficulty.ADVANCED]: getDummyScore(),
            [Difficulty.EXPERT]: null,
            [Difficulty.MASTER]: getDummyScore(),
            [Difficulty.LUNATIC]: null,
        },
    });
});
