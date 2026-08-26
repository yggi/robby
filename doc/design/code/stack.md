# The stack, and the build

- **Svelte 5** (runes: `$state`, `$derived`, `$effect`) + **TypeScript**
- **Vite 6** with `vite-plugin-singlefile`
- **Vitest** for engine tests (`src/**/*.test.ts`, node environment), **jsdom**
  for behavioural smoke tests
- Build output: **one `dist/index.html`**, ~250 KB, no external requests

## Two build decisions worth keeping

**The bundle is an IIFE, not an ES module.** `rollupOptions.output.format` is
`iife` with `inlineDynamicImports`. The reason was testing: the smoke suite
drives **the real built artefact** in jsdom, which does not execute module
scripts. The side benefit turned out to be the more important one — the file
runs from `file://` with no server, which is how it gets onto a phone.

**The font travels with the file.** Baloo 2, latin woff2 subsets only, inlined
as base64. Fontsource also ships legacy `.woff`, which would roughly double the
font payload for browsers that no longer exist; a smoke check asserts exactly
two font faces and no legacy duplicate.

Everything else is inlined by the same logic: `assetsInlineLimit` is 100 MB,
`cssCodeSplit` is off, `modulePreload.polyfill` is off. There is nothing left to
fetch.

## The check that keeps it honest

**The build is verified to contain zero non-`data:` URLs.** That is the
enforcement behind the second rule in `CLAUDE.md` — no secrets, no accounts, no
network calls, no analytics, no external assets. It is a children's game that
runs from a phone with no signal.

Anything that would add a URL — a CDN font, an analytics snippet, a sound
sample, a sprite sheet, an error reporter — fails that check, by design. If a
feature needs one, the feature is wrong for this project.

## Publishing

`.github/workflows/pages.yml` builds every push to `main` and to `claude/**`:

- `main` → the site root
- every other branch → `/b/<slug>/`, indexed at `/b/`
- a branch's directory is removed when the branch is

It publishes to a `gh-pages` branch rather than through `actions/deploy-pages`,
because that action replaces the whole site with one artifact — so any branch
push would silently overwrite what `main` published. Pages source must therefore
be **Deploy from a branch: gh-pages / (root)**.

**There is no `BASE_PATH`, unlike the same workflow in `laborsim`.** The built
`index.html` contains no `src` or `href` to anywhere at all, so the artefact is
genuinely path-independent: it works at the site root, at `/b/<slug>/`, and from
`file://` on a phone with no network. There is nothing to tell it where it
lives, which is the whole point of it.

**A push publishes.** Branch freely, but know that a push puts a playable build
in front of anybody with the link. CI runs `npm run check:full`, so a branch
that does not pass both suites is not published.

## Scripts

| Command | What | Takes |
|---|---|---|
| `npm run test:unit` | Vitest only | ~5s |
| `npm test` | unit → build → fast smoke suite | ~15s |
| `npm run test:full` | build → the behavioural smoke suite | ~2min |
| `npm run check:full` | everything, both suites | ~2.5min |
| `npm run dev` | Vite dev server | |
| `npm run build` | single-file production build | ~3s |
| `npm run test:dev-warnings` | a development-mode build through the fast suite | |

`npm test` is the one to run constantly. See
[`../testing/layers.md`](../testing/layers.md) for the rule that decides which
suite a check belongs in.

## Where to go instead

- What is inside the bundle: [`architecture.md`](architecture.md).
- What the smoke suites actually drive:
  [`../testing/harness.md`](../testing/harness.md).
