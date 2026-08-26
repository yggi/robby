# The rules — one predicate, and the format that feeds it

## The rule

The robot runs straight until it **can** or **must** change direction. It
consumes one instruction unless carrying straight on is the only option.

That single predicate is `isDecision()` in `src/engine/simulate.ts`, and it
produces everything:

| Situation | Costs an instruction | Because |
|---|---|---|
| a corner | yes | carrying on is not available |
| a junction | yes | more than one way on |
| a side opening | yes | **the side-opening tax** — a passage you could take is a decision even if you do not take it |
| a dead end | yes | the only move is a reversal, which is a choice |
| a straight corridor | no | there is nothing to decide |
| a fully open grid | every tile | every tile is a junction, so it degenerates to one arrow per tile |

There is a test for each of those cases. That last row is not a degenerate
failure — it is the reveal at the end of World 1's curve, where a child who has
been buying corridors with single arrows meets a room that charges for every
step.

**One instruction can buy a long stretch of travel.** The planning vectors draw
a run as one continuous stroke for exactly this reason. Do not make it look like
a dot per tile; that teaches the opposite of what is true.

## The map format

A level is `string[]`. The legend lives in `src/engine/parse.ts` and is the
single source of truth for it:

```
#        wall
.        floor
R        robot start (floor)
*        battery   (pickup, objective)
k        key       (pickup, opens every gate on contact)
1-9      gate, closed, link id = digit
A-I      pressure plate, opens gate 1-9 (A->1, B->2, ...)
^ v < >  one-way floor: may only be exited in that direction
~        fragile floor: collapses once the robot steps off it
@        the rocket: the way out, if the manifest is satisfied
c s x    cog, coil and core: parts, collectable in any order
=        a way through that is blocked for good
N E S W  a conveyor running north, east, south or west
```

Rows are padded to the widest with `#`, so a short row is walled, not ragged.
That a room is *text* is why a built room saves as nothing but its map string,
why a room could be a URL, and why the editor and the shipped levels are the
same kind of object.

## Cell kinds, and what each one is for

`wall`, `floor`, `exit`, `blocked`, `belt`, `gate`, `plate`, `oneway`,
`fragile`. Four of them are mechanics rather than terrain:

- **`belt`** — stepping *on* costs one instruction; the ride is free. It carries
  the robot along `dir` until the next tile is not enterable, at which point he
  is simply standing there. It cannot be walked onto against its flow. This is
  World 3, and it is the first mechanic that moves you without your asking.
- **`fragile`** — becomes wall once the robot leaves it. This is World 4, and it
  is what turns a route into an *order*: the room is a different room after you
  have crossed it.
- **`gate` / `plate`** — linked by id. A pair is inherently a two-step
  interaction, which is why the editor does not have them yet
  (`BOARD.md` [R-001]).
- **`oneway`** — may only be exited in `only`. Parsed, simulated, solvable, and
  **used by no shipped level at all** (`BOARD.md` [R-004]).

## Items and goals

Item kinds are `battery`, `key`, `cog`, `coil`, `core`. `OBJECTIVES` is the
subset that finishing can require — everything but `key`, because **a key is a
tool, not an objective**: picking one up never finishes anything.

Two goals, and only two:

- `{ type: 'collect' }` — grab every objective in the room, in any order.
- `{ type: 'exit', requires: ItemKind[] }` — reach the rocket carrying
  everything it needs. `requires` is a *manifest*, and it is a list rather than
  a flag precisely so a later level can demand a repair part or a key alongside
  the battery.

**An empty map solves at par 0.** `satisfied()` is true when no objectives
remain, so a grid with no battery is won at step zero. Any code that asks the
solver about a partial level must check completeness *first* — see `assess()` in
`editor.ts`. This has caught someone already.

## Where to go instead

- Why the rule is this rule rather than one-arrow-per-tile:
  [`thesis.md`](thesis.md).
- What is built on it: [`content.md`](content.md).
- How a program is turned into frames, and who owns the milliseconds:
  [`../code/architecture.md`](../code/architecture.md).
