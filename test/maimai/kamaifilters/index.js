const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../dist");
    const kamai = new MaiDraw.Maimai.Best50.KamaiTachi();
    MaiDraw.Maimai.Chart.Database.setLocalDatabasePath(
        "../maimai-songs-database"
    );

    const fs = require("fs");

    const themes = ["jp-prismplus-landscape"];
    const user = "salt";
    const profile = await kamai.getPlayerInfo(user, {
        use: "AP",
    });
    const score = await kamai.getPlayerBest50(user, {
        use: "AP",
    });
    for (let theme of themes) {
        const result = await MaiDraw.Maimai.Best50.draw(
            "SALT♪☆＊♀∀＃＆＠",
            profile.rating,
            score.new,
            score.old,
            {
                scale: 2,
                theme,
            }
        );
        if (result) {
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
