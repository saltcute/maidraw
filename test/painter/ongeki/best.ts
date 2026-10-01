import { Best50Painter } from "@ongeki/painter/best";
import { envChoice, envNumber, envString } from "@utils/env";
import { getDummyScore } from "@utils/ongeki/util";
import { localDatabasePath, painterTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/ongeki";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new Best50Painter(database);

    return await painter.draw(
        {
            username: envString("TEST_USERNAME", "♪Lxns♪"),
            rating: envNumber("TEST_RATING", 22.67),
            newScores: [...Array(envNumber("TEST_NEW_SCORES_COUNT", 10, true)).keys()].map(() => getDummyScore()),
            oldScores: [...Array(envNumber("TEST_OLD_SCORES_COUNT", 50, true)).keys()].map(() => getDummyScore()),
            recentOrPlatinumScores: [...Array(envNumber("TEST_RECENT_OR_PLATINUM_SCORES_COUNT", 50, true)).keys()].map(() => getDummyScore()),
        },
        {
            type: envChoice("TEST_TYPE", ["refresh", "classic"], "refresh"),
        },
    );
});
