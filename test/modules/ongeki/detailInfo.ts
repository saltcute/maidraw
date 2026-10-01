import { Painter } from "@common/painter/painter";
import { DetailInfoModule } from "@ongeki/painter/modules/detailInfo";
import { envChoice, envString } from "@utils/env";
import { chartTheme, getElement } from "@utils/ongeki/util";
import { localDatabasePath, moduleTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/ongeki";

moduleTestWrapper(chartTheme.content.width, chartTheme.content.height, false, async (canvas) => {
    Painter.registerFonts(envString("TEST_ASSETS_PATH", "assets"));

    const database = new Database(localDatabasePath);
    const module = new DetailInfoModule(database);

    await module.draw(canvas.getContext("2d"), chartTheme, getElement(chartTheme, "detail-info"), {
        chartIdentifier: envString("TEST_CHART_IDENTIFIER", "1"),
        region: envChoice("TEST_REGION", ["JPN"], "JPN"),
    });
    return canvas;
});
