import * as fs from "fs";
import upath from "upath";
import Color from "color";
import { z } from "zod/v4";
import { globSync } from "glob";
import stringFormat from "string-template";
import {
    CanvasRenderingContext2D,
    Image as CanvasImage,
    registerFont,
} from "canvas";

import { Util } from "./util";

export abstract class Painter<
    Adapter,
    Schema extends typeof ThemeManager.BaseObject,
> {
    protected readonly theme: ThemeManager<Schema>;
    protected static get assetsPath() {
        return upath.join(__dirname, "..", "..", "assets");
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

        registerFont(
            upath.join(
                Painter.assetsPath,
                "fonts",
                "gen-jyuu-gothic",
                "GenJyuuGothic-Bold.ttf"
            ),
            {
                family: "standard-font-title-jp",
            }
        );
        registerFont(
            upath.join(
                Painter.assetsPath,
                "fonts",
                "comfortaa",
                "Comfortaa-Bold.ttf"
            ),
            {
                family: "standard-font-title-latin",
                weight: "regular",
            }
        );
        registerFont(
            upath.join(
                Painter.assetsPath,
                "fonts",
                "seurat-db",
                "FOT-Seurat Pro DB.otf"
            ),
            {
                family: "standard-font-username",
                weight: "regular",
            }
        );
    }

    public abstract draw(
        variables: Record<string, any>,
        options: { scale?: number } | Record<string, any>
    ): Promise<Buffer | null>;
    public abstract drawWithScoreSource(
        source: Adapter,
        variables: Record<string, any>,
        options: { scale?: number } | Record<string, any>
    ): Promise<Buffer | null>;
}

export class Theme<T> {
    public constructor(
        private readonly basePath: string,
        public readonly content: T
    ) {}

    public getFile(file: string) {
        const path = upath.join(this.basePath, file);
        if (fs.existsSync(path)) return fs.readFileSync(path);
        else return Buffer.from([]);
    }
}

export class ThemeManager<Schema extends typeof ThemeManager.BaseObject> {
    private logger = Util.buildLogger(["maidraw", "painter", "theme_manager"]);

    public static readonly Element = z.object({
        type: z.string(),
        x: z.number(),
        y: z.number(),
    });

    public static readonly Elements = z.discriminatedUnion("type", [
        ThemeManager.Element,
    ]);

    public static readonly BaseObject = z.object({
        name: z.string(),
    });

    public static readonly BaseTheme = this.BaseObject.extend({
        displayName: z.string(),
        width: z.number().min(1),
        height: z.number().min(1),
        elements: z.array(this.Elements),
    });

    private loadedThemes: Map<string, Theme<z.infer<typeof this.schema>>> =
        new Map();

    public get defaultTheme() {
        return this._defaultTheme;
    }
    private set defaultTheme(value: string) {
        if (this.has(value)) {
            this._defaultTheme = value;
        }
    }
    public constructor(
        private schema: Schema,
        searchPaths: string[] = [],
        private _defaultTheme: string
    ) {
        for (const path of searchPaths) {
            const manifests = globSync(upath.join(path, "**", "manifest.json"));
            for (const manifestPath of manifests) {
                this.load(manifestPath);
            }
        }
    }

    public validate(theme: any): z.infer<typeof this.schema> | null {
        const result = this.schema.safeParse(theme);
        if (result.success) {
            return result.data;
        } else {
            this.logger.error(
                `Cannot validate theme${theme.name ? ` ${theme.name}:` : ":"}`
            );
            this.logger.error(result.error);
            return null;
        }
    }
    public has(themeName: string): boolean {
        return this.loadedThemes.has(themeName);
    }
    public get(themeName: string): Theme<z.infer<typeof this.schema>> | null {
        return (
            this.loadedThemes.get(themeName) ??
            this.loadedThemes.get(this.defaultTheme) ??
            null
        );
    }
    public load(path: string): boolean {
        try {
            const validated = this.validate(require(path));
            if (validated) {
                this.loadedThemes.set(
                    validated.name,
                    new Theme(upath.dirname(path), validated)
                );
                return true;
            } else return false;
        } catch {
            return false;
        }
    }
}

export namespace PainterModule {
    export namespace Image {
        export const schema = ThemeManager.Element.extend({
            type: z.literal("image"),
            width: z.number().min(1),
            height: z.number().min(1),
            path: z.string(),
        });
        export async function draw(
            ctx: CanvasRenderingContext2D,
            theme: Theme<any>,
            element: z.infer<typeof schema>
        ) {
            const img = new CanvasImage();
            img.src = theme.getFile(element.path);
            ctx.drawImage(
                img,
                element.x,
                element.y,
                element.width,
                element.height
            );
        }
    }
    export namespace Text {
        export const schema = ThemeManager.Element.extend({
            type: z.literal("text"),
            size: z.number().min(1),
            content: z.string(),
            width: z.number().min(1).optional(),
            height: z.number().min(1).optional(),
            linebreak: z.boolean().optional(),
            align: z.enum(["left", "center", "right"]).optional(),
            color: Util.z.color().optional(),
            borderColor: Util.z.color().optional(),
            font: z.string().optional(),
        });
        export async function draw(
            ctx: CanvasRenderingContext2D,
            element: z.infer<typeof schema>,
            /**
             * Variables that will be used to format the text content.
             */
            variables: Record<string, string> = {}
        ) {
            let naiveLines = stringFormat(element.content, variables).split(
                "\n"
            );
            let lines: string[] = [];
            if (element.linebreak) {
                for (let originalContent of naiveLines) {
                    while (originalContent.length) {
                        const line = Util.findMaxFitString(
                            ctx,
                            originalContent,
                            element.width || Infinity,
                            ""
                        );
                        originalContent = originalContent
                            .replace(line, "")
                            .trim();
                        lines.push(line.trim());
                    }
                }
            } else {
                for (const originalContent of naiveLines) {
                    lines.push(
                        Util.findMaxFitString(
                            ctx,
                            originalContent,
                            element.width || Infinity
                        )
                    );
                }
            }
            for (let i = 0; i < lines.length; ++i) {
                const line = lines[i];
                Util.drawText(
                    ctx,
                    line,
                    element.x,
                    element.y + i * element.size * 1.3,
                    element.size,
                    element.size / 3.5,
                    element.width || Infinity,
                    element.align,
                    element.color || "#FFFFFF",
                    element.borderColor
                        ? element.borderColor
                        : Color.rgb(element.color || "#FFFFFF")
                              .darken(0.3)
                              .hex(),
                    element.font,
                    element.linebreak ? "" : "..."
                );
            }
        }
    }
}
