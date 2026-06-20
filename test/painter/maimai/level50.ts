import { Database } from "gcm-database-local/maimai";
import { Level50Painter } from "../../../src/maimai/painter/level50";
import { getDummyScore } from "../../utils/maimai/util";
import { localDatabasePath, painterTestWrapper } from "../../utils/util";

painterTestWrapper(async () => {
    const database = new Database(localDatabasePath);

    const painter = new Level50Painter(database);

    return await painter.draw({
        username: "♪Lxns♪",
        rating: 11451,
        page: 1,
        level: 15,
        scores: [...Array(Math.floor(50)).keys()].map(() => getDummyScore()),
    });
});
