import { Database } from "gcm-database-local/chunithm";
import { DetailInfoModule } from "../../../src/chunithm/painter/modules/detailInfo";
import { Painter } from "../../../src/common/painter/painter";
import { chartTheme } from "../../utils/chunithm/util";
import { localDatabasePath, moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(615 + 100, 745 + 100, false, async (canvas) => {
    const database = new Database(localDatabasePath);
    const module = new DetailInfoModule(database);

    Painter.registerFonts("assets");
    const identifier = "2718";
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
            region: "JPN",
        },
    );
    return canvas;
});
