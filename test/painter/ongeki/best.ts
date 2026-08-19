import { Best50Painter } from "@ongeki/painter/best";
import { getDummyScore } from "@utils/ongeki/util";
import { localDatabasePath, painterTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/ongeki";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new Best50Painter(database);

    return await painter.draw(
        {
            username: "♪Lxns♪",
            rating: 22.67,
            newScores: [...Array(10).keys()].map(() => getDummyScore()),
            oldScores: [...Array(50).keys()].map(() => getDummyScore()),
            recentOrPlatinumScores: [...Array(50).keys()].map(() => getDummyScore()),
        },
        {
            type: "refresh",
        },
    );
});
