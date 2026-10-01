import { BestPainter } from "@chunithm/painter/best";
import { getDummyScore } from "@utils/chunithm/util";
import { envChoice, envNumber, envString } from "@utils/env";
import { localDatabasePath, painterTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/chunithm";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new BestPainter(database);

    return await painter.draw(
        {
            username: envString("TEST_USERNAME", "♪Lxns♪"),
            rating: envNumber("TEST_RATING", 17.67),
            newScores: [...Array(envNumber("TEST_NEW_SCORES_COUNT", 20, true)).keys()].map(() => getDummyScore()),
            oldScores: [...Array(envNumber("TEST_OLD_SCORES_COUNT", 30, true)).keys()].map(() => getDummyScore()),
        },
        {
            version: envChoice("TEST_VERSION", ["chunithm", "crystal", "new", "verse"], "verse"),
        },
    );
});
