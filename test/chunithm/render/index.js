const sharp = require("sharp");
const upath = require("upath");
const { KamaiTachi } = require("../../../dist/chu/bests/lib/kamaiTachi");

(async () => {
    const kamai = new KamaiTachi();
    const { MaiDraw } = require("../../../dist");
    MaiDraw.Chuni.Chart.Database.setLocalDatabasePath(
        "../maimai-songs-database"
    );

    const fs = require("fs");
    const themes = ["jp-verse-landscape"];
    const source = kamai.verse();
    const username = "codex";
    const options = {
        scale: 2,
    };
    for (let theme of themes) {
        const result = await MaiDraw.Chuni.Best50.drawWithScoreSource(
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
