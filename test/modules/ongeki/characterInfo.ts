import { Painter } from "@common/painter/painter";
import { CharacterInfoModule } from "@ongeki/painter/modules/characterInfo";
import { envString } from "@utils/env";
import { chartTheme, getElement } from "@utils/ongeki/util";
import { localDatabasePath, moduleTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/ongeki";

moduleTestWrapper(chartTheme.content.width, chartTheme.content.height, false, async (canvas) => {
    Painter.registerFonts(envString("TEST_ASSETS_PATH", "assets"));

    const database = new Database(localDatabasePath);
    const module = new CharacterInfoModule(database);

    await module.draw(canvas.getContext("2d"), chartTheme, getElement(chartTheme, "character-info"), {
        chartIdentifier: envString("TEST_CHART_IDENTIFIER", "1"),
    });
    return canvas;
});
