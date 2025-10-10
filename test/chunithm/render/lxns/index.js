const sharp = require("sharp");
const upath = require("upath");
(async () => {
    const { MaiDraw } = require("../../../../dist");
    const lxns = new MaiDraw.Chuni.Adapters.LXNS({
        auth: process.env.AUTH,
    });
    const painter = new MaiDraw.Chuni.Painters.Best50();
    MaiDraw.Chuni.Database.setLocalDatabasePath("../maimai-songs-database");

    const fs = require("fs");
    const themes = ["jp-verse-landscape-new"];
    for (let theme of themes) {
        const options = {
            scale: process.env.SCALE ?? 1,
            type: "new",
            theme,
        };
        const result = await painter.drawWithScoreSource(
            lxns,
            { username: process.env.NAME },
            options
        );
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
