import { Level50Painter } from "@maimai/painter/level50";
import { envNumber, envString } from "@utils/env";
import { getDummyScore } from "@utils/maimai/util";
import { localDatabasePath, painterTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/maimai";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new Level50Painter(database);

    return await painter.draw({
        username: envString("TEST_USERNAME", "♪Lxns♪"),
        rating: envNumber("TEST_RATING", 11451),
        page: envNumber("TEST_PAGE", 1),
        level: envNumber("TEST_LEVEL", 15),
        scores: [...Array(envNumber("TEST_SCORES_COUNT", 50, true)).keys()].map(() => getDummyScore()),
    });
});
