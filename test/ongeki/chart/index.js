const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Geki.Adapters.KamaiTachi();
    const painter = new MaiDraw.Geki.Painters.Chart();
    MaiDraw.Geki.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");
    const themes = ["jp-refresh", "jp-brightmemory"];
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
            if (result.status == "success") {
                fs.writeFileSync(
                    upath.join(__dirname, `${theme}-${region}.webp`),
                    await sharp(result.data)
                        .webp({
                            quality: 100,
                        })
                        .toBuffer()
                );
                console.log(`${theme}-${region} passed.`);
            } else {
                console.log(`${theme}-${region} failed: ${result.message}`);
            }
        }
    }
    process.exit(0);
})();
