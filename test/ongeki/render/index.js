const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Geki.Adapters.KamaiTachi();
    const painter = new MaiDraw.Geki.Painters.Best50();
    MaiDraw.Geki.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");
    const themes = [
        "jp-brightmemory-landscape-classic",
        "jp-brightmemory-landscape-refresh",
        "jp-refresh-landscape-classic",
        "jp-refresh-landscape-refresh",
    ];
    const source = kamai.brightMemoryAct3();
    for (let theme of themes) {
        const options = {
            scale: process.env.SCALE ?? 1,
            type: theme.endsWith("-refresh") ? "refresh" : "classic",
            theme,
        };
        const result = await painter.drawWithScoreSource(
            source,
            { username: process.env.NAME },
            options
        );
        if (result instanceof Buffer) {
            fs.writeFileSync(
                upath.join(__dirname, `${theme}.webp`),
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
    process.exit(0);
})();
