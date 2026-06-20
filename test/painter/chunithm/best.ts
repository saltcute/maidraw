import { Database } from "gcm-database-local/chunithm";
import { BestPainter } from "../../../src/chunithm/painter/best";
import { getDummyScore } from "../../utils/chunithm/util";
import { localDatabasePath, painterTestWrapper } from "../../utils/util";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new BestPainter(database);

    return await painter.draw(
        {
            username: "♪Lxns♪",
            rating: 17.67,
            newScores: [...Array(20).keys()].map(() => getDummyScore()),
            oldScores: [...Array(30).keys()].map(() => getDummyScore()),
        },
        {
            version: "verse",
        },
    );
});
