import { Painter } from "@common/painter/painter";
import { CharacterInfoModule } from "@ongeki/painter/modules/characterInfo";
import { chartTheme, getElement } from "@utils/ongeki/util";
import { localDatabasePath, moduleTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/ongeki";

moduleTestWrapper(chartTheme.content.width, chartTheme.content.height, false, async (canvas) => {
    Painter.registerFonts("assets");

    const database = new Database(localDatabasePath);
    const module = new CharacterInfoModule(database);

    await module.draw(canvas.getContext("2d"), chartTheme, getElement(chartTheme, "character-info"), {
        chartIdentifier: "1",
    });
    return canvas;
});
