# UX patterns worth preserving

Four patterns, each of which removes a mode, a button or a decision that a child
would otherwise have to make on the game's behalf.

## Grab what is under your finger

In the editor: press bare ground and you **paint**; press a piece and you
**carry** it. A press that does not move is a **tap**, which turns a conveyor.

One vocabulary, no modes, no tool switching for the commonest actions. There is
no "select tool" step, because the thing under the finger already says what the
gesture means. This is the pattern that made the editor usable by a five-year-old
who had never been shown it.

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
  it is picked up.

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
