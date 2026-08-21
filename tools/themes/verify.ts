import fs from "node:fs";
import { ThemeContext } from "@theme-tools/lib/context";
import { assetsRoot } from "@theme-tools/lib/paths";
import { themes } from "@theme-tools/lib/registry";
import _ from "lodash";
import upath from "upath";

/**
 * Prove that a generated manifest is interchangeable with the one committed next to it.
 *
 * Both are run through the painter's own schema before being compared, so the comparison is against
 * exactly what a painter receives: unknown keys are stripped and defaults are applied by Zod first.
 * A pass therefore means the rendering cannot have changed, even where the raw JSON differs in key
 * order or carries keys the schema does not define.
 */
let mismatched = 0;
let missing = 0;
let checked = 0;

for (const spec of themes) {
    const manifestPath = upath.join(assetsRoot, spec.outDir, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
        missing += 1;
        console.log(`  NEW      ${spec.outDir} (no committed manifest to compare against)`);
        continue;
    }
    // Round tripping the generated theme through JSON models exactly what ThemeManager does: it
    // requires the manifest off disk and parses that. Optional fields left undefined by a builder
    // disappear on the way out, so this is the only faithful comparison.
    const committed = spec.schema.parse(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
    const generated = spec.schema.parse(JSON.parse(JSON.stringify(spec.build(new ThemeContext(spec.outDir)))));
    checked += 1;
    if (_.isEqual(committed, generated)) continue;
    mismatched += 1;
    console.log(`  CHANGED  ${spec.outDir}`);
    for (const key of Object.keys(generated as object)) {
        const a = (committed as Record<string, unknown>)[key];
        const b = (generated as Record<string, unknown>)[key];
        if (_.isEqual(a, b)) continue;
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
            console.log(`      ${key}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
            continue;
        }
        for (let i = 0; i < a.length; ++i) {
            if (_.isEqual(a[i], b[i])) continue;
            console.log(`      ${key}[${i}] committed: ${JSON.stringify(a[i])}`);
            console.log(`      ${key}[${i}] generated: ${JSON.stringify(b[i])}`);
        }
    }
}

console.log(`\n${checked} theme(s) compared against their committed manifest, ${mismatched} differ, ${missing} not committed yet.`);
process.exit(mismatched > 0 ? 1 : 0);
