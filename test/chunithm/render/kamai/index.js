const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const kamai = new MaiDraw.Chuni.Adapters.KamaiTachi();
    MaiDraw.Chuni.Database.setLocalDatabasePath("../maimai-songs-database");
    const painter = new MaiDraw.Chuni.Painters.Best50();

    const fs = require("fs");
    const themes = [
        "jp-paradiselost-landscape-recents",
        "jp-paradiselost-landscape-new",
        "jp-xverse-landscape-recents",
        "jp-xverse-landscape-new",
        "jp-verse-landscape-recents",
        "jp-verse-landscape-new",
        "jp-luminousplus-landscape-recents",
        "jp-luminousplus-landscape-new",
        "jp-luminous-landscape-recents",
        "jp-luminous-landscape-new",
    ];
    const source = kamai.luminous();
    for (let theme of themes) {
        const result = await painter.drawWithScoreSource(
            source,
            { username: process.env.NAME },
            {
                scale: process.env.SCALE ?? 1,
                type: theme.endsWith("-new") ? "new" : "recents",
                theme,
                // version: "crystal",
            }
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
