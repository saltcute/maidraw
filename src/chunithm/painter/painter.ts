import { Painter } from "@common/painter/painter";
import type { ThemeManager } from "@common/painter/theme";
import type { ChunithmScoreAdapter } from "../lib/adapter";

export abstract class ChunithmPainter<Schema extends typeof ThemeManager.BASE_THEME> extends Painter<ChunithmScoreAdapter, Schema> {
    public constructor({
        theme: { schema, searchPaths, defaultTheme },
    }: {
        theme: {
            schema: Schema;
            searchPaths: string[];
            defaultTheme: string;
        };
    }) {
        super({ theme: { schema, searchPaths, defaultTheme } });
    }
}
