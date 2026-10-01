import { Painter } from "@common/painter/painter";
import { ScoreGridModule } from "@ongeki/painter/modules/scoreGrid";
import { envChoice, envNumber, envString } from "@utils/env";
import { best50Theme, getDummyScore, getElement } from "@utils/ongeki/util";
import { localDatabasePath, moduleTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/ongeki";

moduleTestWrapper(best50Theme.content.width, best50Theme.content.height, false, async (canvas) => {
    Painter.registerFonts(envString("TEST_ASSETS_PATH", "assets"));

    const module = new ScoreGridModule(new Database(localDatabasePath));

    await module.draw(canvas.getContext("2d"), best50Theme, getElement(best50Theme, "score-grid", "new"), {
        type: envChoice("TEST_TYPE", ["refresh", "classic"], "refresh"),
        scores: {
            new: Array.from({ length: envNumber("TEST_SCORES_COUNT", 10, true) }, () => getDummyScore()),
            old: [],
            recent: [],
        },
    });
    return canvas;
});
