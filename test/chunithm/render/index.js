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
    const best50 = await kamai
        .luminousPlus()
        .getPlayerBest50("bento", KamaiTachi.EGameVersions.CHUNITHM_SUN_PLUS);
    const themes = ["jp-verse-landscape"];
    for (let theme of themes) {
        const result = await MaiDraw.Chuni.Best50.draw(
            "CODEX♪☆＊♀∀＃＆＠",
            16.384,
            best50.new,
            best50.old,
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
