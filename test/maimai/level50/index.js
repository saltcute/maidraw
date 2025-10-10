const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Maimai.Adapters.KamaiTachi();
    const painter = MaiDraw.Maimai.Painters.Level50;
    MaiDraw.Maimai.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");

    const themes = ["jp-prism-portrait"];
    const levels = [13.5, 13.7, 14];
    for (const theme of themes) {
        for (const level of levels) {
            for (const page of [1, 2]) {
                const result = await painter.drawWithScoreSource(
                    kamai,
                    process.env.NAME,
                    level,
                    page,
                    {
                        scale: process.env.SCALE ?? 1,
                        theme,
                    }
                );
                if (result.status == "success") {
                    fs.writeFileSync(
                        upath.join(
                            __dirname,
                            `${theme}-lv${level}-p${page}.webp`
                        ),
                        await sharp(result.data)
                            .webp({
                                quality: 100,
                            })
                            .toBuffer()
                    );
                    console.log(`${theme}-lv${level}-p${page} passed.`);
                } else {
                    console.log(
                        `${theme}-lv${level}-p${page} failed: ${result.message}`
                    );
                }
            }
        }
    }
    process.exit(0);
})();
