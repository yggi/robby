# NOTES.md — open threads

**Open, uncrystallized threads only.** Not a task list (that is
`doc/BOARD.md`), not a record (that is `doc/LOG.md`), not settled truth (that
is `doc/MEMORY.md`). A thread leaves exactly three ways: it crystallizes into
`doc/MEMORY.md`, becomes a card in `doc/BOARD.md`, or is deleted as no longer
interesting.

**Target: 100 lines, act at 120** (`CLAUDE.md`). At 120 the threads have gone
stale: resolve, promote or delete, back to 100 or below in one pass.

---

## The editor turned out to be the game

Shipped as "a first slice" — floor, wall, battery, bridge, conveyor, a fixed 9×7
grid, undo only from the toolbar. It is the thing that gets used, and it is used
*between people*: Emilia and her father build rooms for each other to solve
(`doc/design/game/playtest.md`). An adult building with belts and bridges makes
rooms that are a real challenge for older children, so the ceiling is far above
the shipped curve.

The thread is not *which piece to add next* — those are cards. It is what the
editor **is**, now that it is the main surface: a toy inside the game, or the
game's other half with its own progression, its own rooms-you-have-solved, its
own way of handing a room to somebody. That answer decides whether sharing is a
URL feature or a shape the whole thing takes.

## Test World ships, and nobody decided that it should

`chapters` is five, and the fifth is a bench: one room per mechanic, dressed in
five themes (`house`, `garden`, `city`, `factory`, `ship`) that exist for
nothing else. It sits on the level select beside the four authored worlds, so a
child meets it as content. Two readings, both defensible — it is a *sampler*
that happens to be useful to developers, or a dev surface that leaked into the
game and should be behind something.

Sharpened by a hole: the chapter's own comment says "every trigger the engine
supports has a level here", and **no shipped level anywhere uses a one-way**.
The bench is incomplete exactly where §10's unused mechanic is. Whichever
reading wins, that is worth fixing, and it wants a check rather than a promise
(card).

## What should vary, and what should be the same every time

Celebrations draw at random from four flourishes each; lift paths vary. Idle
tics, bonks and pickups play identically every time. That reads as an
oversight — there is a pattern to copy in `throwParty()` — but the opposite case
is real: a bonk is *feedback*, and feedback that varies is harder to learn from
than feedback that does not. The thread is where the line goes. Best guess,
untested: variety belongs to things that reward you, sameness to things that
tell you what happened.

## Nobody has met Robby cold

The one thing the playtest did not settle. Emilia had an adult beside her the
first time, so "can a child solve this?" is answered and "can a child *start*?"
is not. The first screen is a menu of world tiles; the first room is a corridor
with a battery in it and no instruction anywhere, by design. Whether that reads
as an invitation or as a wall to a five-year-old alone with a phone is unknown,
and it is the highest-value unknown left.

## Thirty-two rooms, no journey

The rooms tell you *where* you are — the Sleep Bay has his berth and Funke's
basket beside it — but nothing connects them. The arrival card between worlds is
the first step and the only one. A wordless beat between rooms, Funke padding
ahead through a doorway, would turn a curve into an adventure. Open: the
register. It cannot use text, it must not cost a tap, and anything that plays
every single time becomes something to skip.

## Regex is holding up a dozen CSS claims

Checks like "the fins are pulled down past the flame overhang" assert a literal
`bottom:-6%` in the built file. They catch deletion, not wrongness, and they are
re-tuned by hand whenever the value is. **There are 27 of them, not "about a
dozen"** — counted rather than remembered — and the most brittle pins a rule's
entire body and declaration order. A visual regression tool would replace
them — but a screenshot baseline is an external dependency and a pile of binary
artefacts in a repo whose whole point is that it works on a plane. Unresolved:
whether the honest version is a headless-render baseline committed to the repo,
or a much smaller set of claims that are genuinely computable from the CSS.

## Is there a keyboard story at all?

There are `aria-label`s throughout and `prefers-reduced-motion` is honoured
properly, but it has never been driven end-to-end by keyboard or heard through a
screen reader. Before that becomes work, the question is what it would *mean*
here: a game with no text, whose entire vocabulary is four colours and a
position under a thumb. A screen reader reading "up, right, right" aloud is a
different game, and possibly a good one — for a different child.
