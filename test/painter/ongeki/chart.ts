import { ChartPainter } from "@ongeki/painter/chart";
import { envChoice, envNumber, envString } from "@utils/env";
import { getDummyScore } from "@utils/ongeki/util";
import { localDatabasePath, painterTestWrapper } from "@utils/util";
import { Difficulty } from "gcm-database/ongeki";
import { Database } from "gcm-database-local/ongeki";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new ChartPainter(database);

    return await painter.draw({
        username: envString("TEST_USERNAME", "♪Lxns♪"),
        rating: envNumber("TEST_RATING", 22.69),
        chartIdentifier: envString("TEST_CHART_IDENTIFIER", "1027"),
        type: envChoice("TEST_TYPE", ["refresh", "classic"], "refresh"),
        scores: {
            [Difficulty.BASIC]: null,
            [Difficulty.ADVANCED]: getDummyScore(),
            [Difficulty.EXPERT]: null,
            [Difficulty.MASTER]: getDummyScore(),
            [Difficulty.LUNATIC]: null,
        },
    });
});
