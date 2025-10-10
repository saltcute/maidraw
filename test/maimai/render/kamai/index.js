const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const kamai = new MaiDraw.Maimai.Adapters.KamaiTachi();
    MaiDraw.Maimai.Database.setLocalDatabasePath("../maimai-songs-database");
    const painter = new MaiDraw.Maimai.Painters.Best50();

    const fs = require("fs");

    const themes = [
        "jp-circle-landscape",
        "jp-circle-portrait",
        "cn-2025-landscape",
        "cn-2025-portrait",
        "salt-2026-landscape",
        "jp-finale-landscape",
        "jp-finale-portrait",
        "jp-prismplus-landscape",
        "jp-prismplus-portrait",
        "jp-prism-landscape",
        "jp-prism-portrait",
        "jp-buddiesplus-landscape",
        "jp-buddiesplus-portrait",
        "cn-2024-landscape",
        "cn-2024-portrait",
        "jp-buddies-landscape",
        "jp-buddies-portrait",
    ];
    for (let theme of themes) {
        const result = await painter.drawWithScoreSource(
            kamai.versions().prism(),
            { username: process.env.NAME },
            {
                scale: process.env.SCALE ?? 1,
                theme,
            }
        );
        if (result.status == "success") {
            fs.writeFileSync(
                upath.join(__dirname, `${theme}.webp`),
                await sharp(result.data)
                    .webp({
                        quality: 100,
                    })
                    .toBuffer()
            );
            console.log(`${theme} passed.`);
        } else {
            console.log(`${theme} failed: ${result.message}`);
        }
    }
    process.exit(0);
})();
