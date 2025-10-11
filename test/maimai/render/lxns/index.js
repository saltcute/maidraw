const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const painter = new MaiDraw.Maimai.Painters.Best50();
    const lxns = new MaiDraw.Maimai.Adapters.LXNS({
        auth: process.env.AUTH,
    });
    MaiDraw.Maimai.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");

    const themes = [
        "cn-2025-landscape",
        "cn-2025-portrait",
        "cn-2024-landscape",
        "cn-2024-portrait",
    ];
    for (let theme of themes) {
        const result = await painter.drawWithScoreSource(
            lxns,
            {
                username: process.env.NAME,
            },
            {
                theme,
                scale: process.env.SCALE ?? 1,
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
