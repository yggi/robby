# MEMORY

Things that are true about this project and expensive to rediscover. Read this
before changing anything; most of it was learnt by breaking something.

---

## The rule of the game

The robot runs straight until it **can** or **must** change direction. It
consumes one instruction unless carrying straight on is the only option.

That single predicate produces corners, junctions, the side-opening tax, dead
ends, and — on a fully open grid, where every tile is a junction — degenerates
to one arrow per tile. It lives in `isDecision()` in `src/engine/simulate.ts`
and there is a test for each of those cases.

A consequence worth holding onto: **one instruction can buy a long stretch of
travel.** The planning vectors draw a run as one continuous stroke for exactly
this reason. Do not make it look like a dot per tile; that teaches the opposite
of what is true.

## The engine knows nothing about the view

`src/engine/` is pure TypeScript with no DOM, no Svelte and no timing. It is
tested without a browser. `simulate(level, program)` returns a `Trace` — every
frame the run produces, each with a `from`, `to`, `event`, the `cmdIndex` that
authorised it, and a full world snapshot.

The view owns durations, easing and squash. It replays the trace. This split is
why animations can be retimed freely and why the solver, the generator and the
editor all get correct behaviour for free.

**Funke has never been in the engine.** She cannot change an outcome. That is
enforced by architecture rather than by discipline.

## The solver is the quality bar

`solve(level, maxDepth)` — BFS over programs, deduplicated on world state,
respecting the tray. Returns the shortest winning program or `null`.

- Every shipped level's `par` is asserted minimal on every test run.
- The generator judges candidates with it (`judge()` in `generate.ts`).
- The editor runs it live on every finished stroke.

Cost, measured: under 100ms typically; 458ms on the 13-token Scrapyard finale.
It is dominated by **open space**, because every tile in an open room is a
junction. An 11×7 open grid does not solve within depth 16 at all. Wide-open
rooms are both expensive and terrible puzzles, so one constraint serves both.

Always cap `maxDepth` at the par you are willing to accept plus one. Searching
to 20 while rejecting anything over 11 is pure waste.

## Traps that have already caught someone

**An empty map solves at par 0.** `satisfied()` is true when no objectives
remain, so a grid with no battery is won at step zero. Any code that asks the
solver about a partial level must check completeness *first* — see `assess()` in
`editor.ts`.

**Name collisions are the recurring failure mode of this codebase.** Six so far:

| Collision | Symptom |
| --- | --- |
| `.exit` | matched the floor tile under the rocket, not the rocket |
| `.screen.play` | matched the play *button*; control tests silently tested a div |
| `@keyframes roll` | treads ran the practice-tile dice animation, 20×/second |
| `.tray` | the store's parts bin gave the arrow tray `overflow-x: auto` |
| `.cog` | turned the cog *part* into a 22px spinning disc |
| `.grid` | the editor and the level select both used it |

Two guards exist in `smoke.fast.mjs`: no two `@keyframes` share a name, and no
board **kind** name (`cog`, `belt`, `exit`, `fragile`, …) is ever styled bare —
those become element classes, so `.cog {}` lands on the board whether you meant
it or not. There is also a check that no CSS selector is defined twice, which
catches stale blocks surviving an edit.

**Percentages need a definite containing block.** The rocket sat wrong through
two rounds of nudging numbers because `height: 82%` was resolving against an
auto-sized *grid row*. The CSS was applying exactly as written; the numbers just
did not mean anything. If a percentage seems to be ignored, check what it
resolves against before changing it.

**jsdom swallows uncaught errors** into its own console. The harness now
collects them (`errors` export), because a suite can otherwise pass while the
app throws on every frame.

**A check that can pass on an empty sample will eventually pass on an empty
sample.** The board-sizing guard — the one that catches a new board element
missing from the sizing rule — read `.board [style*="--x"]` once, at the end of
the suite. The fast suite ends in the editor, where there is no board, so it
was checking *nothing*, and had been for as long as it had existed. It said so
on every run, in a cheerfully passing line reading `(0 checked)`, and the number
went unread because the line said `ok`.

It now lives in the harness as `sweepBoard()` / `checkBoardSizing()`: samples
are collected on every navigation and asserted over at the end, and **an empty
sample is a failure**, not a pass. The general form is worth keeping: if a check
scrapes the DOM for its subjects, it has to assert it found some. Put the count
in the label and make the count itself an assertion.

## Sizing and layout

Everything on the board is positioned from one variable:

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
carrying `--x` and asserts a rule sizes it.

`--c` is rounded down to whole pixels with `round()`. A fractional tile size
puts sprites on fractional pixels while the floors layer — which sits under a
`filter` and rasterises separately — snaps to the grid, and the mismatch drifts
as the robot moves.

The editor works by supplying its own `--c`, which is why it renders with the
board's real tiles rather than a set of its own.

## Themes

`THEMES` in `engine/types.ts` is a `const` array; the `Theme` union is derived
from it. A world therefore cannot be half-added: `DECOR` is keyed by `Theme` and
will not compile without a backdrop, and a smoke check asserts the stylesheet
has a palette for every entry.

Palettes are keyed on **the attribute alone** — `[data-theme="lab"]`, not
`.scene[data-theme="lab"]`. They were once keyed to two specific elements and
the editor, a third, silently got no colours at all.

## Every backdrop is drawn from directly overhead

The board is a top-down view. Backdrops must match. This has been got wrong
twice and both times looked obviously wrong the moment it shipped:

- the city had a side-on **skyline** behind a top-down road → now rooftops
- the lab had a papered **wall** with lamps on cords → now floorboards and rugs

Light pools are the only legitimate trace of a ceiling: a pool of light on a
floor is exactly what you see from above.

## Order of the stylesheet is load-bearing

`src/styles/index.css` imports six files in a fixed order. Several rules depend
on being *later* than an earlier one of equal specificity — the thought bubble's
`.want svg` has to beat `.bot svg`, because the bubble lives inside the robot.
Do not sort the imports.

## Persistence

Four keys in `localStorage`, all guarded by try/catch (jsdom refuses them on an
opaque origin, so the game runs memory-only in tests):

- `robot.bits`, `robot.solved`, `robot.owned`, `robot.kit`, `robot.rooms`

Rooms a child built store **the map string and nothing else**. Par and tray are
solved for again on load, so a saved room can never carry a stale par; if it
stops solving it drops out of the list rather than being played wrong.

`wipeProgress()` deliberately does not delete built rooms. Progress is the
game's; the rooms are theirs.

## Things that are deliberate, not oversights

- **No text in the game loop.** Icons and colour only. Names appear on tiles and
  bars, for the adult reading over a shoulder.
- **No reset button.** A failed run drives itself home, keeps the program, and
  leaves the wrong slot ringed. One tap fixes it.
- **Practice rooms pay 1 bit, not 3**, and are never recorded as solved.
  Otherwise they are an endless supply of bits to farm the shop with.
- **The play button is never disabled.** An empty program earns an instant
  shrug, which is a lesson.
- **Direction colours are canonical**: up blue, right green, down yellow, left
  red. Orange means power and teal means go; neither is ever spent on anything
  else. The blamed slot is a pulsing red *ring*, not a red fill, because left is
  already red.
