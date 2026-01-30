const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const lxns = new MaiDraw.Maimai.Adapters.LXNS({
        auth: "",
    });
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

    const themes = ["jp-prism-landscape"];
    for (let theme of themes) {
        const { data: result, err } = await painter.drawWithScoreSource(
            lxns,
            {
                username: process.env.NAME,
            },
            {
                scale: process.env.SCALE ?? 1,
                theme,
            }
        );
        if (err) {
            console.log(`${theme} failed!`);
            console.log(err);
        } else {
            fs.writeFileSync(
                upath.join(__dirname, `${theme}.webp`),
                await sharp(result)
                    .webp({
                        quality: 60,
                    })
                    .toBuffer()
            );
            console.log(`${theme} passed.`);
        }
    }
    process.exit(0);
})();
