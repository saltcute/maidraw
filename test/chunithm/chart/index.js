const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Chuni.Adapters.KamaiTachi();
    const painter = new MaiDraw.Chuni.Painters.Chart();
    MaiDraw.Chuni.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");
    const themes = ["jp-xverse", "jp-verse"];
    for (let theme of themes) {
        for (const region of ["JPN"]) {
            let result = await painter.drawWithScoreSource(
                kamai,
                {
                    username: process.env.NAME,
                    chartId: process.env.CHART ?? 18,
                    type: "recents",
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
