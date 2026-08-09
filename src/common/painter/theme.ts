import fs from "node:fs";
import { globalLogger } from "@saltcute/logger";
import { globSync } from "glob";
import upath from "upath";
import z from "zod/v4";

export class Theme<T> {
    public constructor(
        private readonly basePath: string,
        public readonly content: T,
    ) {}

    public getFile(file: string) {
        if (typeof file !== "string") return Buffer.from([]);
        const path = upath.join(this.basePath, file);
        if (fs.existsSync(path)) return fs.readFileSync(path);
        else return Buffer.from([]);
    }
}
export class ThemeManager<Schema extends typeof ThemeManager.BASE_OBJECT> {
    private logger = globalLogger.child().withPrefix(`[${["maidraw", "painter", "theme_manager"].join("/")}]`);

    public static readonly HORIZONTAL_ANCHOR = z.enum(["left", "center", "right"]);

    public static readonly VERTICAL_ANCHOR = z.enum(["top", "center", "bottom"]);

    public static readonly HORIZONTAL_REFERENCE = z.object({
        to: z.string().min(1),
        targetAnchor: this.HORIZONTAL_ANCHOR,
        selfAnchor: this.HORIZONTAL_ANCHOR.default("left"),
        offset: z.number().default(0),
    });

    public static readonly VERTICAL_REFERENCE = z.object({
        to: z.string().min(1),
        targetAnchor: this.VERTICAL_ANCHOR,
        selfAnchor: this.VERTICAL_ANCHOR.default("top"),
        offset: z.number().default(0),
    });

    public static readonly LAYOUT_BOUNDS = z.object({
        left: z.number().default(0),
        top: z.number().default(0),
        width: z.number().min(0),
        height: z.number().min(0),
    });

    public static readonly ELEMENT_LAYOUT = z.object({
        x: this.HORIZONTAL_REFERENCE.optional(),
        y: this.VERTICAL_REFERENCE.optional(),
        bounds: this.LAYOUT_BOUNDS.optional(),
    });

    public static readonly ELEMENT = z.object({
        type: z.string(),
        id: z
            .string()
            .min(1)
            .refine((value) => value !== "$canvas", { error: '"$canvas" is reserved for canvas anchor references.' })
            .optional(),
        x: z.number().default(0),
        y: z.number().default(0),
        layout: this.ELEMENT_LAYOUT.optional(),
    });

    public static readonly ELEMENTS = z.discriminatedUnion("type", [ThemeManager.ELEMENT]);

    public static readonly BASE_OBJECT = z.object({
        name: z.string(),
    });

    public static readonly FIT_CONTENT_AXIS = z
        .object({
            mode: z.literal("fit-content"),
            contributors: z.array(z.string().min(1)).min(1),
            min: z.number().min(1).optional(),
            max: z.number().min(1).optional(),
            padding: z.number().min(0).default(0),
        })
        .superRefine((value, ctx) => {
            const duplicate = value.contributors.find((contributor, index) => value.contributors.indexOf(contributor) !== index);
            if (duplicate !== undefined) {
                ctx.addIssue({
                    code: "custom",
                    message: `Contributor IDs must be unique. Found duplicate "${duplicate}".`,
                    path: ["contributors"],
                });
            }
            if (value.min !== undefined && value.max !== undefined && value.min > value.max) {
                ctx.addIssue({
                    code: "custom",
                    message: "The fit-content minimum cannot exceed its maximum.",
                    path: ["min"],
                });
            }
        });

    public static readonly CANVAS_LAYOUT = z.object({
        width: this.FIT_CONTENT_AXIS.optional(),
        height: this.FIT_CONTENT_AXIS.optional(),
    });

    public static readonly THEME_LAYOUT = z.object({
        canvas: this.CANVAS_LAYOUT,
    });

    public static readonly BASE_THEME = this.BASE_OBJECT.extend({
        displayName: z.string(),
        width: z.number().min(1),
        height: z.number().min(1),
        layout: this.THEME_LAYOUT.optional(),
    });

    private loadedThemes: Map<string, Theme<z.infer<typeof this.schema>>> = new Map();

    public get defaultTheme() {
        return this._defaultTheme;
    }
    private set defaultTheme(value: string) {
        if (this.has(value)) {
            this._defaultTheme = value;
        }
    }
    public constructor(
        public readonly schema: Schema,
        searchPaths: string[] = [],
        private _defaultTheme: string,
    ) {
        for (const path of searchPaths) {
            const manifests = globSync(upath.join(path, "**", "manifest.json"));
            for (const manifestPath of manifests) {
                this.load(manifestPath);
            }
        }
    }

    public validate(theme: unknown): z.infer<typeof this.schema> | null {
        const result = this.schema.safeParse(theme);
        if (result.success) {
            return result.data;
        } else {
            this.logger.withError(result.error).error(`Cannot validate theme: ${result.error.message}`);
            return null;
        }
    }
    public has(themeName: string): boolean {
        return this.loadedThemes.has(themeName);
    }
    public get(themeName: string): Theme<z.infer<typeof this.schema>> | null {
        return this.loadedThemes.get(themeName) ?? this.loadedThemes.get(this.defaultTheme) ?? null;
    }
    public load(path: string): boolean {
        try {
            const validated = this.validate(require(path));
            if (validated) {
                this.loadedThemes.set(validated.name, new Theme(upath.dirname(path), validated));
                return true;
            } else return false;
        } catch (e) {
            this.logger.withError(e).error(`Failed to validate the theme at ${path}`);
            return false;
        }
    }
}
