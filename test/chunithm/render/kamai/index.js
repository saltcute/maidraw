const sharp = require("sharp");
const upath = require("upath");
const { KamaiTachi } = require("../../../../dist/chu/bests/lib/kamaiTachi");

(async () => {
    const kamai = new KamaiTachi();
    const { MaiDraw } = require("../../../../dist");
    MaiDraw.Chuni.Chart.Database.setLocalDatabasePath(
        "../maimai-songs-database"
    );

    const fs = require("fs");
    const themes = ["jp-verse-landscape-recents", "jp-verse-landscape-new"];
    const source = kamai.verse();
    const username = "salt";
    for (let theme of themes) {
        const options = {
            scale: 2,
            type: theme.endsWith("-new") ? "new" : "recents",
            theme,
        };
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
