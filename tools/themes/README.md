# Theme manifest generator

Every `assets/themes/**/manifest.json` in this repository is generated from the TypeScript in this
directory. The manifests stay committed, because `assets/` ships to npm and `ThemeManager` globs the
manifests off disk at runtime, so a fresh clone has to have them.

```sh
npm run themes          # regenerate every manifest in place
npm run themes:check    # fail if a committed manifest is out of date, without writing
npm run themes:verify   # fail if a generated manifest is not equivalent to the committed one
```

## Why

The manifests are heavily repetitive: sibling themes differ only in artwork, one accent colour and a
handful of coordinates, so a schema change used to mean hand editing a dozen files. Generating them
means a layout change is one function edit and a new theme is one row of data.

It also closes a silent failure mode. `Theme.getFile` returns an empty buffer for a missing file
rather than throwing, so a mistyped sprite path renders as a blank image with no error anywhere.
Generation resolves and stats every path, and fails on anything that does not exist.

## How a path works

Nothing in this directory writes `../`. A builder names an asset by its path relative to `assets/`
and `ctx.ref` converts it to a path relative to the manifest being written, which is what
`Theme.getFile` resolves against:

```ts
ctx.ref("themes/maimai/best50/versionless/milestone/ap.webp");
// from themes/maimai/best50/prism/portrait -> "../../versionless/milestone/ap.webp"
// from themes/maimai/chart/prism           -> "../../best50/versionless/milestone/ap.webp"
```

Moving a manifest therefore rewrites every path inside it for free.

## Layout

| Path | What it holds |
| --- | --- |
| `lib/` | Mechanics: path resolution, sprite tables, schema validation, emitting, the missing asset allowlist |
| `common/` | Element factories for the shared `image`, `text` and `hitokoto` modules, plus the difficulty palettes |
| `<game>/sprites.ts` | Sprite tables for that game, and where its shared sprite pool lives |
| `<game>/<painter>.ts` | The layout: a function per variant, built from small section helpers |
| `<game>/themes.ts` | The data: one row per theme, naming its artwork, colours and sprite directories |

## Adding a theme

1. Put the artwork under `assets/themes/<game>/<painter>/<version>/assets/`.
2. Add a row to the game's `themes.ts`, naming that artwork.
3. `npm run themes`, then render it: `npm test -- painter/<game>/<painter>`.

If a theme reuses another version's artwork, point at that version's directory instead of copying
files. If it only replaces some sprites of a table, use the object form of `dirs`:

```ts
milestones: { default: `${maimaiBest50Versionless}/milestone`, ap: `${art("finale")}/milestone` }
```

## Adding or changing a module schema

Change the module's `SCHEMA` in `src/`, then update the builder here that emits it. The builders are
typed as `z.input` of the painter's own theme schema, so a missing or misspelled field is a compile
error rather than a theme that fails to load at runtime. `npm run themes` validates every generated
theme against that schema again before writing.

## Missing assets

`lib/allowlist.ts` lists the assets a manifest may reference even though they do not exist, each with
a reason. Add to it only when the artwork genuinely does not exist and the blank sprite is the
intended result; otherwise fix the path or add the file.
