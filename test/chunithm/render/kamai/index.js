const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const kamai = new MaiDraw.Chuni.Best50.KamaiTachi();
    MaiDraw.Chuni.Chart.Database.setLocalDatabasePath(
        "../maimai-songs-database"
    );

    const fs = require("fs");
    const themes = ["jp-verse-landscape-recents", "jp-verse-landscape-new"];
    const source = kamai.verse();
    const username = "";
    for (let theme of themes) {
        const options = {
            scale: 0.5,
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
