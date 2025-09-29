const sharp = require("sharp");
const upath = require("upath");

(async () => {
    const { MaiDraw } = require("../../../../dist");
    const kamai = new MaiDraw.Maimai.Adapters.KamaiTachi();
    MaiDraw.Maimai.Database.setLocalDatabasePath("../maimai-songs-database");
    const painter = new MaiDraw.Maimai.Painters.Best50();

    const fs = require("fs");

    for (let i = 0; i <= 100; i += 10) {
        const profile = await kamai.getPlayerInfo(process.env.NAME);
        const score = await kamai.getPlayerBest50(process.env.NAME);
        score.new.forEach((v) => (v.optionalData.scale = i / 100));
        score.old.forEach((v) => (v.optionalData.scale = i / 100));
        let result = await painter.draw(
            {
                username: profile.name,
                rating: profile.rating,
                newScores: score.new,
                oldScores: score.old,
            },
            {
                scale: process.env.SCALE ?? 1,
                theme: "jp-circle-landscape",
            }
        );

        if (result) {
            fs.writeFileSync(
                upath.join(__dirname, `${i}%.webp`),
                await sharp(result)
                    .webp({
                        quality: 100,
                    })
                    .toBuffer()
            );
            console.log(`${i}%...`);
        }
    }
    process.exit(0);
})();
