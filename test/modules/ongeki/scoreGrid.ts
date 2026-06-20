import { Database } from "gcm-database-local/ongeki";
import { Painter } from "../../../src/common/painter/painter";
import { ScoreGridModule } from "../../../src/ongeki/painter/modules/scoreGrid";
import { best50Theme, getDummyScore, getElement } from "../../utils/ongeki/util";
import { localDatabasePath, moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(best50Theme.content.width, best50Theme.content.height, false, async (canvas) => {
    Painter.registerFonts("assets");

    const module = new ScoreGridModule(new Database(localDatabasePath));

    await module.draw(canvas.getContext("2d"), best50Theme, getElement(best50Theme, "score-grid", "new"), {
        type: "refresh",
        scores: {
            new: Array.from({ length: 10 }, () => getDummyScore()),
            old: [],
            recent: [],
        },
    });
    return canvas;
});
