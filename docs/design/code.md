# The code — the split, the solver, the stack, and the rules bought with bugs

Start here before writing anything. Two of these pages are the decisions the
whole codebase rests on; one is why the tools are what they are; the last is a
list of constraints you do not get to relax on a tired afternoon.

## Pages

| | |
|---|---|
| [`code/architecture.md`](code/architecture.md) | the engine/view split, the `Trace`, the one store, and the repo map |
| [`code/solver.md`](code/solver.md) | `solve()` as a component rather than a dev tool, and the load-bearing test |
| [`code/stack.md`](code/stack.md) | Svelte 5, the single-file build, why it is an IIFE, and how a branch gets published |
| [`code/conventions.md`](code/conventions.md) | the narrower rules, each carrying the bug that bought it — do not invent one here in advance |

## Where to go instead

- Lessons about **how the work goes** rather than how the code is written are in
  `docs/META.md` — an entry there carries the incident that earned it.
- How any of this is verified: [`testing.md`](testing.md).
- What is being built next, as cards, is `docs/BOARD.md`. What is unresolved is
  `docs/NOTES.md`.

## The shape of it

Two sentences hold this cluster together.

**The engine cannot see the view.** Rules are pure, have no timing, and return a
`Trace`; the view replays it and owns every millisecond. That is what makes the
solver, the generator and the editor correct for free, and it is the decision
that carried the project.

**Every convention here was bought with a bug.** Nothing in
[`code/conventions.md`](code/conventions.md) is there because it seemed tidy.
The sizing rule exists because a rocket rendered five times too large; the
duplicate-selector check exists because a stale palette shipped; the
one-attribute theme rule exists because the editor silently got no colours.
A rule in this cluster that does not name what it cost is a rule about to be
broken.
