const { MaiDraw } = require("../../../dist");
const fs = require("fs");

MaiDraw.Chuni.Chart.Database.setLocalDatabasePath("../maimai-songs-database");

(async () => {
    const res = await MaiDraw.Chuni.Chart.Database.fecthJacket(-1);
    console.log(res);
    if (res instanceof Buffer) fs.writeFileSync(__dirname + "/jacket.png", res);
    else console.log("Failed to fetch jacket.");
})();
