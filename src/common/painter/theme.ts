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

    /**
     * Reserved anchor id referring to the canvas itself.
     */
    public static readonly CANVAS_ANCHOR_ID = "$canvas";

    public static readonly ANCHOR_LOCATION = z.literal(["top_left", "top_right", "bottom_left", "bottom_right"]);

    public static readonly ANCHOR = z.object({
        id: z.string().default(ThemeManager.CANVAS_ANCHOR_ID),
        location: ThemeManager.ANCHOR_LOCATION.default("top_left"),
    });

    public static readonly ELEMENT = z.object({
        type: z.string(),
        x: z.number(),
        y: z.number(),
        /**
         * Unique name of the element, allowing other elements to anchor to it and the theme to grow with it.
         */
        id: z.string().optional(),
        /**
         * Element the position of this element is relative to. Defaults to the top left corner of the canvas.
         */
        anchor: ThemeManager.ANCHOR.optional(),
    });

    public static readonly ELEMENTS = z.discriminatedUnion("type", [ThemeManager.ELEMENT]);

    /**
     * Loose shapes used to inspect the layout of an already validated theme.
     */
    private static readonly LAYOUT_ELEMENT = z.object({
        id: z.string().optional(),
        anchor: ThemeManager.ANCHOR.optional(),
    });
    private static readonly LAYOUT_CONTENT = z.object({
        name: z.string().default("<unnamed>"),
        layout: z
            .object({
                contributors: z.array(z.string()).default([]),
            })
            .optional(),
        elements: z.array(z.unknown()).default([]),
    });

    public static readonly BASE_OBJECT = z.object({
        name: z.string(),
    });

    public static readonly BASE_THEME = this.BASE_OBJECT.extend({
        displayName: z.string(),
        /**
         * Minimum width of the theme. The canvas grows beyond it with the layout contributors.
         */
        width: z.number().min(1),
        /**
         * Minimum height of the theme. The canvas grows beyond it with the layout contributors.
         */
        height: z.number().min(1),
        layout: z
            .object({
                /**
                 * Ids of the elements whose extra dimensions are added to the dimensions of the theme.
                 */
                contributors: z.array(z.string()).default([]),
            })
            .optional(),
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
            this.checkLayoutReferences(result.data);
            return result.data;
        } else {
            this.logger.withError(result.error).error(`Cannot validate theme: ${result.error.message}`);
            return null;
        }
    }
    /**
     * Report broken layout references. A broken reference does not stop a theme from loading,
     * the element falls back to being anchored to the top left corner of the canvas instead.
     */
    private checkLayoutReferences(theme: unknown) {
        const result = ThemeManager.LAYOUT_CONTENT.safeParse(theme);
        if (!result.success) return;
        const { name, layout, elements } = result.data;

        const anchorTargets = new Map<string, string | undefined>();
        for (const element of elements) {
            const parsed = ThemeManager.LAYOUT_ELEMENT.safeParse(element);
            if (!parsed.success) continue;
            const { id, anchor } = parsed.data;
            if (id === undefined) continue;
            if (id === ThemeManager.CANVAS_ANCHOR_ID) {
                this.logger.error(`Theme ${name} uses the reserved id ${ThemeManager.CANVAS_ANCHOR_ID} on an element. The id is ignored.`);
                continue;
            }
            if (anchorTargets.has(id)) {
                this.logger.error(`Theme ${name} has more than one element with the id ${id}. Only the first one is used.`);
                continue;
            }
            anchorTargets.set(id, anchor?.id);
            if (anchor?.id === id) {
                this.logger.error(`Theme ${name} has an element with the id ${id} anchored to itself.`);
            }
        }
        for (const element of elements) {
            const parsed = ThemeManager.LAYOUT_ELEMENT.safeParse(element);
            if (!parsed.success) continue;
            const target = parsed.data.anchor?.id;
            if (target === undefined || target === ThemeManager.CANVAS_ANCHOR_ID) continue;
            if (!anchorTargets.has(target)) {
                this.logger.error(`Theme ${name} has an element anchored to the unknown id ${target}.`);
            }
        }
        for (const contributor of layout?.contributors ?? []) {
            if (!anchorTargets.has(contributor)) {
                this.logger.error(`Theme ${name} declares the unknown id ${contributor} as a layout contributor.`);
            }
        }
        for (const id of anchorTargets.keys()) {
            const visited = new Set<string>();
            for (let current = id; ; ) {
                if (visited.has(current)) {
                    this.logger.error(`Theme ${name} has an anchor cycle involving the id ${current}.`);
                    break;
                }
                visited.add(current);
                const next = anchorTargets.get(current);
                if (next === undefined || next === ThemeManager.CANVAS_ANCHOR_ID) break;
                current = next;
            }
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
