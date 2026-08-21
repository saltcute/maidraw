import type { ThemeContext } from "@theme-tools/lib/context";

/**
 * Directory a sprite table is read from, as a path relative to `assets/`.
 *
 * A plain string puts every sprite in one directory. The object form names a fallback directory and
 * overrides individual keys, which is how a theme borrows most of its artwork from the shared pool
 * while shipping its own version of a few sprites.
 */
export type SpriteDirs<K extends string> = string | ({ default: string } & Partial<Record<K, string>>);

export interface SpriteSetOptions<K extends string> {
    dirs: SpriteDirs<K>;
    /**
     * File name of a sprite without its extension. Defaults to the key itself.
     */
    fileName?: (key: K) => string;
    /**
     * Per key overrides of the file name, for sprites that are not named after their key.
     */
    files?: Partial<Record<K, string>>;
    extension?: string;
}

/**
 * Build a sprite table, resolving every entry against the manifest being generated.
 */
export function spriteSet<K extends string>(ctx: ThemeContext, keys: readonly K[], options: SpriteSetOptions<K>): Record<K, string> {
    const { dirs, fileName, files, extension = ".webp" } = options;
    const table = {} as Record<K, string>;
    for (const key of keys) {
        const dir = typeof dirs === "string" ? dirs : (dirs[key] ?? dirs.default);
        const base = files?.[key] ?? fileName?.(key) ?? key;
        table[key] = ctx.ref(`${dir}/${base}${extension}`);
    }
    return table;
}
