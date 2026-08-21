import type { ThemeContext } from "@theme-tools/lib/context";
import type { z } from "zod/v4";

/**
 * One generated manifest.
 *
 * `schema` is the painter's own theme schema, so `build` is checked against it at compile time and
 * validated against it again at generation time.
 */
export interface ThemeSpec<S extends z.ZodType = z.ZodType> {
    /**
     * Directory the manifest is written to, relative to `assets/`.
     */
    readonly outDir: string;
    readonly schema: S;
    build(ctx: ThemeContext): z.input<S>;
}

/**
 * Identity helper that keeps `build` inferred against the painter schema at the definition site.
 */
export function defineTheme<S extends z.ZodType>(spec: ThemeSpec<S>): ThemeSpec<S> {
    return spec;
}
