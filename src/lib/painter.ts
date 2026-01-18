import * as fs from "fs";
import upath from "upath";
import Color from "color";
import { z } from "zod/v4";
import { globSync } from "glob";
import stringFormat from "string-template";
import { CanvasRenderingContext2D, registerFont } from "canvas";

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
            }
        );
        registerFont(
            upath.join(Painter.assetsPath, "fonts", "jost", "Jost-Regular.ttf"),
            {
                family: "ongeki-font-level",
            }
        );
        registerFont(
            upath.join(
                Painter.assetsPath,
                "fonts",
                "sega-sans-db",
                "SegaKakuGothic-DB.ttf"
            ),
            {
                family: "chunithm-font-username",
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
        if (typeof file !== "string") return Buffer.from([]);
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

import LineBreaker from "linebreak";

export namespace PainterModule {
    export namespace Image {
        export const schema = ThemeManager.Element.extend({
            type: z.literal("image"),
            width: z.number().min(1).optional(),
            height: z.number().min(1).optional(),
            anchor: z
                .literal([
                    "lt",
                    "ct",
                    "rt",
                    "lc",
                    "cc",
                    "rc",
                    "lb",
                    "cb",
                    "rb",
                    // Center vs Middle
                    "mt",
                    "mc",
                    "mb",
                    "lm",
                    "cm",
                    "rm",
                    "mm",
                ])
                .optional(),
            path: z.string(),
        });
        export async function draw(
            ctx: CanvasRenderingContext2D,
            theme: Theme<any>,
            element: z.infer<typeof schema>
        ) {
            const img = await Util.loadImage(theme.getFile(element.path));
            const { width: imgWidth, height: imgHeight } = img;
            const aspectRatio = imgWidth / imgHeight;
            let width, height;
            if (element.width && element.height) {
                width = element.width;
                height = element.height;
            } else if (element.width) {
                width = element.width;
                height = width / aspectRatio;
            } else if (element.height) {
                height = element.height;
                width = height * aspectRatio;
            } else {
                width = imgWidth;
                height = imgHeight;
            }
            ctx.save();
            switch (element.anchor) {
                case "lt":
                default:
                    break;
                case "ct":
                case "mt":
                    ctx.translate(-width / 2, 0);
                    break;
                case "rt":
                    ctx.translate(-width, 0);
                    break;
                case "lc":
                case "lm":
                    ctx.translate(0, -height / 2);
                    break;
                case "cc":
                case "mc":
                case "cm":
                case "mm":
                    ctx.translate(-width / 2, -height / 2);
                    break;
                case "rm":
                    ctx.translate(-width, -height / 2);
                    break;
                case "lb":
                    ctx.translate(0, -height);
                    break;
                case "mb":
                case "cb":
                    ctx.translate(-width / 2, -height);
                    break;
                case "rb":
                    ctx.translate(-width, -height);
                    break;
            }
            ctx.drawImage(img, element.x, element.y, width, height);
            ctx.restore();
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
        const builtinVariables: Record<string, string> = {
            date: (() => {
                const date = new Date();
                return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
            })(),
        };
        export async function draw(
            ctx: CanvasRenderingContext2D,
            element: z.infer<typeof schema>,
            /**
             * Variables that will be used to format the text content.
             */
            variables: Record<string, string> = {}
        ) {
            variables = {
                ...builtinVariables,
                ...variables,
            };
            ctx.font = `${element.size}px ${element.font || `"standard-font-title-latin", "standard-font-title-jp"`}`;
            const filledContent = stringFormat(element.content, variables);

            const lines: string[] = [];
            if (element.linebreak && element.width) {
                const breaker = new LineBreaker(filledContent);
                let lastPossibleBreak = 0,
                    lastBreak = 0;
                for (
                    let bk = breaker.nextBreak();
                    bk;
                    lastPossibleBreak = bk.position, bk = breaker.nextBreak()
                ) {
                    const cur = filledContent.substring(lastBreak, bk.position);
                    if (ctx.measureText(cur).width > element.width) {
                        lines.push(
                            filledContent
                                .substring(lastBreak, lastPossibleBreak)
                                .trim()
                        );
                        lastBreak = lastPossibleBreak;
                    }
                }
                lines.push(filledContent.substring(lastBreak).trim());
            } else {
                const naiveLines = filledContent.split("\n");
                for (const originalContent of naiveLines) {
                    lines.push(
                        Util.findMaxFitString(
                            ctx,
                            originalContent,
                            element.width || Infinity
                        ).trim()
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
                    {
                        maxWidth: element.width || Infinity,
                        textAlign: element.align,
                        mainColor: element.color || "#FFFFFF",
                        borderColor: element.borderColor
                            ? element.borderColor
                            : Color.rgb(element.color || "#FFFFFF")
                                  .darken(0.3)
                                  .hex(),
                        font: element.font,
                        lineBreakSuffix: element.linebreak ? "" : "...",
                    }
                );
            }
        }
    }
    export namespace Hitokoto {
        export const schema = ThemeManager.Element.extend({
            type: z.literal("hitokoto"),
            size: z.number().min(1),
            width: z.number().min(1).optional(),
            height: z.number().min(1).optional(),
            linebreak: z.boolean().optional(),
            align: z.enum(["left", "center", "right"]).optional(),
            color: Util.z.color().optional(),
            borderColor: Util.z.color().optional(),
            probability: z.number().min(0).max(1).optional(),
            customLines: z.union([z.string(), z.array(z.string())]).optional(),
        });
        export async function draw(
            ctx: CanvasRenderingContext2D,
            theme: Theme<any>,
            element: z.infer<typeof schema>,
            probability?: number,
            customLines?: Record<string, string>,
            blocklist?: string[]
        ) {
            probability = probability ?? element.probability ?? 1.0;
            function getRandomMemberFromArray(
                array: any[],
                probability: number
            ) {
                const r = Math.random();
                if (probability <= 0 || r > probability) return;
                return array[Math.floor((r / probability) * array.length)];
            }
            let localLines = {};
            if (element.customLines != undefined) {
                for (const path of Array.isArray(element.customLines)
                    ? element.customLines
                    : [element.customLines]) {
                    try {
                        localLines = {
                            ...localLines,
                            ...JSON.parse(theme.getFile(path).toString()),
                        };
                    } catch {}
                }
            }
            const lines: Record<string, string> = {
                ...localLines,
                ...customLines,
            };
            const keyList = Object.keys(lines).filter(
                (v) => !blocklist?.includes(v)
            );
            const content =
                lines[getRandomMemberFromArray(keyList, probability)];
            if (content) {
                Text.draw(ctx, {
                    ...element,
                    type: "text",
                    content,
                });
            }
        }
    }
}
