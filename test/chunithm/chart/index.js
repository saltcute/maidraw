const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Chuni.Adapters.KamaiTachi();
    const lxns = new MaiDraw.Chuni.Adapters.LXNS({
        auth: "",
    });
    const painter = new MaiDraw.Chuni.Painters.Chart();
    MaiDraw.Chuni.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");
    const themes = ["jp-verse"];
    for (let theme of themes) {
        for (const region of ["JPN"]) {
            let result = await painter.drawWithScoreSource(
                kamai,
                // lxns,
                // "",
                {
                    username: "",
                    chartId: 18,
                    type: "recents",
                },
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
