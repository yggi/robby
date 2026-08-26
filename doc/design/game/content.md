# The content — five chapters, an endless room, a shop and an editor

## `Chapter` is the unit, and that is why there are no special cases

A `Chapter` is an id, a name, a theme and a list of levels. Almost everything
the game shows is one: the four authored worlds, the bench, and **the rooms a
child built** (a chapter assembled from `localStorage`). So the level select,
the minimaps, playing, the progress pips and the next button all work on
hand-built rooms with no special-casing at all.

**The practice room is the exception, and it is instructive.** It was described
here as "a chapter of one, rolled at runtime" and it is not: it is a bare
`Level` held beside the chapter system, and it needs a special case in six
places — the level swap, three places that clear it, the reward, the progress
pips and the level-select tile. Two runtime-assembled things, two mechanisms,
and only one of them free. `doc/BOARD.md` [R-028].

That was not the motivation for `Chapter`. It is the consequence, and it is the
best argument in the codebase for picking the unit that makes special cases
disappear — see `doc/META.md`.

## What ships

`chapters` in `levels.ts` is `[lab, forest, scrapyard, cheeseMoon, testWorld]`,
and the level select shows **six** tiles: those five, plus the place for rooms
you built.

| Chapter | Rooms | What it escalates |
|---|---|---|
| The Lab | 8 | one way through: corners, then junctions, then the open grid that charges per tile |
| The Mechanical Forest | 8 | more than one way round, and some ways shut for good |
| The Scrapyard | 8 | conveyors — and trays with a direction missing. Not one par in that world spends a `left` |
| The Cheese Moon | 8 | bridges that hold once, so the question becomes *in which order* |
| Test World | 9 | **a bench, not a curve** — one room per mechanic |

Room names are for the adult: Charging Nook, Sleep Bay, Two Cogs, No Left Turns,
Mind the Gap, Order of Things. They also do quiet world-building — the Sleep Bay
has Robby's berth with Funke's basket beside it — which is the only story the
game currently tells (`doc/NOTES.md`).

**Test World ships to players** and its comment claims "every trigger the engine
supports has a level here", which is not true: no shipped level uses a one-way.
Whether the bench belongs on the level select at all is an open thread.

## The practice tile

An endless room, generated on the spot, in **the worlds that have a generator
behind them** — which is Worlds 1 and 2 only, because `generate.ts` stops there.
Finishing one rolls the next.

Practice rooms **pay 1 bit rather than 3, and are never recorded as solved.**
Both halves are deliberate: without the first they are an endless supply of bits
to farm the shop with, and without the second a world could be completed without
touching an authored room.

## The economy

Bits. A room pays **3** the first time it is solved and **1** thereafter; a
practice room pays **1**, always. They buy parts in the workshop — an antenna
for Robby, a tail for Funke, a nose for the rocket — four parts each, priced 0 /
3 / 8 / 14, where 0 is the one it came with.

One slot per character is the whole shop, so bits accumulate faster than there
is anything to spend them on. That is a real curve problem and it is carded
(`doc/BOARD.md` [R-015]), not a rounding error.

Progress and purchases persist; `wipeProgress()` clears them and **deliberately
does not delete built rooms**. Progress is the game's; the rooms are theirs.

## The editor

Shipped as a first slice, and it is the thing people actually use
([`playtest.md`](playtest.md)).

**Has:** floor, wall, battery, bridge, conveyor. Painting by drag, carrying a
piece by pressing it, turning a conveyor by tapping it, throwing a piece away by
dragging it off the edge. A live verdict: it solves the draft on every finished
stroke and draws the solved route on the room as you build.

**Has not:** gates and plates, one-ways, keys, parts beyond a single battery,
multi-objective and rocket goals, any grid size other than 9×7, and undo from
anywhere but the toolbar.

Everything in that second list is a card, and they are the top of the board.

## Where to go instead

- Why a room is judged by solving it twice:
  [`../code/solver.md`](../code/solver.md).
- The interaction vocabulary the editor is built from:
  [`../feel/ux-patterns.md`](../feel/ux-patterns.md).
- What one child did with all of this: [`playtest.md`](playtest.md).
