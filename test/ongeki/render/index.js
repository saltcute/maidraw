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
        const { data: result, err } = await painter.drawWithScoreSource(
            (() => {
                switch (theme) {
                    case "jp-brightmemory-landscape-classic":
                    case "jp-brightmemory-landscape-refresh":
                        return kamai.brightMemoryAct3();
                    case "jp-refresh-landscape-classic":
                    case "jp-refresh-landscape-refresh":
                    default:
                        return kamai.refresh();
                }
            })(),
            { username: process.env.NAME },
            options
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
