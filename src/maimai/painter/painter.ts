import { Painter } from "@common/painter/painter";
import type { ThemeManager } from "@common/painter/theme";
import type { MaimaiScoreAdapter } from "../lib/adapter";

export abstract class MaimaiPainter<Schema extends typeof ThemeManager.BASE_THEME> extends Painter<MaimaiScoreAdapter, Schema> {
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
