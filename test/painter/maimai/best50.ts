import { Best50Painter } from "@maimai/painter/best50";
import { envNumber, envString } from "@utils/env";
import { getDummyScore } from "@utils/maimai/util";
import { localDatabasePath, painterTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/maimai";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new Best50Painter(database);

    return await painter.draw({
        username: envString("TEST_USERNAME", "♪Lxns♪"),
        rating: envNumber("TEST_RATING", 11451),
        newScores: [...Array(envNumber("TEST_NEW_SCORES_COUNT", 15, true)).keys()].map(() => getDummyScore()),
        oldScores: [...Array(envNumber("TEST_OLD_SCORES_COUNT", 35, true)).keys()].map(() => getDummyScore()),
    });
});
