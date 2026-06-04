const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const kamai = new MaiDraw.Chuni.Adapters.KamaiTachi();
    MaiDraw.Chuni.Database.setLocalDatabasePath("../maimai-songs-database");
    const painter = new MaiDraw.Chuni.Painters.Best50();

    const fs = require("node:fs");
    const themes = [
        "jp-xversex-landscape-recents",
        "jp-xversex-landscape-new",
        "jp-xverse-landscape-recents",
        "jp-xverse-landscape-new",
        "jp-verse-landscape-recents",
        "jp-verse-landscape-new",
        "jp-paradiselost-landscape-recents",
        "jp-paradiselost-landscape-new",
        "jp-luminousplus-landscape-recents",
        "jp-luminousplus-landscape-new",
        "jp-luminous-landscape-recents",
        "jp-luminous-landscape-new",
    ];
    for (const theme of themes) {
        const { data: result, err } = await painter.drawWithScoreSource(
            (() => {
                switch (theme) {
                    case "jp-paradiselost-landscape-recents":
                    case "jp-paradiselost-landscape-new":
                        return kamai.paradiseLost();
                    case "jp-luminous-landscape-recents":
                    case "jp-luminous-landscape-new":
                        return kamai.luminous();
                    case "jp-luminousplus-landscape-recents":
                    case "jp-luminousplus-landscape-new":
                        return kamai.luminousPlus();
                    case "jp-verse-landscape-recents":
                    case "jp-verse-landscape-new":
                        return kamai.verse();
                    case "jp-xverse-landscape-recents":
                    case "jp-xverse-landscape-new":
                        return kamai.xverse();
                    default:
                        return kamai.xversex();
                }
            })(),
            { username: process.env.NAME },
            {
                scale: process.env.SCALE ?? 1,
                type: theme.endsWith("-new") ? "new" : "recents",
                theme,
                version: (() => {
                    switch (theme) {
                        case "jp-paradiselost-landscape-recents":
                        case "jp-paradiselost-landscape-new":
                            return "crystal";
                        case "jp-luminous-landscape-recents":
                        case "jp-luminous-landscape-new":
                        case "jp-luminousplus-landscape-recents":
                        case "jp-luminousplus-landscape-new":
                            return "new";
                        default:
                            return "verse";
                    }
                })(),
            },
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
                    .toBuffer(),
            );
            console.log(`${theme} passed.`);
        }
    }
    process.exit(0);
})();
