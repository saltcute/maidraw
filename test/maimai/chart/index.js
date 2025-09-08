const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Maimai.Adapters.KamaiTachi();
    const lxns = new MaiDraw.Maimai.Adapters.LXNS({
        auth: "",
    });
    const painter = new MaiDraw.Maimai.Painters.Chart();
    MaiDraw.Maimai.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");
    const themes = ["jp-prism"];
    for (let theme of themes) {
        for (const region of ["DX", "EX", "CN"]) {
            let result = await painter.drawWithScoreSource(
                kamai,
                {
                    username: "",
                    chartId: 11451,
                },
                {
                    scale: 0.5,
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
