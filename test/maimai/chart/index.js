const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Maimai.Adapters.KamaiTachi();
    const lxns = new MaiDraw.Maimai.Adapters.LXNS({
        auth: process.env.AUTH,
    });
    const maishift = new MaiDraw.Maimai.Adapters.Maishift();
    const painter = new MaiDraw.Maimai.Painters.Chart();
    MaiDraw.Maimai.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");
    const themes = ["jp-circle", "jp-prismplus", "jp-prism"];
    for (let theme of themes) {
        for (const region of ["DX", "EX", "CN"]) {
            let result = await painter.drawWithScoreSource(
                (() => {
                    switch (process.env.ADAPTER.toLowerCase()) {
                        case "lxns":
                            return lxns;
                        case "maishift":
                            return maishift;
                        case "kamai":
                        default:
                            return kamai;
                    }
                })(),
                {
                    username: process.env.NAME,
                    chartId: process.env.CHART ?? 11451,
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
