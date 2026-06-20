import { Difficulty } from "gcm-database/ongeki";
import { Database } from "gcm-database-local/ongeki";
import { Painter } from "../../../src/common/painter/painter";
import type { Score } from "../../../src/ongeki/lib/types";
import { ChartGridModule } from "../../../src/ongeki/painter/modules/chartGrid";
import { chartTheme, getDummyScore, getElement } from "../../utils/ongeki/util";
import { localDatabasePath, moduleTestWrapper } from "../../utils/util";

moduleTestWrapper(chartTheme.content.width, chartTheme.content.height, false, async (canvas) => {
    Painter.registerFonts("assets");

    const database = new Database(localDatabasePath);
    const module = new ChartGridModule(database);

    const identifier = "1";
    await module.draw(canvas.getContext("2d"), chartTheme, getElement(chartTheme, "chart-grid"), {
        chartIdentifier: identifier,
        type: "refresh",
        region: "JPN",
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
