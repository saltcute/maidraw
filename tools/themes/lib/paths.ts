import upath from "upath";

/**
 * Root of the repository, resolved from this file at `tools/themes/lib`.
 */
export const repoRoot = upath.normalize(upath.join(__dirname, "..", "..", ".."));

/**
 * Root of the bundled asset tree. Every path authored in this tool is relative to this directory,
 * and is converted to a manifest relative path only when it is written out.
 */
export const assetsRoot = upath.join(repoRoot, "assets");

/**
 * Resolve an assets root relative path to an absolute path on disk.
 */
export function resolveAsset(path: string): string {
    return upath.join(assetsRoot, path);
}
