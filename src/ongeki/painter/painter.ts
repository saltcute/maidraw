import { Painter } from "@common/painter/painter";
import type { ThemeManager } from "@common/painter/theme";
import type { OngekiScoreAdapter } from "../lib/adapter";

export abstract class OngekiPainter<Schema extends typeof ThemeManager.BASE_THEME> extends Painter<OngekiScoreAdapter, Schema> {
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
