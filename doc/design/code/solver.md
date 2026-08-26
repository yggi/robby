# The solver — infrastructure, not a dev tool

`solve(level, maxDepth)` — BFS over programs, deduplicated on world state,
respecting the tray. Returns the shortest winning program or `null`. It is 57
lines.

## It is a component

Three things in the shipped game call it:

- **every shipped level's `par` is asserted minimal on every test run.** No par
  in this repo was authored. They are derived, and re-derived, continuously.
- **the generator judges candidates with it** — `judge()` in `generate.ts`.
- **the editor runs it live**, on every finished stroke, which is how a child
  can never build a broken room and how the solved route gets drawn as they
  build.

This is the first rule in `CLAUDE.md` for a reason: if you are about to write
something that decides whether a level is any good, you are about to duplicate
this badly. Ask it instead.

It paid for itself immediately. A hand-written par for the return-trip level was
wrong — the battery tile becomes a corner once the bridge behind it collapses —
and the solver said 4 where the author said 3, before any pixels existed.

## The load-bearing test

The single most useful technique in this project:

> Solve a candidate twice — once as built, and once with the world's mechanic
> disabled — and reject it unless the answer **changes**.

It is **difference, not direction**. Removing World 1's decoys *shortens* par;
opening World 2's blocked passage *lengthens* it. Both mean the mechanic was
doing work. A filter that only looked for "par got longer" would throw away half
of the good rooms and keep a class of bad ones.

That one filter took generator acceptance from **55% to 17%**, and it would have
caught, automatically, both hand-built levels where a mechanic turned out to be
bypassable.

Generalised in `doc/META.md` as: *a feature you cannot switch off cannot be shown to
be doing anything.* When you add a mechanic, add the way to disable it in the
same commit — it is what the generator judges with, and it is the only honest
test that the mechanic matters.

## Cost, measured

- typically **under 100ms**
- **458ms** on the 13-token Scrapyard finale

It is dominated by **open space**, because every tile in an open room is a
junction and therefore a branch. An 11×7 fully open grid does not solve within
depth 16 at all.

That is a happy constraint: wide-open rooms are both expensive to solve and
terrible puzzles, so one rule serves both. It is also the thing that bounds the
editor's grid size — `doc/BOARD.md` [R-005] cannot just change the numbers.

**Always cap `maxDepth` at the par you are willing to accept, plus one.**
Searching to 20 while rejecting anything over 11 is pure waste, and the waste is
exponential.

## The trap

**An empty map solves at par 0.** `satisfied()` is true when no objectives
remain, so a grid with no battery is won at step zero. Any code that asks the
solver about a partial level — anything in the editor, anything mid-draft — must
check completeness *first*. See `assess()` in `editor.ts`.

## Where to go instead

- The rule the solver is searching over:
  [`../game/rules.md`](../game/rules.md).
- What the generator does with the verdict:
  [`../game/content.md`](../game/content.md).
- The suite that re-derives every par: [`../testing/layers.md`](../testing/layers.md).
