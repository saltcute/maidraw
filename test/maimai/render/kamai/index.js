const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const kamai = new MaiDraw.Maimai.Adapters.KamaiTachi();
    MaiDraw.Maimai.Database.setLocalDatabasePath("../maimai-songs-database");
    const painter = new MaiDraw.Maimai.Painters.Best50();

    const fs = require("fs");

    const themes = [
        "jp-circle-landscape",
        "jp-circle-portrait",
        "cn-2025-landscape",
        "cn-2025-portrait",
        "salt-2026-landscape",
        "jp-finale-landscape",
        "jp-finale-portrait",
        "jp-prismplus-landscape",
        "jp-prismplus-portrait",
        "jp-prism-landscape",
        "jp-prism-portrait",
        "jp-buddiesplus-landscape",
        "jp-buddiesplus-portrait",
        "cn-2024-landscape",
        "cn-2024-portrait",
        "jp-buddies-landscape",
        "jp-buddies-portrait",
    ];
    const type = "full";
    for (let theme of themes) {
        const { data: result, err } = await painter.drawWithScoreSource(
            (() => {
                switch (theme) {
                    case "jp-circle-landscape":
                    case "jp-circle-portrait":
                        return kamai.versions().circle();
                    case "jp-prismplus-landscape":
                    case "jp-prismplus-portrait":
                        return kamai.versions().prismPlus();
                    case "jp-prism-landscape":
                    case "jp-prism-portrait":
                        return kamai.versions().prism();
                    case "jp-buddiesplus-landscape":
                    case "jp-buddiesplus-portrait":
                        return kamai.versions().buddiesPlus();
                    case "jp-buddies-landscape":
                    case "jp-buddies-portrait":
                        return kamai.versions().buddies();
                    case "jp-finale-landscape":
                    case "jp-finale-portrait":
                        return kamai.versions().finale();
                    case "cn-2025-landscape":
                    case "cn-2025-portrait":
                        return kamai.versions().CN().DX2025();
                    case "cn-2024-landscape":
                    case "cn-2024-portrait":
                        return kamai.versions().CN().DX2024();
                    default:
                        return kamai;
                }
            })(),
            {
                username: process.env.NAME,
            },
            {
                scale: process.env.SCALE ?? 1,
                theme,
            }
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
