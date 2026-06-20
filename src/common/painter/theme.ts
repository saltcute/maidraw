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

    public static readonly ELEMENT = z.object({
        type: z.string(),
        x: z.number(),
        y: z.number(),
    });

    public static readonly ELEMENTS = z.discriminatedUnion("type", [ThemeManager.ELEMENT]);

    public static readonly BASE_OBJECT = z.object({
        name: z.string(),
    });

    public static readonly BASE_THEME = this.BASE_OBJECT.extend({
        displayName: z.string(),
        width: z.number().min(1),
        height: z.number().min(1),
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
