# Guards — testing the rule instead of the pixel

## The approach

jsdom has no layout engine, so nothing can measure a box. Asserting that the
rocket is the right size is not available.

What works instead: **scrape the built CSS and assert invariants over it.**
These have caught more real bugs than any assertion about the DOM, because they
check the *class* of mistake rather than one instance of it.

## The invariants

| Guard | What it catches |
|---|---|
| every element carrying `--x` is matched by a rule that sizes it | a new board element left out of the sizing list — the rocket at five times scale |
| no two `@keyframes` share a name | treads running the practice-tile dice animation, 20×/second |
| no board **kind** is styled bare | `.cog {}` turning a shop part into a 22px spinning disc on the board |
| no selector is defined twice | a stale block surviving an edit — the cheese moon's stale palette |
| every theme has a palette | a world half-added: in the `THEMES` union, invisible in the stylesheet |
| exactly two font faces, no legacy `.woff` | the font payload silently doubling |
| the built file contains no non-`data:` URL | *it works on a plane* — an external asset, a CDN font, an analytics snippet |

That last one is the enforcement behind the second rule in `CLAUDE.md`, and it
is the reason a feature that needs a network call cannot be added by accident.

## The empty-sample rule

**A check that can pass on an empty sample eventually will**, and it will look
like coverage while providing none.

The board-sizing guard read the DOM once, at the end of a suite that ends in the
editor, where there is no board. It checked nothing for its entire existence and
reported `(0 checked)` on every run, in a line that said `ok`. Nobody read the
number, because the word was there.

So, from `CLAUDE.md`, and it applies to every check anybody adds here:

> If a check scrapes for its subjects, it must assert it found some. Put the
> count in the label and **make the count itself an assertion**.

`checkBoardSizing()` emits `board elements were sampled at all (18 kinds)` before
it emits the guard, and the first one fails if the sample is empty.

## Where this approach runs out

Some claims are asserted as literal values in the built file — "the fins are
pulled down past the flame overhang" is a regex for `bottom:-6%`.

Those catch **deletion, not wrongness**, and they must be re-tuned by hand every
time the value is. There are about a dozen. They are worth keeping and worth
being honest about: a check that can only notice a rule vanishing is half a
check. Replacing them needs something that can see, and what that is in a repo
with no external assets is an open thread (`NOTES.md`, `BOARD.md` [R-020]).

## The docs are checked too

`src/docs.test.ts` treats the documentation tree as a structure, because an
index that has drifted from the tree is worse than no index — it is read as
authoritative and quietly sends you to a page that moved. It checks three things
that rot silently:

- every markdown path written down anywhere resolves
- every cluster page indexes its own tree
- no content page has crept into the `MEMORY.md` index

It judges no prose, and it carries the same sample-size assertion as everything
else here: a run that found no pages to check is a failure.

## Where to go instead

- The conventions these guards defend:
  [`../code/conventions.md`](../code/conventions.md).
- Where they live and what they are written against:
  [`harness.md`](harness.md).
- The method lessons behind them, each with its incident: `META.md`.
