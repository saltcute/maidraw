import { ChartPainter } from "@chunithm/painter/chart";
import { getDummyScore } from "@utils/chunithm/util";
import { envChoice, envNumber, envString } from "@utils/env";
import { localDatabasePath, painterTestWrapper } from "@utils/util";
import { Difficulty } from "gcm-database/chunithm";
import { Database } from "gcm-database-local/chunithm";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new ChartPainter(database);

    return await painter.draw({
        username: envString("TEST_USERNAME", "♪Lxns♪"),
        rating: envNumber("TEST_RATING", 17.67),
        chartIdentifier: envString("TEST_CHART_IDENTIFIER", "2718"),
        type: envChoice("TEST_TYPE", ["new", "recents"], "new"),
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
