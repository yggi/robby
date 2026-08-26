# Conventions — each one carrying the bug that bought it

Nothing here is here because it seemed tidy. Do not add a rule to this page in
advance of an incident; a rule without a receipt is advice, and it will be
relaxed by whoever finds it inconvenient.

## Name collisions were the recurring failure mode

Seven of them, and then the category was ended rather than policed further:

| Collision | Symptom |
|---|---|
| `.exit` | matched the floor tile under the rocket, not the rocket |
| `.screen.play` | matched the play *button*; control tests silently tested a div |
| `@keyframes roll` | treads ran the practice-tile dice animation, 20×/second |
| `.tray` | the store's parts bin gave the arrow tray `overflow-x: auto` |
| `.cog` | turned the cog *part* into a 22px spinning disc |
| `.grid` | the editor and the level select both used it |
| `.star` | a third of the confetti twinkled in place instead of falling |

The mechanism was that **names the engine owns became element classes verbatim**.
`<div class="item cog">` meant a bare `.cog {}` anywhere in eight stylesheets
landed on the board, whether you meant it or not.

### The fix: `src/view/css.ts`

A cell kind, an item kind or a minimap mark reaches the DOM **only** through
`kindCls` or `markCls`, and arrives namespaced — `k-belt`, `m-w`. Every particle
class is written in `particles.ts` and namespaced `fx-`. A hand-written
`.belt {}` can no longer land on anything, and the wrong thing is now impossible
to write rather than merely detectable. → `doc/META.md`, "End a category".

Write a new board or minimap class through those functions. If you find yourself
interpolating a kind into a class string by hand, that is the hazard coming back.

### Five guards remain, as a net

In `smoke.fast.mjs` and `test/harness.mjs`, each proven by planting its fault:

| Guard | The bug it exists for |
|---|---|
| no two `@keyframes` share a name | treads running the dice animation |
| no board kind is styled bare | `.cog` on the shop part |
| no selector is defined twice | the cheese moon's stale palette |
| no element wears a bare engine name | the prefix silently stopping being used |
| no rule names a class nothing writes, and nothing is written with no rule | `.spark`, which had never existed |
| no element is claimed by two animations | `.confetti` losing to `.star` |

Their lists are **read out of the files that own them** (`namesIn()` in the
harness) rather than transcribed. The one transcribed list was missing `oneway`
for the mechanic's whole life, which made a bare `.oneway {}` the single board
kind nothing could catch — a guard against transcription errors, containing one.

### Three more were inside the engine, where no guard looks

Found while contracting the level machinery, and now ended:

| Collision | The two meanings |
|---|---|
| `at()` | `parse.ts` `(world, p) → Cell` vs `editor.ts` `(draft, x, y) → string` |
| `toMap()` | `generate.ts` synthesised and cropped a grid; `editor.ts` joined rows |
| `Cell` | `types.ts` a tile; `generate.ts` a `{x, y}` — which is a `Vec2` |

Nothing caught these, because the guards read the built CSS: they defend the
board's namespace and know nothing about TypeScript's. They are now `cellAt`,
`draftMap` / `renderMap`, and `Vec2`. **The lesson generalises past CSS** — a
short, generic name in a small module is a collision waiting for the second
module, and `src/engine/` is seven files that all import each other.

## Everything on the board is sized from one variable

```css
.tile, .over, .item, .bot, .launchpad, .propcell, .fx {
  position: absolute;
  width: var(--c); height: var(--c);
  translate: calc(var(--x) * var(--c)) calc(var(--y) * var(--c));
}
```

Add a new board element and you **must** add it to that list. Miss it and it
becomes an unpositioned block sized against the whole board — that is how the
rocket once rendered five times too large. A smoke check scrapes every element
carrying `--x` and asserts a rule sizes it
([`../testing/guards.md`](../testing/guards.md)).

`--c` is rounded down to whole pixels with `round()`. A fractional tile size
puts sprites on fractional pixels while the floors layer — which sits under a
`filter` and rasterises separately — snaps to the grid, and **the mismatch
drifts as the robot moves**, which is far harder to recognise than a static
offset.

The editor supplies its own `--c`, which is why it renders with the board's real
tiles rather than a set of its own.

## Percentages need a definite containing block

The rocket sat wrong through two rounds of nudging numbers because `height: 82%`
was resolving against an auto-sized *grid row*. The CSS was applying exactly as
written; the numbers just did not mean anything.

**If a percentage seems to be ignored, find what it resolves against before
changing it.** That is one lookup and it ends the hunt.

## The stylesheet order is load-bearing

`src/styles/index.css` imports **eight** files in a fixed order:

```
base → world → console → themes → screens → workshop → editor → intro
```

Several rules depend on being *later* than an earlier one of equal specificity —
the thought bubble's `.want svg` has to beat `.bot svg`, because the bubble
lives inside the robot. **Do not sort the imports.** The comment at the top of
the file says so too; believe it.

## Themes are keyed on the attribute alone

`[data-theme="lab"]`, never `.scene[data-theme="lab"]`. They were once keyed to
two specific elements, and the editor — a third — silently got no colours at
all.

`THEMES` in `types.ts` is a `const` array and the `Theme` union is derived from
it, so a world cannot be half-added: `DECOR` is keyed by `Theme` and will not
compile without a backdrop, and a smoke check asserts a palette exists for every
entry. There are nine themes; five of them dress Test World rooms only, and each
still costs a palette and a backdrop.

## Persistence is guarded, and asymmetric

Five `localStorage` keys — `robot.bits`, `robot.solved`, `robot.owned`,
`robot.kit`, `robot.rooms` — **all wrapped in try/catch**, because jsdom refuses
storage on an opaque origin and the game must run memory-only in tests.

Rooms a child built store **the map string and nothing else.** Par and tray are
solved for again on load, so a saved room can never carry a stale par; if it
stops solving it drops out of the list rather than being played wrong. That is
also what makes a room shareable as a URL (`doc/BOARD.md` [R-006]).

`wipeProgress()` deliberately does not delete built rooms. Progress is the
game's; the rooms are theirs.

## Editing

**Do not edit by string splice.** Three separate times a replacement landed
beside the block it was meant to replace rather than over it, and — being later
in the cascade — the stale one won, so the "fix" never rendered. The cheese moon
shipped a stale palette that way, and the duplicate-selector check exists
because of it.

## Where to go instead

- Where these rules are enforced: [`../testing/guards.md`](../testing/guards.md).
- What the elements being sized actually are:
  [`architecture.md`](architecture.md).
- What the colours mean before you style anything:
  [`../feel/visual-language.md`](../feel/visual-language.md).
