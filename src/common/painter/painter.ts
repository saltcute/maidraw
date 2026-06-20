import { type DataOrError, MissingThemeError } from "@common/error";
import { Canvas, type CanvasRenderingContext2D, registerFont } from "canvas";
import upath from "upath";
import type { z } from "zod/v4";
import { type Theme, ThemeManager } from "./theme";

export abstract class Painter<Adapter, Schema extends typeof ThemeManager.BASE_THEME> {
    public static registerFonts(path: string) {
        registerFont(upath.join(path, "fonts", "gen-jyuu-gothic", "GenJyuuGothic-Bold.ttf"), {
            family: "standard-font-title-jp",
        });
        registerFont(upath.join(path, "fonts", "comfortaa", "Comfortaa-Bold.ttf"), {
            family: "standard-font-title-latin",
        });
        registerFont(upath.join(path, "fonts", "seurat-db", "FOT-Seurat Pro DB.otf"), {
            family: "standard-font-username",
        });
        registerFont(upath.join(path, "fonts", "jost", "Jost-Regular.ttf"), {
            family: "ongeki-font-level",
        });
        registerFont(upath.join(path, "fonts", "sega-sans-db", "SegaKakuGothic-DB.ttf"), {
            family: "chunithm-font-username",
        });
    }

    protected readonly theme: ThemeManager<Schema>;
    protected static get assetsPath() {
        return upath.join(__dirname, "..", "..", "..", "assets");
    }

    protected async wrapPainter<T>(
        callback: (ctx: CanvasRenderingContext2D, currentTheme: NonNullable<ReturnType<typeof this.theme.get>>) => T,
        {
            theme,
            scale = 1,
        }: {
            theme?: string;
            scale?: number;
        },
    ) {
        let currentTheme = this.theme.get(this.theme.defaultTheme);
        if (theme) {
            const res = this.theme.get(theme);
            if (res) {
                currentTheme = res;
            }
        }
        if (currentTheme) {
            const canvas = new Canvas(currentTheme.content.width * scale, currentTheme.content.height * scale);
            const ctx = canvas.getContext("2d");
            if (scale) ctx.scale(scale, scale);
            ctx.imageSmoothingEnabled = true;
            await callback(ctx, currentTheme);
            return { data: canvas.toBuffer() };
        } else {
            return {
                err: new MissingThemeError("maidraw.painter"),
            };
        }
    }

    public constructor({
        theme: { schema, searchPaths, defaultTheme },
    }: {
        theme: {
            schema: Schema;
            searchPaths: string[];
            defaultTheme: string;
        };
    }) {
        this.theme = new ThemeManager(schema, searchPaths, defaultTheme);

        Painter.registerFonts(Painter.assetsPath);
    }

    public abstract draw(variables: Record<string, unknown>, options: { scale?: number } | Record<string, unknown>): Promise<DataOrError<Buffer>>;
    public abstract drawWithScoreSource(
        source: Adapter,
        variables: Record<string, unknown>,
        options: { scale?: number } | Record<string, unknown>,
    ): Promise<DataOrError<Buffer>>;
}

export abstract class PainterModule {
    public static readonly SCHEMA: z.ZodType;
    public abstract draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof PainterModule.SCHEMA>,
        painterCtx: unknown,
    ): Promise<void>;
}
