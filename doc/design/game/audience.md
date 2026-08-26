# The audience — children who cannot read

Children of about four to seven. Specifically: **children who cannot read.**

That is not a style choice, it is the design brief, and almost every decision in
this codebase follows from it.

## What it forbids

- **No text anywhere in the game loop.** Not on the buttons, not in the
  feedback, not in the failure states. Names appear on room tiles and in the
  header, where an adult reading over a shoulder will use them and a child will
  slowly learn to recognise the shape of a word.
- **No bookkeeping.** No reset button, no validate button, no confirm dialog. A
  child should never be asked to maintain the game's state on the game's behalf.
- **Nothing destroyed by a mistake.** A failed run costs one tap to fix. Nothing
  is scored, nothing is lost, nothing is taken away.
- **No reading-shaped substitutes either.** An icon that only means what it
  means if you already know the word is text with extra steps.

## What it requires

Every state has to be **legible as motion or colour**:

- "Wrong" is a lunge into a wall and a pulsing ring on the slot that authorised
  it — the ring stays, so the plan and the blame are on screen together.
- "I don't know where to go" is a head tilt and a question mark.
- "I still need this" is a thought bubble with a greyed-out battery in it, which
  ticks off the moment the thing is picked up.

**Sound carries meaning, not atmosphere.** Each direction has its own pitch, so
the tray is learnable by ear before it is learnable by symbol.

**Targets are large and failure is cheap.** Both follow from the same fact: a
four-year-old's aim and a four-year-old's patience are the two budgets that run
out first.

## The rotation constraint

Arrows are **absolute** — up, right, down, left — rather than turn-left and
turn-right. Mental rotation mostly is not there before six, and a
relative-turn vocabulary asks for it on every single instruction. This was
settled before a line of code was written and has never been revisited.

Auto-pickup follows from the same argument: adding a *grab* command would put a
non-directional token in a vocabulary that is otherwise purely directional, and
the tray's whole legibility comes from every token being a direction.

## The second audience

The adult sitting next to them. That is who the room names, the level select,
the workshop prices and these documents are for. It is a real audience with real
requirements — an adult needs to know where they are in the game and what a
thing costs — and the design serves it *only* in places a child does not need to
look. Names are on tiles and bars. They are never in the loop.

## Where to go instead

- What the child is learning while all this is withheld:
  [`thesis.md`](thesis.md).
- How motion and colour actually carry it: [`../feel.md`](../feel.md), in
  particular [`../feel/visual-language.md`](../feel/visual-language.md).
- The one session where a child met it: [`playtest.md`](playtest.md).
