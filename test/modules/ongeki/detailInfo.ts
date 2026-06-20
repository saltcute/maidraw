import { Database } from "gcm-database-local/ongeki";
import { Painter } from "../../../src/common/painter/painter";
import { DetailInfoModule } from "../../../src/ongeki/painter/modules/detailInfo";
import { chartTheme, getElement } from "../../utils/ongeki/util";
import { localDatabasePath, moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(chartTheme.content.width, chartTheme.content.height, false, async (canvas) => {
    Painter.registerFonts("assets");

    const database = new Database(localDatabasePath);
    const module = new DetailInfoModule(database);

    await module.draw(canvas.getContext("2d"), chartTheme, getElement(chartTheme, "detail-info"), {
        chartIdentifier: "1",
        region: "JPN",
    });
    return canvas;
});
