const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Maimai.Best50.KamaiTachi();
    MaiDraw.Maimai.Chart.Database.setLocalDatabasePath(
        "../maimai-songs-database"
    );

    const fs = require("fs");

    const themes = [
        // "salt-2026-landscape",
        // "jp-finale-landscape",
        // "jp-finale-portrait",
        // "jp-prismplus-landscape",
        // "jp-prismplus-portrait",
        // "jp-prism-landscape",
        "jp-prism-portrait",
        // "jp-buddiesplus-landscape",
        // "jp-buddiesplus-portrait",
        // "cn-2024-portrait",
        // "cn-2024-landscape",
        // "jp-buddies-landscape",
        // "jp-buddies-portrait",
    ];
    const levels = [13.5, 13.7, 14];
    for (const theme of themes) {
        for (const level of levels) {
            for (const page of [1, 2]) {
                const result = await MaiDraw.Maimai.Level50.drawWithScoreSource(
                    kamai,
                    "",
                    level,
                    page,
                    {
                        scale: 0.5,
                        theme,
                    }
                );
                if (result) {
                    fs.writeFileSync(
                        upath.join(
                            __dirname,
                            `${theme}-lv${level}-p${page}.webp`
                        ),
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
    }
    process.exit(0);
})();
