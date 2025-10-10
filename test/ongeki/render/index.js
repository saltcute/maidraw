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
        const drawTimer = process.hrtime.bigint();
        const result = await painter.drawWithScoreSource(
            source,
            { username: process.env.NAME },
            options
        );
        const drawDuration =
            (process.hrtime.bigint() - drawTimer) / BigInt(1e6);
        console.log(`${theme} draw time: ${drawDuration}ms`);

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
