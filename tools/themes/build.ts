import { emitTheme } from "@theme-tools/lib/emit";
import { themes } from "@theme-tools/lib/registry";

const check = process.argv.includes("--check");
const showDiff = process.argv.includes("--diff");

/**
 * Line oriented diff, enough to see what a layout change did without pulling in a dependency.
 */
function diff(current: string, generated: string): string {
    const before = current.split("\n");
    const after = generated.split("\n");
    const lines: string[] = [];
    for (let i = 0; i < Math.max(before.length, after.length); ++i) {
        if (before[i] === after[i]) continue;
        if (before[i] !== undefined) lines.push(`      - ${before[i].trim()}`);
        if (after[i] !== undefined) lines.push(`      + ${after[i].trim()}`);
    }
    return lines.length > 40 ? `${lines.slice(0, 40).join("\n")}\n      ... ${lines.length - 40} more line(s)` : lines.join("\n");
}

const changed: string[] = [];
let failed = 0;

for (const spec of themes) {
    try {
        const result = emitTheme(spec, check ? "check" : "write");
        if (!result.changed) continue;
        changed.push(result.path);
        if (showDiff) console.log(`\n  ~ ${result.path}\n${diff(result.current ?? "", result.generated)}`);
    } catch (e) {
        failed += 1;
        console.error(`\n${e instanceof Error ? e.message : e}`);
    }
}

console.log(`\n${themes.length} theme(s), ${changed.length} ${check ? "out of date" : "written"}, ${failed} failed.`);
if (!showDiff) for (const path of changed) console.log(`  ${check ? "~" : "+"} ${path}`);

if (failed > 0) process.exit(1);
if (check && changed.length > 0) {
    console.error("\nGenerated manifests are out of date. Run `npm run themes`.");
    process.exit(1);
}
