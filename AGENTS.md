# Repository Guidelines

## Scope and project overview

This file applies to the entire repository.

`maidraw` is a Node.js/TypeScript library that renders score cards and chart images for maimai DX, CHUNITHM, and ONGEKI. It publishes four entry points: the common package plus one package for each game. Rendering is based on `node-canvas`, themes are JSON manifests validated with Zod, and most image/font resources live under `assets/`.

## Repository layout

- `src/common/`: shared errors, adapter base types, painter infrastructure, reusable painter modules, text/image helpers, and other utilities.
- `src/{maimai,chunithm,ongeki}/`: game-specific public types and adapters (`lib/`), painter classes, and painter modules.
- `src/exports/`: package entry points. Keep the `@common/utils/injectThrowIf` side-effect import at the top of public entry points.
- `assets/themes/<game>/<painter>/`: theme manifests and their WebP resources. Paths inside a manifest are relative to that manifest's directory.
- `assets/fonts/` and `assets/hitokoto/`: bundled fonts and text data used at render time.
- `tools/themes/`: the generator that produces every theme manifest. See `tools/themes/README.md`.
- `test/modules/`: focused rendering harnesses for individual painter modules.
- `test/painter/`: end-to-end rendering harnesses for complete painters.
- `test/utils/`: dummy game data and shared rendering helpers.
- `dist/`: generated JavaScript, declarations, and source maps. Never edit or commit it. Files inside `dist/` can be considered garbage. Never reference, use, or take inspiration of anything from `dist/`.

## Toolchain and setup

- Use npm and keep `package-lock.json` in sync with dependency changes.
- The publish workflow uses Node.js 24 and `npm ci`; use Node 24 when reproducing release behavior.
- Install exactly from the lockfile with `npm ci`.
- Native dependencies include `canvas` and `sharp`, so installation may require their platform prerequisites.
- TypeScript is strict, targets ES2025, and uses NodeNext modules with Node 16 module resolution.
- Source aliases are `@common/*`, `@maimai/*`, `@chunithm/*`, and `@ongeki/*`. Prefer these aliases for cross-directory imports under `src/`; `tsc-alias` rewrites them in the build output.

## Common commands

Run commands from the repository root.

- `npm run build`: compile `src/` with `tsc`, then rewrite aliases with `tsc-alias`.
- `npm run clean`: remove generated files under `dist/`.
- `npm run format`: format all paths included by `biome.json` in place.
- `npm run lint`: lint all included paths and apply safe fixes in place.
- `npm run themes`: regenerate every `assets/themes/**/manifest.json` from `tools/themes/`.
- `npm run themes:check`: fail if a committed manifest is out of date, without writing anything.
- `npm run themes:verify`: fail if a generated manifest is not equivalent to the committed one once both are parsed through the painter schema.
- `npm run make`: clean, regenerate themes, format, lint, and build. This is broad and mutates files, so do not use it when unrelated worktree changes are present.
- `npx biome check <changed paths...>`: run non-writing format/lint diagnostics on a focused set of files.
- `npx biome format --write <changed paths...>` and `npx biome lint --write <changed paths...>`: apply formatting or lint fixes only to files in the current change.

The repository scripts intentionally use Biome's `--write` mode. Before running a broad format/lint command, inspect the worktree and avoid modifying unrelated user changes.

## Code style

- Let Biome define the final style: 4-space indentation, double quotes, organized imports, and a 150-character line width.
- Use semicolons and trailing commas as produced by Biome.
- Use `camelCase` for functions, methods, local variables, and TypeScript filenames; use `PascalCase` for classes, interfaces, types, and enums.
- Enum members must be `CONSTANT_CASE`; this is enforced by `biome.json`.
- Preserve strict typing. Prefer `unknown`, Zod validation, discriminated unions, and type narrowing over `any` or unchecked casts.
- Use `import type` (or inline `type` imports) for type-only dependencies. Use `node:` specifiers for Node built-ins and `upath` where paths need to work across platforms.
- Keep shared behavior in `src/common/`; put game-specific score rules, types, and rendering behavior in the corresponding game directory.
- Follow the existing `DataOrError<T>` result shape for recoverable library errors. Add structured `BaseError` subclasses in `src/common/error.ts` when a new public error category is needed.
- Do not hand-edit generated output in `dist/`.

## Painter and theme conventions

- A complete painter extends the game-specific painter base and defines a static Zod theme schema, a default theme name, and the modules it supports.
- A painter module extends `PainterModule`, exposes a static `SCHEMA` with a literal `type`, and implements asynchronous `draw(...)`. When adding a module, register it in the relevant painter's `LOADED_SCHEMAS` tuple and module map.
- Theme manifests are generated. Never hand-edit `assets/themes/**/manifest.json`: change the builder in `tools/themes/` and run `npm run themes`. A hand edit is silently reverted by the next generation, and `npm run themes:check` reports it as drift.
- Theme manifests are runtime API. If a module schema changes, update the matching builder under `tools/themes/`, regenerate, and update the relevant render harnesses in the same change. The builders are typed against the painter theme schemas, so a schema change surfaces as a compile error in `tools/`.
- Keep theme names and sprite paths accurate and case-sensitive. Paths inside `tools/themes/` are written relative to `assets/` and converted to manifest-relative paths on the way out, so never write `../` by hand. A missing asset becomes an empty buffer in `Theme.getFile`, so generation stats every referenced path and fails on anything that does not exist; genuine exceptions belong in `tools/themes/lib/allowlist.ts` with a reason.
- Fonts are registered from `assets/fonts` by `Painter.registerFonts`; preserve the existing font-family names when changing text rendering.
- Reuse common modules (`image`, `text`, and `hitokoto`) where possible instead of creating game-specific copies.
- Avoid recompressing, renaming, or replacing unrelated binary assets. New visual resources should normally be WebP and should be referenced by a manifest or source code in the same change.

## Public API changes

- Game APIs are re-exported from `src/<game>/index.ts` and exposed through `src/exports/<game>.ts`.
- Shared APIs are exposed through `src/exports/common.ts`.
- If a new public symbol is intended for consumers, update the appropriate index/export file; compiling an unexported source file does not make it part of the package API.
- The package exposes only `.`, `./maimai`, `./chunithm`, and `./ongeki`. Adding another entry point also requires a `package.json` `exports` update.
- Treat adapter interfaces, score types, painter method signatures, theme schemas, and theme names as compatibility-sensitive.

## Testing

The current tests are render harnesses, not an assertion-based test suite. `test/test.ts` loads one requested TypeScript module, and the wrappers write `test/result.webp` for manual inspection. The generated image is gitignored and overwritten by the next test.

Run a focused harness by passing its path relative to `test/`, without the `.ts` suffix, for example:

```sh
npm test -- modules/common/text
npm test -- modules/maimai/scoreGrid
npm test -- painter/chunithm/chart
```

Important testing limitations:

- Do not run bare `npm test` as a full-suite check; no test path means there is no useful test to load.
- The script invokes `tsx`. If the command is unavailable in the current installation, report the environment/setup issue rather than silently changing dependencies as part of an unrelated task.
- Many database-backed tests expect a sibling checkout at `../maimai-songs-database` (the shared `localDatabasePath`). Tests that do not touch the database can run without it. If permissions allow, check if it exist, otherwise assume that the database exists and clearly state the assumption.
- The harness catches load failures and the wrappers exit with status 0, so an exit code alone is not proof of success. Read the console output, confirm that no error was logged, open `test/result.webp`, and inspect layout, clipping, fonts, colors, transparency, and missing sprites.
- Dummy score helpers use random values. Compare structural rendering rather than expecting byte-for-byte deterministic output.
- Add or update a focused module harness when changing a module. Run a full-painter harness as well when changing composition, theme schemas/manifests, shared rendering code, or public painter behavior.

## Validation before handoff

Use the narrowest checks that cover the change:

1. Run targeted Biome diagnostics/fixes on changed TypeScript or JSON files.
2. Run `npm run themes` after any change under `tools/themes/`, and `npm run themes:check` to confirm nothing else drifted.
3. Run `npm run build` for every source or public API change.
4. Run the most relevant render harness and visually inspect `test/result.webp` for painter, module, manifest, font, or asset changes.
5. Check `git diff` and `git status`; leave out `dist/`, `test/result.webp`, and unrelated formatting changes.

For documentation-only changes, a content/diff review is sufficient. The GitHub publish workflow runs only `npm ci`, `npm run build`, and `npm publish` for `v*` tags; it does not run the render harnesses. Do not bump versions, create tags, or publish unless explicitly requested.

## Commits and change scope

- Keep changes focused and preserve unrelated worktree edits.
- Recent commits use short Conventional Commit-style subjects such as `feat:`, `fix:`, and `chore:`; follow that style when asked to commit.
- Commit source, theme generator changes, the manifests they produce, tests, assets, and lockfile updates together when they form one logical change, but do not commit generated render output or `dist/`.
