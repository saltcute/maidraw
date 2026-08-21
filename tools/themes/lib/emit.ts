import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { missingAssetAllowlist } from "@theme-tools/lib/allowlist";
import { ThemeContext } from "@theme-tools/lib/context";
import { assetsRoot, repoRoot, resolveAsset } from "@theme-tools/lib/paths";
import type { ThemeSpec } from "@theme-tools/lib/spec";
import upath from "upath";

export type EmitMode = "write" | "check";

export interface EmitResult {
    readonly path: string;
    readonly changed: boolean;
    readonly generated: string;
    readonly current: string | null;
}

const biomeBin = upath.join(repoRoot, "node_modules", ".bin", "biome");

/**
 * Run the generated JSON through Biome so the output matches what `npm run format` would produce.
 *
 * Biome has to run from the repository root: `biome.json` scopes formatting to `assets/**` among
 * others, and a file outside that scope is silently passed through unformatted.
 */
function format(json: string): string {
    const result = spawnSync(biomeBin, ["format", "--stdin-file-path=manifest.json"], {
        cwd: repoRoot,
        input: json,
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
    });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(`Biome failed to format the manifest: ${result.stderr}`);
    return result.stdout;
}

/**
 * Fail on any reference that does not resolve to a file, unless it is explicitly allowlisted.
 */
function assertAssetsExist(spec: ThemeSpec, ctx: ThemeContext) {
    const missing = ctx.referenced.filter((target) => !fs.existsSync(resolveAsset(target)) && !(target in missingAssetAllowlist));
    if (missing.length > 0) {
        throw new Error(
            [
                `${spec.outDir} references ${missing.length} asset(s) that do not exist under ${upath.relative(repoRoot, assetsRoot)}:`,
                ...missing.map((target) => `  - ${target}`),
                "Add the asset, correct the reference, or document an exception in tools/themes/lib/allowlist.ts.",
            ].join("\n"),
        );
    }
}

export function emitTheme(spec: ThemeSpec, mode: EmitMode): EmitResult {
    const ctx = new ThemeContext(spec.outDir);
    const theme = spec.build(ctx);

    // Validate against the painter's own schema, but keep writing the pre-parse object: Zod applies
    // defaults on parse, and those would show up as spurious keys in the manifest.
    const validation = spec.schema.safeParse(theme);
    if (!validation.success) {
        throw new Error(`${spec.outDir} does not satisfy its painter schema:\n${validation.error.message}`);
    }
    assertAssetsExist(spec, ctx);

    const manifestPath = upath.join(assetsRoot, spec.outDir, "manifest.json");
    const generated = format(`${JSON.stringify(theme, null, 4)}\n`);
    const current = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, "utf8") : null;
    const changed = current !== generated;

    if (changed && mode === "write") {
        fs.mkdirSync(upath.dirname(manifestPath), { recursive: true });
        fs.writeFileSync(manifestPath, generated);
    }
    return { path: upath.relative(repoRoot, manifestPath), changed, generated, current };
}
