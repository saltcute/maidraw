import assert from "node:assert/strict";
import { ChartGridModule as ChuModule } from "@chunithm/painter/modules/chartGrid";
import { Painter } from "@common/painter/painter";
import { ChartGridModule as MaiModule } from "@maimai/painter/modules/chartGrid";
import { ChartGridModule as GekiModule } from "@ongeki/painter/modules/chartGrid";
import { chartTheme as chuTheme } from "@utils/chunithm/util";
import { chartTheme as maiTheme } from "@utils/maimai/util";
import { chartTheme as gekiTheme } from "@utils/ongeki/util";
import { localDatabasePath, moduleTestWrapper } from "@utils/util";
import type { CanvasRenderingContext2D } from "canvas";
import { Difficulty as ChuDifficulty } from "gcm-database/chunithm";
import { Difficulty as MaiDifficulty } from "gcm-database/maimai";
import { Difficulty as GekiDifficulty } from "gcm-database/ongeki";
import { Database as ChuDatabase } from "gcm-database-local/chunithm";
import { Database as MaiDatabase } from "gcm-database-local/maimai";
import { Database as GekiDatabase } from "gcm-database-local/ongeki";

type History = "empty" | "single" | "repeated" | "changing" | "inferred removal" | "explicit removal";
const histories: History[] = ["empty", "single", "repeated", "changing", "inferred removal", "explicit removal"];

async function prepareMai(ctx: CanvasRenderingContext2D) {
    const database = new MaiDatabase(localDatabasePath);
    const { data: chart } = await database.getChart("11822", MaiDifficulty.BASIC);
    assert.ok(chart);
    const module = new MaiModule(database);
    const theme = maiTheme;
    const element = MaiModule.SCHEMA.parse(theme.content.elements.find((e: { type: string }) => e.type === "chart-grid"));
    element.bubble.margin = 2;
    const height = 164;
    const versionWidth = (((height - 4) * 3) / 8 / 160) * 332;
    return async (capacity: number, history: History) => {
        const count = history === "empty" ? 0 : history === "single" ? 1 : 6;
        const presences = Array.from({ length: count }, (_, i) => ({
            type: "existence" as const,
            version: {
                name: "Regression fixture",
                region: "DX" as const,
                gameVersion: { major: 2, minor: 65 - (count - 1 - i) * 5 - (history === "inferred removal" ? 5 : 0) },
            },
            data: { level: history === "repeated" ? 10 : 10 + i / 10 },
        }));
        const fixture = { ...chart, optionalData: { ...chart.optionalData, presences: [...presences] as typeof chart.optionalData.presences } };
        if (history === "explicit removal") {
            fixture.optionalData.presences.push({ type: "removal", version: presences[presences.length - 1].version });
        }
        const width = height * 2 + 8 + 20 + 0 + capacity * versionWidth;
        let events = 0;
        const getFile = theme.getFile.bind(theme);
        theme.getFile = (path) => {
            events++;
            return getFile(path);
        };
        try {
            // Exercise the history branch directly so card decorations cannot hide capacity failures.
            // biome-ignore lint/complexity/useLiteralKeys: bracket access permits testing this private layout branch
            await module["drawInternalLevelTrend"](
                ctx,
                theme,
                element,
                {
                    chartIdentifier: "11822",
                    scores: { easy: null, basic: null, advanced: null, expert: null, master: null, remaster: null, utage: null },
                    region: "DX",
                },
                { width, height, isShort: false, targetRegion: "DX", chart: fixture },
                20,
            );
        } finally {
            theme.getFile = getFile;
        }
        return events;
    };
}

async function prepareChu(ctx: CanvasRenderingContext2D) {
    const database = new ChuDatabase(localDatabasePath);
    const { data: chart } = await database.getChart("2718", ChuDifficulty.BASIC);
    assert.ok(chart);
    const module = new ChuModule(database);
    const theme = chuTheme;
    const element = ChuModule.SCHEMA.parse(theme.content.elements.find((e: { type: string }) => e.type === "chart-grid"));
    element.bubble.margin = 2;
    const height = 164;
    const versionWidth = ((height - 4) / 2 / 160) * 201;
    return async (capacity: number, history: History) => {
        const count = history === "empty" ? 0 : history === "single" ? 1 : 6;
        const presences = Array.from({ length: count }, (_, i) => ({
            type: "existence" as const,
            version: {
                name: "Regression fixture",
                region: "JPN" as const,
                gameVersion: { major: 2, minor: 45 - (count - 1 - i) * 5 - (history === "inferred removal" ? 5 : 0) },
            },
            data: { level: history === "repeated" ? 10 : 10 + i / 10 },
        }));
        const fixture = { ...chart, optionalData: { ...chart.optionalData, presences: [...presences] as typeof chart.optionalData.presences } };
        if (history === "explicit removal") {
            fixture.optionalData.presences.push({ type: "removal", version: presences[presences.length - 1].version });
        }
        const width = height * 2 + 8 + 20 + versionWidth + capacity * versionWidth;
        let events = 0;
        const getFile = theme.getFile.bind(theme);
        theme.getFile = (path) => {
            events++;
            return getFile(path);
        };
        try {
            // Exercise the history branch directly so card decorations cannot hide capacity failures.
            // biome-ignore lint/complexity/useLiteralKeys: bracket access permits testing this private layout branch
            await module["drawInternalLevelTrend"](
                ctx,
                theme,
                element,
                {
                    chartIdentifier: "2718",
                    scores: { basic: null, advanced: null, expert: null, master: null, ultima: null, [ChuDifficulty.WORLDS_END]: null },
                    region: "JPN",
                },
                { width, height, isShort: false, targetRegion: "JPN", chart: fixture },
                20,
                10,
            );
        } finally {
            theme.getFile = getFile;
        }
        return events;
    };
}

async function prepareGeki(ctx: CanvasRenderingContext2D) {
    const database = new GekiDatabase(localDatabasePath);
    const { data: chart } = await database.getChart("1027", GekiDifficulty.BASIC);
    assert.ok(chart);
    const module = new GekiModule(database);
    const theme = gekiTheme;
    const element = GekiModule.SCHEMA.parse(theme.content.elements.find((e: { type: string }) => e.type === "chart-grid"));
    element.bubble.margin = 2;
    const height = 139;
    const versionWidth = ((height - 4) / 2 / 270) * 360;
    return async (capacity: number, history: History) => {
        const count = history === "empty" ? 0 : history === "single" ? 1 : 6;
        const presences = Array.from({ length: count }, (_, i) => ({
            type: "existence" as const,
            version: {
                name: "Regression fixture",
                region: "JPN" as const,
                gameVersion: { major: 1, minor: 50 - (count - 1 - i) * 5 - (history === "inferred removal" ? 5 : 0) },
            },
            data: { level: history === "repeated" ? 10 : 10 + i / 10 },
        }));
        const fixture = { ...chart, optionalData: { ...chart.optionalData, presences: [...presences] as typeof chart.optionalData.presences } };
        if (history === "explicit removal") {
            fixture.optionalData.presences.push({ type: "removal", version: presences[presences.length - 1].version });
        }
        const width = height * 2 + 8 + 20 + versionWidth + capacity * versionWidth;
        let events = 0;
        const getFile = theme.getFile.bind(theme);
        theme.getFile = (path) => {
            events++;
            return getFile(path);
        };
        try {
            // Exercise the history branch directly so card decorations cannot hide capacity failures.
            // biome-ignore lint/complexity/useLiteralKeys: bracket access permits testing this private layout branch
            await module["drawInternalLevelTrend"](
                ctx,
                theme,
                element,
                { width, height, isShort: false, targetRegion: "JPN", chart: fixture },
                20,
                10,
            );
        } finally {
            theme.getFile = getFile;
        }
        return events;
    };
}

moduleTestWrapper(1200, 1500, false, async (canvas) => {
    Painter.registerFonts("assets");
    const ctx = canvas.getContext("2d");
    const fillText = ctx.fillText.bind(ctx);
    ctx.fillText = (text, x, y, maxWidth) => {
        assert.ok(Number.isFinite(x) && Number.isFinite(y), `Nonfinite text position for ${text}`);
        if (maxWidth === undefined) fillText(text, x, y);
        else fillText(text, x, y, maxWidth);
    };
    const fixtures = [await prepareMai(ctx), await prepareChu(ctx), await prepareGeki(ctx)];
    let checks = 0;
    for (const [game, draw] of fixtures.entries()) {
        for (const history of histories) {
            for (const capacity of [-2, 0, 0.5, 1, 1.25, 2, 3, 8]) {
                const count = await draw(capacity, history);
                assert.ok(count <= Math.max(0, Math.floor(capacity)), `${game}: ${history}, capacity ${capacity}, drew ${count}`);
                if (history !== "empty" && capacity >= 1 && capacity < 2) assert.equal(count, 1, `${game}: ${history}, capacity ${capacity}`);
                checks++;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }
    ctx.fillStyle = "#252535";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const [game, draw] of fixtures.entries()) {
        for (const [row, history] of histories.entries()) {
            ctx.save();
            ctx.translate(0, game * 480 + row * 75);
            ctx.scale(0.6, 0.6);
            ctx.font = "16px sans-serif";
            ctx.textAlign = "left";
            ctx.fillStyle = "white";
            ctx.fillText(`${["maimai", "CHUNITHM", "ONGEKI"][game]}: ${history}`, 10, 20);
            await draw(history === "single" || history.includes("removal") ? 1 : 8, history);
            ctx.restore();
        }
    }
    console.log(`Passed ${checks} chart history capacity checks`);
    return canvas;
});
