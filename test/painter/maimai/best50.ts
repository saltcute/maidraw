import { Database } from "gcm-database-local/maimai";
import { Best50Painter } from "../../../src/maimai/painter/best50";
import { getDummyScore } from "../../utils/maimai/util";
import { localDatabasePath, painterTestWrapper } from "../../utils/util";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new Best50Painter(database);

    return await painter.draw({
        username: "♪Lxns♪",
        rating: 11451,
        newScores: [...Array(Math.floor(15)).keys()].map(() => getDummyScore()),
        oldScores: [...Array(Math.floor(35)).keys()].map(() => getDummyScore()),
    });
});
