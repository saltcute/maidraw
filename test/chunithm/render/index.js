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
    const themes = ["jp-verse-landscape"];
    const source = kamai.luminousPlus();
    const username = "bento";
    const options = {
        // scale: 1,
    };
    for (let theme of themes) {
        const profile = await source.getPlayerInfo(username);
        const score = await source.getPlayerBest50(username);
        if (!profile || !score) return null;
        const result = await MaiDraw.Chuni.Best50.draw(
            profile.name,
            profile.rating,
            score.new,
            score.old,
            {
                ...options,
                profilePicture:
                    options?.profilePicture === null
                        ? undefined
                        : options?.profilePicture ||
                          (await source.getPlayerProfilePicture(username)) ||
                          undefined,
            }
        );
        // const result = await MaiDraw.Chuni.Best50.drawWithScoreSource(
        //     kamai.luminousPlus(),
        //     "bento",
        //     {
        //         scale: 2,
        //     }
        // );
        console.log(result);
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
