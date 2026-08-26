# Architecture — the split, the trace, and the one store

## The engine/view split

```
src/
  engine/          pure TypeScript, no DOM, no timing, fully unit-tested
    types.ts       Dir, Cell, Item, Level, Chapter, Theme (+ THEMES const)
    parse.ts       ASCII map → World. The map format lives here.
    simulate.ts    the rules. isDecision, onEnter triggers, belts, the Trace
    solve.ts       BFS solver → shortest program or null. 57 lines.
    levels.ts      every shipped level, as ASCII maps with a verified par
    generate.ts    procedural rooms for the practice tile
    editor.ts      the editor's model: drafts, painting, the verdict
  view/            Svelte + DOM. Owns time, easing, sound, everything visible
    game.svelte.ts the single state store; screens, run playback, camera, economy
    Board.svelte   the world: tiles, sprites, particles, the plan
    Console.svelte  GameBar  Menu  Rooms  Store  Editor  Intro  MiniMap
    audio  bits  colors  decor  fly  geom  icons  parts  props
  styles/          eight stylesheets, imported in a fixed order
test/              the jsdom harness and the two smoke suites (.mjs)
```

Note that last line of `view/`: **nine plain `.ts` modules, about 1,200 lines**
— roughly a third of the view, and the part that gets elided whenever the
architecture is described in prose. `decor.ts` alone is 303 lines. If you are
looking for where something visual is defined and it is not in a component, it
is in one of those nine.

## The `Trace` is the boundary

`simulate(level, program)` returns a list of frames. Each frame has:

- `from` and `to` — the tiles
- `event` — what happened on arrival
- `carried` — what he is holding
- `cmdIndex` — **which instruction authorised this frame**
- a complete world snapshot

The engine knows nothing about milliseconds. The view replays the trace and
chooses how long each frame is held (`DUR` in `game.svelte.ts`) and what it
looks like.

`cmdIndex` is the field that makes the game legible: it is how the wrong slot
gets ringed, how the plan highlights as it executes, and how a run can be blamed
on one token rather than on the program as a whole.

## What the split buys

- the solver, the generator and the editor all reason about **real gameplay**,
  because there is only one implementation of the rules
- animations can be retimed without touching a rule
- the engine is testable in **milliseconds, with no browser**
- **a companion character can exist who provably cannot affect the game** —
  Funke trails one frame behind Robby by reading the same trace, so she needs no
  pathfinding and cannot desync ([`../feel/characters.md`](../feel/characters.md))

That last one is the pattern worth generalising: when a rule matters, find the
boundary that makes breaking it impossible rather than the review that would
notice.

## One store

`createGame()` in `game.svelte.ts` (567 lines), passed down as `g`. It holds the
screen, the chapter and level indices, the program, the playhead, the camera,
the economy and the editor hand-off. Components are views onto it.

Svelte 5 runes throughout: `$state`, `$derived`, `$effect`. A value that can be
derived should be `$derived` and not mirrored into a `$state` by an effect —
mirroring is how two sources of truth get created, and the second one always
wins somewhere unexpected.

## `Chapter` is the unit of content

And it pays off twice: **practice rooms** and **rooms a child built** are both
assembled at runtime into a `Chapter` like any other, so the level select,
minimaps, playing, pips and the next button all work on them with no special
cases. See [`../game/content.md`](../game/content.md).

## Where it is thin

`Board.svelte` is **584 lines** and does five jobs: derivation, drag-free
rendering, particles, the camera, and Funke's roaming AI. Two of them come out
cleanly — the particle code is imperative DOM and wants to be a module, and
Funke's breadth-first roaming is self-contained. `BOARD.md` [R-013].

There is **no error boundary**. If a render throws, the screen goes blank — on a
phone, with no console, in front of a child. `BOARD.md` [R-014].

## Where to go instead

- Why `solve()` is a component and not a tool: [`solver.md`](solver.md).
- The build that turns all of this into one file: [`stack.md`](stack.md).
- The CSS rules that a new board element must obey:
  [`conventions.md`](conventions.md).
