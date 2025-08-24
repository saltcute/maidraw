const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Chuni.Best50.KamaiTachi();
    const lxns = new MaiDraw.Chuni.Best50.LXNS({
        auth: "",
    });
    MaiDraw.Chuni.Chart.Database.setLocalDatabasePath(
        "../maimai-songs-database"
    );

    const fs = require("fs");
    const themes = ["jp-verse"];
    for (let theme of themes) {
        for (const region of ["JPN"]) {
            let result = await MaiDraw.Chuni.Chart.drawWithScoreSource(
                // kamai,
                lxns,
                // "",
                "",
                2171,
                "recents",
                {
                    scale: 1,
                    theme,
                    region,
                }
            );
            if (result) {
                fs.writeFileSync(
                    upath.join(__dirname, `${theme}-${region}.webp`),
                    await sharp(result)
                        .webp({
                            quality: 60,
                        })
                        .toBuffer()
                );
                console.log(`${theme} passed.`);
            } else {
                console.log(`${theme} failed!`);
            }
        }
    }
    process.exit(0);
})();
