const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const maishift = new MaiDraw.Maimai.Adapters.Maishift();
    const painter = new MaiDraw.Maimai.Painters.Best50();
    MaiDraw.Maimai.Database.setLocalDatabasePath(
        upath.join(
            __dirname,
            "..",
            "..",
            "..",
            "..",
            "..",
            "maimai-songs-database"
        )
    );

    const fs = require("fs");

    const themes = ["jp-prismplus-landscape"];
    for (let theme of themes) {
        let result = await painter.drawWithScoreSource(
            maishift,
            {
                username: process.env.NAME,
            },
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
