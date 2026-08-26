# The three layers, and the rule that divides them

| Suite | What it covers | Time |
|---|---|---|
| `npm run test:unit` | the engine, the solver, **every par**, the generator, the editor model | ~5s |
| `npm test` | the above, plus a build, plus the fast smoke suite (142 checks) | ~15s |
| `npm run test:full` | plays levels through: celebrations, world transitions, the shop | ~2min |

`npm run check:full` is all of it, ~2.5min, and is what CI runs.

## The dividing rule

Written into the fast suite, and applicable without judgement:

> **If it needs the robot to finish a run, it belongs in the full suite.**

Waiting out step frames and a 2.6-second celebration is what took the old single
suite to two minutes, **and a two-minute check is one nobody runs.** It stopped
being run during work and started being run before pushing, which is the wrong
end of the process — the whole value of a fast check is that it is cheap enough
to run on a thought.

The fast suite is ~15s and gets run constantly. That is the only property that
matters about it, and it is worth protecting: a check that would add three
seconds to the fast suite should go in the full one instead, even if it fits the
rule.

## What the unit suite does that is unusual

**It re-derives every par in the game on every run.** No par in `levels.ts` was
authored; each is asserted minimal by `solve()`. A level whose par is wrong — or
whose map changed in a way that changes the shortest program — fails in five
seconds, without a browser ([`../code/solver.md`](../code/solver.md)).

It also runs the generator and asserts its rooms pass the load-bearing filter,
and it exercises the editor model directly, including `assess()`'s
completeness check — the one that stops an empty draft solving at par 0.

## What the smoke suites do

They boot **the real built `dist/index.html`** in jsdom and drive it: click
through the menu, open worlds, play rooms, buy parts, build in the editor. The
fast suite ends in the editor; the full one plays levels to completion and
watches what happens afterwards.

They are `.mjs`, not Vitest, and they run through `test/run-smoke.mjs` — which
gives each suite a hard timeout and **exactly one retry**, and says plainly when
a pass came from the retry rather than laundering flakiness into green.

That last detail is the point of having a runner at all. A retry that is
invisible converts an intermittent failure into a permanently green suite that
is lying to you.

## Where to go instead

- What is inside the harness they run on:
  [`harness.md`](harness.md).
- The CSS invariants asserted at the end of the fast suite:
  [`guards.md`](guards.md).
- The build the suites drive: [`../code/stack.md`](../code/stack.md).
