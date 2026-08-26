# Robby and Funke

## Robby is the constant

He is never re-themed. The world changes around him, and he does not, which is
what makes four different places feel like one journey.

**Unpowered** he slumps five degrees, his antenna droops flat, and his eyes are
grey half-lidded slits that blink slowly. **When he reaches the battery** the
gauge in his chest fills left to right in the battery's own orange, and his eyes
take that same colour.

*The colour he gains is literally the colour he absorbed.* Nothing has to be
written down, and nothing is. This is the single clearest example of the rule
from [`../game/audience.md`](../game/audience.md): a state change carried by
colour, understood without a word, by a child who cannot read one.

His other states are equally literal: a head tilt and a question mark for "I do
not know where to go", a thought bubble holding a greyed-out battery for "I
still need this", ticked off the moment it is picked up.

## Funke is pure companion, and the architecture guarantees it

**The engine has never heard of her.** She cannot change an outcome, and the
reason is not that nobody wired her in — it is that there is nothing to wire her
into. See [`../code/architecture.md`](../code/architecture.md).

She trails one frame behind Robby: **literally, her tile is where he was on the
previous frame**, derived from the same trace. So she cannot desync, cannot
overtake, cannot get stuck, and needs no pathfinding at all. One line of
derivation replaces an entire subsystem, and it replaces it with something that
cannot go wrong.

When idle she explores by breadth-first search, walking real routes a tile at a
time — she never floats, and she never walks through a wall.

She reacts to everything:

- startled by a bonk, tail bristling
- head-tilted at a shrug
- on a win she bounces in **counter-phase** with Robby — when he is up, she is
  down

That counter-phase is what makes a win read as a duet rather than a cat
upstaging a robot. It is one sign flip and it decides who the moment belongs to.

## What each is for

Robby is the **subject**: he is what your plan happens to, and every one of his
states is a readout of the run. Funke is the **audience**: she is what your plan
happens *near*, and every one of her states is a reaction to it.

That division is worth protecting. A Funke who helps — who fetches, who warns,
who nudges — would be a second subject, and the child would have two things to
reason about in a game whose whole subject is one list of arrows. She is allowed
to be delighted and startled and bored. She is not allowed to be useful.

## Where to go instead

- The idle cycles and the celebration flourishes:
  [`motion-and-sound.md`](motion-and-sound.md).
- Why the trace makes the one-frame trail free:
  [`../code/architecture.md`](../code/architecture.md).
- The colours they are drawn in: [`visual-language.md`](visual-language.md).
