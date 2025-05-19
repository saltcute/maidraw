const sharp = require("sharp");
const upath = require("upath");
(async () => {
    const { MaiDraw } = require("../../../../dist");
    const lxns = new MaiDraw.Chuni.Best50.LXNS({
        auth: "",
    });
    MaiDraw.Chuni.Chart.Database.setLocalDatabasePath(
        "../maimai-songs-database"
    );

    const fs = require("fs");
    const themes = ["jp-verse-landscape-recents"];
    const source = lxns;
    const username = "100732067870647";
    for (let theme of themes) {
        const options = {
            scale: 2,
            type: "recents",
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
