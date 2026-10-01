import { Painter } from "@common/painter/painter";
import { DetailInfoModule } from "@maimai/painter/modules/detailInfo";
import { envChoice, envString } from "@utils/env";
import { chartTheme } from "@utils/maimai/util";
import { moduleTestWrapper } from "@utils/util";
import { Database } from "gcm-database-local/maimai";
import { join } from "upath";

moduleTestWrapper(615 + 100, 745 + 100, false, async (canvas) => {
    const database = new Database(envString("TEST_DATABASE_PATH", join(__dirname, "..", "..", "..", "..", "maimai-songs-database")));
    const module = new DetailInfoModule(database);

    Painter.registerFonts(envString("TEST_ASSETS_PATH", "assets"));
    const identifier = envString("TEST_CHART_IDENTIFIER", "11451");
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
                card: "#ffa7c5",
            },
            sprites: {
                mode: {
                    standard: "../../best50/versionless/mode/jp/standard.webp",
                    dx: "../../best50/versionless/mode/jp/dx.webp",
                },
            },
        },
        {
            chartIdentifier: identifier,
            region: envChoice("TEST_REGION", ["DX", "EX", "CN"], "DX"),
        },
    );
    return canvas;
});
