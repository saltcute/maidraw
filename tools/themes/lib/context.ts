import upath from "upath";

/**
 * Per theme state handed to every layout builder.
 *
 * Builders never write `../` by hand. They name an asset by its path relative to `assets/` and the
 * context turns it into a path relative to the manifest being generated, which is what
 * {@link Theme.getFile} resolves against. Moving a manifest therefore rewrites every path in it for free.
 */
export class ThemeContext {
    private readonly refs = new Set<string>();

    /**
     * @param outDir Directory the manifest is written to, relative to `assets/`.
     */
    public constructor(public readonly outDir: string) {}

    /**
     * Reference an asset by its path relative to `assets/`, and return the path relative to this manifest.
     */
    public ref(target: string): string {
        const normalized = upath.normalize(target);
        this.refs.add(normalized);
        return upath.relative(this.outDir, normalized);
    }

    /**
     * Reference every value of a sprite table at once, keeping the keys untouched.
     */
    public refAll<T extends Record<string, string>>(targets: T): { [K in keyof T]: string } {
        return Object.fromEntries(Object.entries(targets).map(([key, value]) => [key, this.ref(value)])) as { [K in keyof T]: string };
    }

    /**
     * Every asset referenced so far, relative to `assets/`.
     */
    public get referenced(): readonly string[] {
        return [...this.refs];
    }
}
