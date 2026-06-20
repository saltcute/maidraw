import { Difficulty } from "gcm-database/chunithm";
import { Database } from "gcm-database-local/chunithm";
import { ChartPainter } from "../../../src/chunithm/painter/chart";
import { getDummyScore } from "../../utils/chunithm/util";
import { localDatabasePath, painterTestWrapper } from "../../utils/util";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new ChartPainter(database);

    return await painter.draw({
        username: "♪Lxns♪",
        rating: 17.67,
        chartIdentifier: "2718",
        type: "new",
        scores: {
            [Difficulty.BASIC]: null,
            [Difficulty.ADVANCED]: getDummyScore(),
            [Difficulty.EXPERT]: null,
            [Difficulty.MASTER]: null,
            [Difficulty.ULTIMA]: null,
            [Difficulty.WORLDS_END]: null,
        },
    });
});
