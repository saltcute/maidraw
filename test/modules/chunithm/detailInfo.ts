import { DetailInfoModule } from "@chunithm/painter/modules/detailInfo";
import { Painter } from "@common/painter/painter";
import { chartTheme } from "@utils/chunithm/util";
import { envChoice, envString } from "@utils/env";
import { localDatabasePath, moduleTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/chunithm";

moduleTestWrapper(615 + 100, 745 + 100, false, async (canvas) => {
    const database = new Database(localDatabasePath);
    const module = new DetailInfoModule(database);

    Painter.registerFonts(envString("TEST_ASSETS_PATH", "assets"));
    const identifier = envString("TEST_CHART_IDENTIFIER", "2718");
    await module.draw(
        canvas.getContext("2d"),
        chartTheme,
        {
            type: "detail-info",
            x: 50,
            y: 50,
            width: 615,
            height: 745,
            margin: 40,
            color: {
                card: "#b8bbf2",
            },
        },
        {
            chartIdentifier: identifier,
            region: envChoice("TEST_REGION", ["JPN", "INT", "CHN"], "JPN"),
        },
    );
    return canvas;
});
