const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Geki.Adapters.KamaiTachi();
    const painter = new MaiDraw.Geki.Painters.Chart();
    MaiDraw.Geki.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");
    const themes = ["jp-refresh"];
    for (let theme of themes) {
        for (const region of ["JPN"]) {
            let result = await painter.drawWithScoreSource(
                kamai,
                {
                    username: process.env.NAME,
                    chartId: process.env.CHART ?? 974,
                    type: "refresh",
                },
                {
                    scale: process.env.SCALE ?? 1,
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
