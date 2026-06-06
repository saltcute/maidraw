const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const kamai = new MaiDraw.Maimai.Adapters.KamaiTachi();
    MaiDraw.Maimai.Database.setLocalDatabasePath("../maimai-songs-database");
    const painter = new MaiDraw.Maimai.Painters.Best50();

    const fs = require("node:fs");

    const themes = [
        "cn-2026-landscape",
        "cn-2026-portrait",
        "jp-circleplus-landscape",
        "jp-circleplus-portrait",
        "salt-2026-landscape",
        "salt-2026-portrait",
        "jp-circle-landscape",
        "jp-circle-portrait",
        "cn-2025-landscape",
        "cn-2025-portrait",
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
    for (const theme of themes) {
        const { data: result, err } = await painter.drawWithScoreSource(
            (() => {
                switch (theme) {
                    case "jp-circleplus-landscape":
                    case "jp-circleplus-portrait":
                        return kamai.versions().circlePlus();
                    case "jp-circle-landscape":
                    case "jp-circle-portrait":
                        return kamai.versions().circle();
                    case "jp-prismplus-landscape":
                    case "jp-prismplus-portrait":
                        return kamai.versions().prismPlus();
                    case "cn-2026-landscape":
                    case "cn-2026-portrait":
                        return kamai.versions().CN().DX2026();
                    case "jp-prism-landscape":
                    case "jp-prism-portrait":
                        return kamai.versions().prism();
                    case "jp-buddiesplus-landscape":
                    case "jp-buddiesplus-portrait":
                        return kamai.versions().buddiesPlus();
                    case "cn-2025-landscape":
                    case "cn-2025-portrait":
                        return kamai.versions().CN().DX2025();
                    case "jp-buddies-landscape":
                    case "jp-buddies-portrait":
                        return kamai.versions().buddies();
                    case "cn-2024-landscape":
                    case "cn-2024-portrait":
                        return kamai.versions().CN().DX2024();
                    case "jp-finale-landscape":
                    case "jp-finale-portrait":
                        return kamai.versions().finale();
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
