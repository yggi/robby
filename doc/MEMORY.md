# MEMORY.md — project memory

Durable, crystallized truth about `robby`. Facts and settled decisions only.
Status in `doc/BOARD.md`, threads in `doc/NOTES.md`, method in
`doc/META.md`, the arc in `doc/HISTORY.md`, this week's detail in
`doc/LOG.md`.

**Target: 300 lines**, act at 360 (`CLAUDE.md`). On overflow, spill the fattest
section into the cluster it belongs to and leave the index below untouched.

## Index — four clusters

**This index names clusters, not pages.** Each cluster page below indexes its
own tree, one line each, and cross-links the siblings — so *where does this
belong* is answered one level down, by a page that knows the subject, rather
than by a row in a table that has to be re-read in full every time it grows.

| Cluster | Ask it about |
|---|---|
| [`doc/design/game.md`](doc/design/game.md) | who it is for, what it teaches, the rule the whole thing turns on, what ships, and what a five-year-old actually did with it |
| [`doc/design/feel.md`](doc/design/feel.md) | what the player sees, hears and touches — the two visual languages, the characters, motion and sound, the UX vocabulary |
| [`doc/design/code.md`](doc/design/code.md) | how it is built — the engine/view split, the solver as infrastructure, the stack, and the conventions that were bought with bugs |
| [`doc/design/testing.md`](doc/design/testing.md) | the three suites, the jsdom harness, and how to check things that cannot be seen |

The game cluster marks one of its pages **exploratory** — a report on one
session with one child is evidence, not a finding. Everything else in
`doc/design/` is as durable as this file.

---

## 1. Identity

**Robby & Funke** — a programming puzzle game for children of about four to
seven. Specifically: **children who cannot read.** Robby is a robot who has run
out of power; Funke is his cat. You do not drive Robby. You give him a short
list of arrows, press play, and watch what your list actually does.

That audience is not a style choice, it is the design brief, and nearly every
decision follows from it: no text in the game loop, every state legible as
motion or colour, sound that carries meaning, large targets, cheap failure,
nothing ever destroyed by a mistake. → `doc/design/game/audience.md`

**What is being taught is not syntax. It is the gap between what you meant and
what you wrote** — which is where all programming lives, and which is legible to
a four-year-old the moment a robot walks confidently into a wall.
→ `doc/design/game/thesis.md`

The secondary audience is the adult sitting next to them. That is who the room
names, the level select, the workshop prices and these documents are for.

## 2. The rule of the game

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

The map format, the cell kinds, the item kinds and the two goal types are in
`doc/design/game/rules.md`; the table itself is `src/engine/legend.ts`, and it
is the **save format** — a built room is stored as its map string and nothing
else, so a character that changes meaning rewrites every room already made.
Absolute arrows rather than turn-left/turn-right, because mental rotation mostly
is not there before six.

## 3. The engine knows nothing about the view

`src/engine/` is pure TypeScript with no DOM, no Svelte and no timing. It is
tested without a browser. `simulate(level, program)` returns a `Trace` — every
frame the run produces, each with a `from`, `to`, `event`, `carried`, the
`cmdIndex` that authorised it, and a full world snapshot.

The view replays that trace and owns durations, easing and squash. This is the
load-bearing decision of the codebase: it is why animations can be retimed
without touching a rule, why the engine is testable in milliseconds, and why the
solver, the generator and the editor all get correct behaviour for free.

**Funke has never been in the engine.** She cannot change an outcome. That is
enforced by architecture rather than by discipline.

→ `doc/design/code/architecture.md`

## 4. The solver is the quality bar

`solve(level, maxDepth)` — BFS over programs, deduplicated on world state,
respecting the tray. Returns the shortest winning program or `null`.

- Every shipped level's `par` is asserted minimal on every test run.
- The generator judges candidates with it (`judge()` in `generate.ts`).
- The editor runs it live on every finished stroke.

**The load-bearing test** is the single most useful technique in this project:
solve a candidate twice, once as built and once with the world's mechanic
disabled, and reject it unless the answer *changes*. It is difference, not
direction — removing World 1's decoys shortens par, opening World 2's blocked
passage lengthens it, and both mean the mechanic was doing work. It took
generator acceptance from 55% to 17%.

Cost, measured: under 100ms typically; 458ms on the 13-token Scrapyard finale.
It is dominated by **open space**, because every tile in an open room is a
junction. Always cap `maxDepth` at the par you are willing to accept plus one.

→ `doc/design/code/solver.md`

## 5. What ships

**Five chapters, not four.** `chapters` in `levels.ts` is
`[lab, forest, scrapyard, cheeseMoon, testWorld]`, and the level select shows
six tiles — those five plus the place for rooms you built.

| Chapter | Theme | What it escalates |
|---|---|---|
| The Lab | `lab` | one way through: corners, then junctions |
| The Mechanical Forest | `forest` | more than one way round, some shut for good |
| The Scrapyard | `scrap` | conveyors, and trays with a direction missing |
| The Cheese Moon | `cheese` | bridges that hold once — so the question is *order* |
| Test World | `garden` | **a bench, not a curve**: one room per mechanic |

Worlds escalate the *kind* of thinking, not the token count. Test World is a
developer bench that ships to players; whether it should is a live thread
(`doc/NOTES.md`).

`Chapter` is the unit of content, and **rooms a child built** are assembled at
runtime into one like any other — so the level select, minimaps, playing, pips
and the next button all work on them with no special cases.

**Practice rooms are not**, though this file said they were for months. A
practice room is a bare `Level` held outside the chapter system
(`game.svelte.ts`), and it costs a special case in six places. That is the
argument for the pattern rather than against it: the half that was done as a
`Chapter` needed none. `doc/BOARD.md` [R-028].

The economy, the workshop, the practice tile and the editor's shipped slice are
in `doc/design/game/content.md`.

## 6. Themes

`THEMES` in `engine/types.ts` is a `const` array of **nine** — `lab`, `forest`,
`scrap`, `cheese`, `house`, `garden`, `city`, `factory`, `ship` — and the
`Theme` union is derived from it rather than written beside it. A world
therefore cannot be half-added: `DECOR` is keyed by `Theme` and will not compile
without a backdrop, and a smoke check asserts the stylesheet has a palette for
every entry.

Five of the nine dress Test World rooms only. Each still costs a palette and a
backdrop, which is the price of the derived union and worth knowing before
adding a tenth.

Palettes are keyed on **the attribute alone** — `[data-theme="lab"]`, not
`.scene[data-theme="lab"]`. They were once keyed to two specific elements and
the editor, a third, silently got no colours at all.

**Every backdrop is drawn from directly overhead.** The board is a top-down
view; backdrops must match. Got wrong twice, obviously wrong both times: the
city had a side-on skyline behind a top-down road, the lab had a papered wall
with lamps on cords. Light pools are the only legitimate trace of a ceiling — a
pool of light on a floor is exactly what you see from above.

## 7. Sizing, and the one variable

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

## 8. Persistence

Five keys in `localStorage`, all guarded by try/catch (jsdom refuses them on an
opaque origin, so the game runs memory-only in tests): `robot.bits`,
`robot.solved`, `robot.owned`, `robot.kit`, `robot.rooms`.

Rooms a child built store **the map string and nothing else**. Par and tray are
solved for again on load, so a saved room can never carry a stale par; if it
stops solving it drops out of the list rather than being played wrong.

`wipeProgress()` deliberately does not delete built rooms. Progress is the
game's; the rooms are theirs.

## 9. Stack — settled

- **Svelte 5** (runes: `$state`, `$derived`, `$effect`) + **TypeScript**
- **Vite 6** with `vite-plugin-singlefile`
- **Vitest** for engine tests, **jsdom** for behavioural smoke tests
- Build output: **one `dist/index.html`**, ~250 KB, no external requests

Two build decisions worth keeping, both with reasons that are not obvious: the
bundle is an **IIFE, not an ES module**, and the **font travels inlined** as
latin woff2 only. → `doc/design/code/stack.md`

## 10. Repo map

```
src/
  engine/          pure TypeScript, no DOM, no timing, fully unit-tested
    types.ts       Dir, Cell, Item, Level, Chapter, Theme, and the const arrays
                   the unions derive from: THEMES, CELL_KINDS, ITEM_KINDS.
                   Also the grid primitives — step, neighbours, around, posKey,
                   spend — which exist so nobody writes [[1,0],[-1,0],…] again
    legend.ts      the map format, as a table read in both directions
    parse.ts       ASCII map → World, dispatching through the legend
    simulate.ts    the rules. isDecision, onEnter triggers, belts, the Trace
    solve.ts       BFS solver → shortest program or null (56 lines)
    level.ts       map + theme → a solved, trayed Level, or nothing.
                   The one place that asks the solver what a room is worth
    levels.ts      every shipped level, as ASCII maps with a verified par
    generate.ts    procedural rooms for the practice tile
    editor.ts      the editor's model: drafts, painting, the verdict
  view/            Svelte + DOM. Owns time, easing, sound, everything visible
    game.svelte.ts the single state store; screens, run playback, camera, economy
    Board.svelte   the world: tiles, sprites, particles, the plan
    Console, GameBar, Menu, Rooms, Store, Editor, Intro, MiniMap
    audio, bits, colors, decor, fly, geom, icons, parts, props
                   nine plain modules, ~1,200 lines — a third of the view, and
                   the part that gets forgotten when the view is described
  styles/          eight stylesheets, imported in a fixed order
test/              the jsdom harness and the two smoke suites (.mjs)
```

One store, `createGame()` in `game.svelte.ts`, passed down as `g`. It holds the
screen, the chapter and level indices, the program, the playhead, the camera,
the economy and the editor hand-off. Components are views onto it.

**Order of `src/styles/index.css` is load-bearing.** Several rules depend on
being *later* than an earlier one of equal specificity — the thought bubble's
`.want svg` has to beat `.bot svg`, because the bubble lives inside the robot.
Do not sort the imports.

## 11. Conventions

**Name collisions are the recurring failure mode of this codebase.** Six so far:

| Collision | Symptom |
| --- | --- |
| `.exit` | matched the floor tile under the rocket, not the rocket |
| `.screen.play` | matched the play *button*; control tests silently tested a div |
| `@keyframes roll` | treads ran the practice-tile dice animation, 20×/second |
| `.tray` | the store's parts bin gave the arrow tray `overflow-x: auto` |
| `.cog` | turned the cog *part* into a 22px spinning disc |
| `.grid` | the editor and the level select both used it |

Board kinds become element classes, so a bare rule on `cog` or `belt` or `exit`
lands on the board whether you meant it or not. Two guards exist and both have
caught real regressions. The full list of conventions, each with the bug that
bought it, is `doc/design/code/conventions.md`.

## 12. Things that are deliberate, not oversights

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
