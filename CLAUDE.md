# CLAUDE.md — agent entrypoint

`robby` — Robby & Funke, a programming puzzle game for children who cannot read
yet. One self-contained HTML file, no server, no network, no accounts.

This file is the contract for how to work in this repo. It is short on purpose.
Everything else lives in the surfaces below, each with a target size and a line
where it gets condensed.

## Read order (every session, before touching anything)

1. `CLAUDE.md` — this file. Rules of engagement.
2. `MEMORY.md` — what the project *is*. Crystallized, durable, and the index to
   `docs/design/`'s four clusters — **game**, **feel**, **code**, **testing**.
   Each cluster page indexes its own handful and cross-links the siblings, so a
   subject is found by walking two hops, not by scanning one long list.
3. `META.md` — how the work *goes*. Method lessons, each with the scar that
   earned it. Short. Read it; it is cheaper than re-earning them.
4. `NOTES.md` — what is *unresolved right now*. Open threads only.
5. `BOARD.md` — what to *do next*. Cards in doing / ready / backlog.

Read `LOG.md` only when you need history (why was X done, what was tried). Do
not read it as context by default. `docs/handoff-2026-08.md` is the handover
this structure was seeded from, kept whole as a record; its live content is in
the surfaces above and it is not maintained.

## Write order (before ending a session)

1. `LOG.md` — append what you actually did and closed. Newest first.
2. `BOARD.md` — move cards, add cards you discovered. Trim history.
3. `NOTES.md` — delete threads you closed, add threads you opened.
4. `MEMORY.md` — only if something became *durably true*. Rare. Deliberate.
5. `META.md` — only when the work taught you something about *working*, and it
   cost something to learn. Rarer still.

A change that touches code and leaves these files untouched is incomplete.

## The surfaces

| File | Holds | Never holds | Target |
|---|---|---|---|
| `MEMORY.md` | durable facts, decisions, structure, conventions | tasks, status, speculation | 300 lines |
| `META.md` | method lessons, each with its incident | project facts, tasks | 150 lines |
| `NOTES.md` | open, uncrystallized threads | anything settled, anything actionable-as-a-task | 100 lines |
| `BOARD.md` | task cards | rationale, narrative | see below |
| `LOG.md` | append-only worklog, closed cards | plans, open questions | 1000 lines |

### Target, and the line where you act

The number above is the **target** — the size the surface should sit at. You act
when it is **20% over**, and not before:

| | target | act at |
|---|---|---|
| `MEMORY.md` | 300 | 360 |
| `META.md` | 150 | 180 |
| `NOTES.md` | 100 | 120 |
| `LOG.md` | 1000 | 1200 |
| `BOARD.md` | doing 3 · ready 10 · backlog 40 · history 10 | 4 · 12 · 48 · 12 |

**The band exists to stop line-shaving.** A hard limit at the target buys the
wrong work: a surface one line over gets a sentence reflowed and a word deleted,
and nothing is condensed, because nothing *needed* condensing.

So: below the target, add freely. Between target and the line, you are on notice
— write what the work needs and let it sit. At the line, **condense back to the
target or below, in one deliberate pass**. Not to the line: a trim that lands at
359 has bought one line of room and you will be back next session.

### How each one is handled when it is time

- **MEMORY.md** → spill the fattest section into the cluster it belongs to and
  leave a one-line entry in the index. The index names **cluster pages**, never
  content pages; that is the whole reason the cluster layer exists.
- **META.md** → entries have gone abstract. Merge or cut; an entry that has lost
  the incident that earned it has probably stopped being true.
- **NOTES.md** → threads have gone stale. Each one either crystallizes into
  MEMORY, becomes a BOARD card, or gets deleted. Nothing else.
- **BOARD.md** → history past its target moves to `LOG.md`; ready past its target
  means something goes back to backlog, not that ready is bigger now.
- **LOG.md** → cut the oldest sections into a `docs/log/` archive and link it.

Never let a surface grow past the line to avoid the work. Condensing *is* the
work.

`src/docs.test.ts` checks the shape, not the prose: every cluster page indexes
its own tree, no content page creeps into the MEMORY index, and every markdown
path written down anywhere resolves. It runs in `npm test`.

## The two rules that outrank everything else

**Ask the solver.** `solve(level, maxDepth)` returns the shortest program that
wins a level, or `null`. Every par in the game is derived from it and re-derived
on every test run; the generator judges rooms with it; the editor runs it live.
If you are about to write something that decides whether a level is any good,
you are about to duplicate it badly. Ask it instead.
→ `docs/design/code/solver.md`

**It works on a plane.** No secrets, no accounts, no network calls, no
analytics, no external assets — the build is verified to contain zero non-`data:`
URLs. This is a children's game that runs from a phone with no signal. Keep it
that way.

## Guiding principles (the reason the code exists)

These decide design arguments. If a change makes one weaker, say so out loud.

1. **The player cannot read.** Not a constraint to design around — the design
   brief itself. No text in the game loop, ever. Meaning arrives as motion,
   colour and sound, or it does not arrive. → `docs/design/game/audience.md`
2. **Show the gap between the plan and what the plan did.** You write, then you
   watch. Everything that makes that gap more visible is the game; everything
   that hides it is decoration. → `docs/design/game/thesis.md`
3. **Failure is diagnostic, never punitive.** Nothing is destroyed by a mistake,
   nothing is scored, and a wrong run costs one tap to fix.
4. **The solver is the quality bar**, not taste. A level is good if the solver
   says its mechanic is load-bearing.
5. **The engine cannot see the view.** Rules are pure and testable in
   milliseconds; time, easing and pixels live on the other side of the trace.
   This is what makes the solver, the generator and the editor all correct for
   free. → `docs/design/code/architecture.md`
6. **Two visual languages, held apart.** The world is illustrative and changes
   completely between chapters; the console is matte, geometric and identical
   forever. The composition depends on the contrast.
   → `docs/design/feel/visual-language.md`

## Working rules

- Scope down before you scope out. Prefer a thin vertical slice that runs over a
  broad layer that does not.
- Uncertain about intent? Put it in `NOTES.md` as a thread and keep going on the
  parts that do not depend on it. Do not silently pick and bury the choice.
- **A check that can pass on an empty sample eventually will**, and it will look
  like coverage while providing none. If a check scrapes for its subjects, it
  must assert it found some, and the count goes in the label. The incident that
  bought this rule is in `META.md`.

## Git

- **Push any branch freely.** Branch, commit, push, iterate.
- **`main` requires explicit instruction**, every time. A standing permission to
  push branches is not permission to push `main`.
- **Pushing a branch publishes it.** `.github/workflows/pages.yml` builds every
  `main` and `claude/**` push and puts it on the web: `main` at the site root,
  every other branch at `/b/<slug>/`. A branch's build is withdrawn when the
  branch is deleted. A push is not a private act — it puts a playable build in
  front of anybody with the link, which is the point of it, and worth knowing
  before pushing something half-finished.

CI runs `npm run check:full`, so a branch that does not pass both suites does
not get published. Run it before pushing rather than finding out in the log.

## Repo map

Directory-level intent lives in `MEMORY.md` § Repo map. Keep it there, not here.
