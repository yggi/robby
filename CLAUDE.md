# CLAUDE.md — agent entrypoint

`robby` — Robby & Funke, a programming puzzle game for children who cannot read
yet. One self-contained HTML file, no server, no network, no accounts.

This file is the contract for how to work in this repo. It is short on purpose.
Everything else lives in `doc/`, in surfaces that each have one job, a target
size, and a line where they get condensed.

**The repository root holds this file, `README.md` and configuration.** Those
two are the entrypoints for a reader who has not been told where to look — this
one is found by the agent, that one by GitHub. Every other document is in
`doc/`, for readers who have been told.

## Read order (every session, before touching anything)

1. `CLAUDE.md` — this file. Rules of engagement.
2. `doc/MEMORY.md` — what the project *is*. Crystallized, durable, and the
   index to `doc/design/`'s four clusters — **game**, **feel**, **code**,
   **testing**. Each cluster page indexes its own tree and cross-links the
   siblings, so a subject is found by walking two hops, not by scanning one
   long list.
3. `doc/META.md` — how the work *goes*. Method lessons and meta-patterns, each
   with the scar that earned it. Short. Read it; it is cheaper than re-earning
   them.
4. `doc/NOTES.md` — what is *unresolved right now*. Open threads only.
5. `doc/BOARD.md` — what to *do next*. Cards in doing / ready / backlog.

`doc/HISTORY.md` is the arc — read it once when you are new, or when a decision
looks arbitrary and you want to know what it cost. `doc/LOG.md` is the detail
behind the last few weeks of it; read that only when you need to know why X was
done or what was tried. **Neither is context by default.**

## Write order (before ending a session)

1. `doc/LOG.md` — append what you actually did and closed. Newest first. When
   it is over its line, fold its oldest sessions into `doc/HISTORY.md` rather
   than moving them anywhere.
2. `doc/BOARD.md` — move cards, add cards you discovered. Trim history.
3. `doc/NOTES.md` — delete threads you closed, add threads you opened.
4. `doc/MEMORY.md` — only if something became *durably true*. Rare. Deliberate.
5. `doc/META.md` — only when the work taught you something about *working*, and
   it cost something to learn. Rarer still.

## Gates — what makes a change finished

Not a checklist to feel good about. Four conditions, each of which has been
failed here before, and each of which is cheap to check and expensive to miss.

**1. The suites are green, and you ran them.** `npm test` for anything, plus
`npm run test:full` if the change can affect a run playing through. CI runs
`npm run check:full`; finding out there is what the log is for. **Print the
number rather than estimating it** — a gate you do not check is not a gate.

**2. The surfaces moved.** A change that touches code and leaves `doc/` alone
is incomplete. The minimum is a `doc/LOG.md` entry; anything that closed or
opened work also touches `doc/BOARD.md` and `doc/NOTES.md`.

**3. Nothing new is unverifiable.** If the change adds a rule, a claim about
appearance, or a fact about the tree, something has to fail when it stops being
true. If it adds a check, **the check must be able to fail** — plant the fault
and watch it — and if the check scrapes for its subjects, it must assert it
found some, with the count in the label. See the `(0 checked)` incident in
`doc/META.md`.

**4. It still works on a plane.** No secrets, no accounts, no network calls, no
analytics, no external assets. The build is verified to contain zero non-`data:`
URLs; do not be the change that needs that check relaxed.

## The surfaces

| File | Holds | Never holds | Target |
|---|---|---|---|
| `doc/MEMORY.md` | durable facts, decisions, structure, conventions | tasks, status, speculation | 300 lines |
| `doc/HISTORY.md` | the arc — decisions, reversals, what each cost | this session's detail | 250 lines |
| `doc/META.md` | method lessons, each with its incident | project facts, tasks | 150 lines |
| `doc/NOTES.md` | open, uncrystallized threads | anything settled, anything actionable-as-a-task | 100 lines |
| `doc/BOARD.md` | task cards | rationale, narrative | see below |
| `doc/LOG.md` | append-only worklog, closed cards | plans, open questions | 1000 lines |

### Target, and the line where you act

The number above is the **target** — the size the surface should sit at. You act
when it is **20% over**, and not before:

| | target | act at |
|---|---|---|
| `doc/MEMORY.md` | 300 | 360 |
| `doc/HISTORY.md` | 250 | 300 |
| `doc/META.md` | 150 | 180 |
| `doc/NOTES.md` | 100 | 120 |
| `doc/LOG.md` | 1000 | 1200 |
| `doc/BOARD.md` | doing 3 · ready 10 · backlog 40 · history 10 | 4 · 12 · 48 · 12 |

**The band exists to stop line-shaving.** A hard limit at the target buys the
wrong work: a surface one line over gets a sentence reflowed and a word deleted,
and nothing is condensed, because nothing *needed* condensing.

So: below the target, add freely. Between target and the line, you are on notice
— write what the work needs and let it sit. At the line, **condense back to the
target or below, in one deliberate pass**. Not to the line: a trim that lands at
359 has bought one line of room and you will be back next session.

`HISTORY.md`'s target sits below `MEMORY.md`'s on purpose. Current truth
outranks how it was arrived at, so the arc may never be the longest thing here.

### How each one is handled when it is time

- **MEMORY.md** → spill the fattest section into the cluster it belongs to and
  leave a one-line entry in the index. The index names **cluster pages**, never
  content pages; that is the whole reason the cluster layer exists.
- **HISTORY.md** → the older sections have gone fine-grained. A month becomes a
  section, a quarter a paragraph, a year a line. It has to converge; if it does
  not, it is being appended to rather than rewritten.
- **META.md** → entries have gone abstract. Merge or cut; an entry that has lost
  the incident that earned it has probably stopped being true.
- **NOTES.md** → threads have gone stale. Each one either crystallizes into
  MEMORY, becomes a BOARD card, or gets deleted. Nothing else.
- **BOARD.md** → history past its target moves to `doc/LOG.md`; ready past its
  target means something goes back to backlog, not that ready is bigger now.
- **LOG.md** → **fold** the oldest sessions into the paragraph of
  `doc/HISTORY.md` they belong to, and delete them. Not moved intact: a
  verbatim archive is what git already is, and what git cannot give you cheaply
  is the arc — it hands you commits rather than periods, and changes rather than
  changes of mind.

Never let a surface grow past the line to avoid the work. Condensing *is* the
work.

`src/doc.test.ts` checks the shape, not the prose: every cluster page indexes
its own tree, no content page creeps into the MEMORY index, and every markdown
path written down anywhere resolves. It runs in `npm test`. `doc/LOG.md` is
exempt from path resolution because it is append-only and records paths that
were correct when written; `doc/HISTORY.md` is **not** exempt, because it is
rewritten rather than appended to.

## The two rules that outrank everything else

**Ask the solver.** `solve(level, maxDepth)` returns the shortest program that
wins a level, or `null`. Every par in the game is derived from it and re-derived
on every test run; the generator judges rooms with it; the editor runs it live.
If you are about to write something that decides whether a level is any good,
you are about to duplicate it badly. Ask it instead.
→ `doc/design/code/solver.md`

**It works on a plane.** No secrets, no accounts, no network calls, no
analytics, no external assets. This is a children's game that runs from a phone
with no signal. Keep it that way.

## Guiding principles (the reason the code exists)

These decide design arguments. If a change makes one weaker, say so out loud.

1. **The player cannot read.** Not a constraint to design around — the design
   brief itself. No text in the game loop, ever. Meaning arrives as motion,
   colour and sound, or it does not arrive. → `doc/design/game/audience.md`
2. **Show the gap between the plan and what the plan did.** You write, then you
   watch. Everything that makes that gap more visible is the game; everything
   that hides it is decoration. → `doc/design/game/thesis.md`
3. **Failure is diagnostic, never punitive.** Nothing is destroyed by a mistake,
   nothing is scored, and a wrong run costs one tap to fix.
4. **The solver is the quality bar**, not taste. A level is good if the solver
   says its mechanic is load-bearing.
5. **The engine cannot see the view.** Rules are pure and testable in
   milliseconds; time, easing and pixels live on the other side of the trace.
   This is what makes the solver, the generator and the editor all correct for
   free. → `doc/design/code/architecture.md`
6. **Two visual languages, held apart.** The world is illustrative and changes
   completely between chapters; the console is matte, geometric and identical
   forever. The composition depends on the contrast.
   → `doc/design/feel/visual-language.md`

## Working rules

- Scope down before you scope out. Prefer a thin vertical slice that runs over a
  broad layer that does not.
- Uncertain about intent? Put it in `doc/NOTES.md` as a thread and keep going
  on the parts that do not depend on it. Do not silently pick and bury the
  choice.
- Do not edit by string splice. Three separate times a replacement landed beside
  the block it was meant to replace, and being later in the cascade the stale
  one won — so the fix never rendered.

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

Directory-level intent lives in `doc/MEMORY.md` § Repo map. Keep it there, not
here.
