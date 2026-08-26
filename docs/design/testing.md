# Testing — three layers, a real artefact, and things that cannot be seen

The engine is tested the easy way: it is pure, so it is tested in milliseconds
without a browser. Everything interesting about this cluster is about the other
half — how you check a game whose entire vocabulary is motion and colour, in an
environment with no layout engine.

## Pages

| | |
|---|---|
| [`testing/layers.md`](testing/layers.md) | the three suites, and the one rule that decides which a check belongs in |
| [`testing/harness.md`](testing/harness.md) | booting the real built artefact in jsdom, and the two things in there that were learnt the hard way |
| [`testing/guards.md`](testing/guards.md) | testing the rule instead of the pixel — the CSS invariants, and the empty-sample rule |

## Where to go instead

- Method lessons about verification — a test that passes either way, a check
  that cannot fail — are in `docs/META.md`, each with its incident.
- The rules being tested: [`game/rules.md`](game/rules.md).
- The conventions the guards enforce:
  [`code/conventions.md`](code/conventions.md).

## The shape of it

Three ideas run through these pages.

**Test the artefact, not a mock of it.** The smoke suites boot the real
`dist/index.html` — the same file that is published — which is why the build
being an IIFE is a testing decision before it is a distribution one.

**Test the rule, not the pixel.** jsdom has no layout engine, so nothing can
measure a box. Scraping the built CSS and asserting invariants over it has
caught more real bugs than any assertion about the DOM.

**A check that can pass on an empty sample eventually will.** This is the
project's most expensive lesson and it is a rule in `CLAUDE.md`: if a check
scrapes for its subjects, it must assert it found some, and the count goes in
the label.
