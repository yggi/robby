# UX patterns worth preserving

Four patterns, each of which removes a mode, a button or a decision that a child
would otherwise have to make on the game's behalf.

## Grab what is under your finger

In the editor, the thing under your finger and the tool in your hand decide
together what a gesture means — and only the release can tell you which it was.
Press and **hold** a thing to lift it. Leave the tile you pressed and you have
drawn a **trail**. Lift without moving and it is a **tap**, which paints — or,
where the chosen tool is the one that made what is under it, turns a conveyor or
changes an object into the next kind along.

One vocabulary, four gestures, no modes and no confirmation. Nothing is decided
on the way down, which is what lets the same press mean *carry this* and *paint
over this* without asking.

The hold is the one gesture in the game with a clock in it, and it earns that by
being visible: the piece lifts and rides under the finger the instant it fires,
so the hold teaches itself. It exists because the alternative was worse —
carrying on press meant **no brush could ever overdraw a piece**, so conveyors
and bridges were undeletable by accident of the rule rather than by decision.

## Drag it off the edge to throw it away

The room outlines in red while you hold a piece out there, so the destructive
state is visible for as long as it lasts and is undone by moving your thumb
back. No bin, no long-press, no confirmation.

Robby is excluded — there is exactly one of him, and a room without him is not a
room.

## Never make a child perform bookkeeping

No reset button. No validate button. No confirm dialog anywhere in the game
loop.

- A **failed run** drives itself home, keeps the program, and leaves the wrong
  slot ringed. One tap fixes it.
- The **play button is never disabled.** An empty program earns an instant
  shrug, which is a lesson, and which costs one tap to discover. A greyed-out
  button teaches nothing and cannot be asked a question.
- The one destructive action outside a level — **erasing progress** — takes two
  taps and disarms itself after four seconds.

## Show the answer, do not score it

- The **editor draws the solved route** on the room as you build, so a room that
  cannot be solved never gets built.
- The **ghost path previews a plan** before it runs, which moves the interesting
  moment into the strip where the thinking is
  ([`../game/thesis.md`](../game/thesis.md)).
- The **thought bubble** says what is still needed, and ticks it off the moment
  it is picked up. It is also how a **half-built room** says what is wrong with
  it — nothing to fetch, no ground under him, no way through — because the
  alternative was a sentence, and the player cannot read one.

Nothing anywhere returns a grade, a star count or a time. The par exists, is
derived by the solver, and is shown as something to reach rather than something
to fall short of.

## The through-line

Every one of these is the same move: **make the state visible instead of asking
about it.** A confirm dialog asks a child to predict a consequence; a red
outline shows them the consequence while it is still reversible. A disabled
button asks them to know why; a shrug tells them.

That is also why none of these has an undo in the usual sense. Undo is
bookkeeping — it presumes the action already happened somewhere out of sight.
Here the action is on screen the whole time it is happening, and moving your
thumb is the undo.

## Where to go instead

- What the editor can and cannot place today:
  [`../game/content.md`](../game/content.md).
- Why the console never changes while the world always does:
  [`visual-language.md`](visual-language.md).
- The camera trick that removes the loading state between rooms:
  [`motion-and-sound.md`](motion-and-sound.md).
