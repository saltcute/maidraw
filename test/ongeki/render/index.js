const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Geki.Best50.KamaiTachi();
    MaiDraw.Geki.Chart.Database.setLocalDatabasePath(
        "../maimai-songs-database"
    );

    const fs = require("fs");
    const themes = [
        "jp-brightmemory-landscape-classic",
        "jp-brightmemory-landscape-refresh",
        "jp-refresh-landscape-classic",
        "jp-refresh-landscape-refresh",
    ];
    const source = kamai.brightMemoryAct3();
    const username = "Cuvetan";
    for (let theme of themes) {
        const options = {
            scale: 0.5,
            type: theme.endsWith("-refresh") ? "refresh" : "classic",
            theme,
        };
        const result = await MaiDraw.Geki.Best50.drawWithScoreSource(
            source,
            username,
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
