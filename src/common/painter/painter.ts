import { type DataOrError, MissingThemeError } from "@common/error";
import { wrapTranslate } from "@common/utils/ctxWrapper";
import { Canvas, type CanvasRenderingContext2D, registerFont } from "canvas";
import upath from "upath";
import { z } from "zod/v4";
import { resolveLayout } from "./layout";
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

    protected async wrapPainter(
        {
            theme,
            scale = 1,
            modules,
            painterCtx,
        }: {
            theme?: string;
            scale?: number;
            modules: Record<string, PainterModule>;
            painterCtx: unknown;
        },
        /**
         * Drawing steps of the painter. Every element of the theme is drawn in
         * declaration order when the callback is omitted.
         */
        callback?: (
            ctx: CanvasRenderingContext2D,
            currentTheme: NonNullable<ReturnType<typeof this.theme.get>>,
            drawElements: () => Promise<void>,
        ) => unknown,
    ): Promise<DataOrError<Buffer>> {
        let requestedTheme = this.theme.get(this.theme.defaultTheme);
        if (theme) {
            const res = this.theme.get(theme);
            if (res) {
                requestedTheme = res;
            }
        }
        if (!requestedTheme) {
            return {
                err: new MissingThemeError("maidraw.painter"),
            };
        }
        const currentTheme = requestedTheme;

        const layout = await resolveLayout({
            theme: currentTheme,
            modules,
            painterCtx,
            size: {
                width: currentTheme.content.width,
                height: currentTheme.content.height,
            },
            contributors: currentTheme.content.layout?.contributors,
        });

        const canvas = new Canvas(layout.width * scale, layout.height * scale);
        const ctx = canvas.getContext("2d");
        if (scale) ctx.scale(scale, scale);
        ctx.imageSmoothingEnabled = true;

        const drawElements = async () => {
            for (const { element, type, offset } of layout.elements) {
                const module = modules[type];
                if (!module) continue;
                await wrapTranslate(ctx, offset.x, offset.y, () => module.draw(ctx, currentTheme, element, painterCtx));
            }
        };
        if (callback) await callback(ctx, currentTheme, drawElements);
        else await drawElements();

        return { data: canvas.toBuffer() };
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

export interface Bounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export abstract class PainterModule {
    public static readonly SCHEMA: z.ZodType;

    private static readonly BOUNDS_ELEMENT = z.object({
        x: z.number().default(0),
        y: z.number().default(0),
        width: z.number().optional(),
        height: z.number().optional(),
    });

    public abstract draw(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof PainterModule.SCHEMA>,
        painterCtx: unknown,
    ): Promise<void>;

    /**
     * Bounding box the module actually occupies, relative to the anchor of the element.
     *
     * A module only grows the theme it is a layout contributor of when this box
     * is larger than the one reported by {@link PainterModule.getMinimumBounds}.
     */
    public async getBounds(
        ctx: CanvasRenderingContext2D,
        theme: Theme<unknown>,
        element: z.infer<typeof PainterModule.SCHEMA>,
        painterCtx: unknown,
    ): Promise<Bounds> {
        return this.getMinimumBounds(ctx, theme, element, painterCtx);
    }
    /**
     * Bounding box the module occupies with the dimensions declared in the theme,
     * relative to the anchor of the element.
     */
    public async getMinimumBounds(
        _ctx: CanvasRenderingContext2D,
        _theme: Theme<unknown>,
        element: z.infer<typeof PainterModule.SCHEMA>,
        _painterCtx: unknown,
    ): Promise<Bounds> {
        const result = PainterModule.BOUNDS_ELEMENT.safeParse(element);
        if (!result.success) return { x: 0, y: 0, width: 0, height: 0 };
        return {
            x: result.data.x,
            y: result.data.y,
            width: result.data.width ?? 0,
            height: result.data.height ?? 0,
        };
    }
}
