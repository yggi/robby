# The harness — the real artefact, in jsdom

`test/harness.mjs` (193 lines) boots the real built artefact in jsdom and
exports the vocabulary the suites are written in: `$`, `$$`, `check`, `raw`,
`tok`, `until`, `wait`, `window`, `report`, `errors`, `sweepBoard`,
`checkBoardSizing`.

It drives `dist/index.html` — the same file that gets published — which is why
the bundle is an IIFE: jsdom does not execute module scripts
([`../code/stack.md`](../code/stack.md)).

Two things in there are not obvious, and both were learnt the hard way.

## A Web Animations shim that runs real timing

Without it, Svelte's out-transitions never finish. Outgoing screens are
therefore never unmounted, and selectors silently pick up **stale copies of
removed screens** — a test that passes while looking at the wrong screen, which
is the worst available failure mode.

Worse, before the shim existed the throw from `Element.animate` aborted the
effect queue, which meant **every particle effect in the game was untestable.**
Nothing said so. The suite was green.

The general lesson is in `META.md`: silence from a test is not evidence, and a
missing environment capability can take out a whole subsystem's testability
without producing a single failure.

## An uncaught-error collector

**jsdom hides uncaught errors in its own console.** A suite can pass in full
while the app throws on every frame.

The harness collects them and exposes `errors`, and the report fails if any
arrived. Before trusting a green run, know what the environment is allowed to
eat silently.

## `sweepBoard()` / `checkBoardSizing()`

The board-sizing guard used to read `.board [style*="--x"]` once, at the end of
the fast suite. The fast suite ends in the editor, where there is no board — so
it had been checking nothing for as long as it had existed, and saying so on
every run in a cheerfully passing line reading `(0 checked)`.

It now lives in the harness: `sweepBoard()` is called on **every navigation**,
accumulating whatever board elements are up at the time, and
`checkBoardSizing()` asserts over everything seen, at the end. It emits two
checks, and the first one is the important one:

```
ok    board elements were sampled at all (18 kinds)
ok    every board element is sized to one tile (18 checked)
```

**An empty sample is a failure**, not a pass. This is the incident behind the
rule in `CLAUDE.md`, and the general form is in [`guards.md`](guards.md).

## Writing a suite against it

- `check(label, condition)` — the label is read by a human scanning output, so
  it should say what is true, not what is being measured. Put counts in it.
- `until(fn)` / `wait(ms)` — for anything the view schedules. If you find
  yourself waiting for a run to finish, your check belongs in the full suite
  ([`layers.md`](layers.md)).
- `raw` — the built file as text. This is how the CSS invariants are asserted.
- `tok` — placing arrows in the tray, which is most of what driving the game
  consists of.

## Where to go instead

- Which suite a new check belongs in: [`layers.md`](layers.md).
- What is asserted over `raw`: [`guards.md`](guards.md).
- The conventions those assertions protect:
  [`../code/conventions.md`](../code/conventions.md).
