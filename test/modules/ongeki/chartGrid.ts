import { Painter } from "@common/painter/painter";
import type { Score } from "@ongeki/lib/types";
import { ChartGridModule } from "@ongeki/painter/modules/chartGrid";
import { envChoice, envString } from "@utils/env";
import { chartTheme, getDummyScore, getElement } from "@utils/ongeki/util";
import { localDatabasePath, moduleTestWrapper } from "@utils/util";
import { Difficulty } from "gcm-database/ongeki";
import { Database } from "gcm-database-local/ongeki";

moduleTestWrapper(chartTheme.content.width, chartTheme.content.height, false, async (canvas) => {
    Painter.registerFonts(envString("TEST_ASSETS_PATH", "assets"));

    const database = new Database(localDatabasePath);
    const module = new ChartGridModule(database);

    const identifier = envString("TEST_CHART_IDENTIFIER", "1");
    await module.draw(canvas.getContext("2d"), chartTheme, getElement(chartTheme, "chart-grid"), {
        chartIdentifier: identifier,
        type: envChoice("TEST_TYPE", ["refresh", "classic"], "refresh"),
        region: envChoice("TEST_REGION", ["JPN"], "JPN"),
        scores: Object.fromEntries(
            await Promise.all(
                Object.values(Difficulty).map(async (v) => {
                    const { data: chart } = await database.getChart(identifier, v);
                    return [v, chart ? getDummyScore() : null];
                }),
            ),
        ) as unknown as Record<Difficulty, Score | null>,
    });
    return canvas;
});
