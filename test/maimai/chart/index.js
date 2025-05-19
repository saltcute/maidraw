const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Maimai.Best50.KamaiTachi();
    MaiDraw.Maimai.Chart.Database.setLocalDatabasePath(
        "../maimai-songs-database"
    );

    const fs = require("fs");

    const themes = ["jp-prism"];
    for (let theme of themes) {
        let result = await MaiDraw.Maimai.Chart.drawWithScoreSource(
            kamai,
            "salt",
            // 1,
            // 114,
            // 753,
            834,
            // 11069,
            // 11177,
            // 11343,
            // 11549,
            // 11635,
            // 11746,
            // 100018,
            {
                scale: 2,
                theme,
            }
        );
        if (result) {
            fs.writeFileSync(
                upath.join(__dirname, `${theme}.webp`),
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
    process.exit(0);
})();
