# META.md — how the work goes

Durable lessons about **method**, not about the game. `doc/MEMORY.md` is what the
project *is*; this is what building it has taught us about building it.

Every entry names the incident that earned it. An abstract rule nobody paid for
is advice; a rule with a scar is a lesson. An entry that has lost its incident
has probably stopped being true.

**Target: 150 lines, act at 180** (`CLAUDE.md`). At 180 the entries have gone
abstract — merge or cut, back to 150 or below in one pass.

---

## Diagnosis

**When a number is ignored, check what it means before changing it.**
The rocket sat wrong through two rounds of nudging percentages. The CSS applied
exactly as written; `height: 82%` was resolving against an auto-sized *grid
row*, so the numbers meant nothing. If a percentage seems ignored, find its
containing block first — one lookup, and it ends the hunt.

**Ask what the runtime swallowed. Silence from a test is not evidence.**
Twice, jsdom ate what mattered. It hides uncaught errors in its own console, so
a suite passes in full while the app throws on every frame — the harness
collects them now (`errors`). And without a Web Animations shim, Svelte's
out-transitions never finished, so removed screens were never unmounted and
selectors picked up stale copies; worse, the throw from `Element.animate`
aborted the effect queue, making **every particle effect in the game
untestable**, with nothing saying so. Before trusting a green run, know what the
environment is allowed to eat.

## Verification

**Do not author a par. Ask the solver, then assert it.**
A hand-written par for the return-trip level was wrong: the battery tile becomes
a corner once the bridge behind it collapses, and the solver said 4 where the
author said 3 — before any pixels existed. Every par is derived and re-derived
on every run because of that afternoon. **If a judgement can be computed,
computing it once beats being right about it repeatedly.**

**Prove a mechanic matters by taking it away.**
Generator acceptance went from 55% to 17% when candidates started being solved
*twice* — as built, and with the world's mechanic disabled — and rejected unless
the answer changed. Difference, not direction: decoys removed shortens par, a
blocked passage opened lengthens it, and both mean the mechanic was load-bearing.
It would have caught both hand-built levels where a mechanic turned out to be
bypassable. **A feature you cannot switch off cannot be shown to do anything.**

**The four ways a green check is lying, each of which has happened here.**

- **It sampled nothing.** The board-sizing guard read the DOM once, at the end,
  and the fast suite ends in the editor where there is no board — so it checked
  *nothing* for its whole life, announcing it every run as `(0 checked)`, which
  went unread because the line said `ok`. Fix: sample on every navigation, put
  the count in the label, and **assert the count**.
- **Its yardstick is its subject.** The legend round-trip — parse every map,
  write it back, compare — shares the table with both halves, so any *consistent*
  relabelling passes. Swapping `E` and `W` was planted and it **passed**, while
  failing twenty tests elsewhere. What proved the meaning was the solver
  re-deriving every par.
- **It only runs one way.** The rule-to-code cross-reference was written to catch
  a stale stylesheet rule. Run the other way — every class the *code* writes must
  have a rule — it immediately found `.spark`: eight particles spawned on every
  pickup, and no `.spark` rule in any commit the repository has ever had.
  Invisible for the whole life of the game. Each direction is one line.
- **It only catches deletion.** "The fins are pulled down past the flame
  overhang" is `bottom:-6%` asserted as a literal: it catches the rule going
  away, not the rule being wrong. Worth keeping and worth labelling; not a
  guarantee.

The defence against all four is one cheap habit: **plant the fault.** Two checks
written the same afternoon passed on the very fault they were written for — the
minimap one counted marks the parts on the floor were still supplying, so a room
whose conveyors had stopped being drawn still scored five. Both had been
written, run, and seen to say `ok`.

**A two-minute check is one nobody runs.**
The smoke suite was one suite until step frames and a 2.6s celebration took it
past two minutes, at which point it stopped being run during work and started
being run before pushing — the wrong end. Split on a rule needing no judgement:
**if it needs the robot to finish a run, it belongs in the full suite.** The
fast one is ~15s and gets run constantly, the only property that matters.

## Design

**End a category; do not police it.**
Seven name collisions before this was acted on, and the guards that caught them
are guards — they fire after the mistake. Board kinds became element classes, so
`.cog {}` landed on the board whether you meant it or not, and no care removed
the hazard. The fix was one 47-line module (`src/view/css.ts`) making the wrong
thing *impossible to write*: a name the engine owns reaches the DOM only through
`kindCls`, namespaced. The guards stayed on as a net, which costs nothing.

Two things about the shape of it. **The seventh collision was found by doing the
sixth's fix** — the refactor collected every particle class name into one file,
and `.star` was visible the moment they sat together. And the first version of
the new guard asserted *every* class was prefixed, which failed on a legitimate
hand-written variant: **a guard that needs an allowlist is usually stating the
wrong invariant**, and the exceptions are the tell.

**The unit that makes special cases disappear is the one to build on.**
Rooms a child built are assembled at runtime into a `Chapter` like any other,
and so the level select, minimaps, pips, playing and the next button all work on
them with no special cases at all. That was not the motivation for `Chapter`; it
was the consequence. Follow decisions downstream before defending them.

**A boundary can guarantee what discipline only promises.**
Funke cannot affect the game, and not because nobody wired her in: the engine
has never heard of her. She trails one frame behind Robby by reading the same
trace, so she cannot desync and needs no pathfinding either. When a rule matters,
look for the boundary that makes breaking it impossible, not the review that
would notice.

## Bookkeeping

**A document that needs two disciplines is two documents.**
Twice in one day. `HANDOFF.md` held durable truth, method lessons, open
questions and work-to-do at once, so there was nowhere to put an update that did
not mean re-reading the other three. Then `LOG.md` turned out to be a dated
worklog sitting on a narrative history: one is appended to and never touched
again, the other must be *rewritten* as it ages. Neither was badly written; both
were unmaintainable for the same structural reason. **The tell is a maintenance
rule stated twice with different verbs for different parts of one file.**

**An archive that duplicates git is not worth its drift.**
Fold an overflowing log into the arc it belongs to and delete it. Nothing is
lost — it is in git twice over — and what git cannot give you cheaply *is* the
arc, because it hands you commits rather than periods, and changes rather than
changes of mind. This bit immediately: a handover kept "as a record" was deleted
the next session, everything unique in it having been given an owner, leaving
three wrong facts and a second place to look.

**Editing by string splice leaves the old block behind, and later wins.**
Three separate times a replacement landed beside the block it was meant to
replace — and being later in the cascade, the stale one won, so the "fix" never
rendered. The cheese moon shipped a stale palette that way; the
duplicate-selector check exists because of it.

**A document that describes the tree lies within about a month.**
The handover said six stylesheets (eight), four worlds (five ship), and
`Board.svelte` at ~500 lines (584 by then). Not carelessness: the tree moved and
the prose did not. So the counts a reader would act on live in `doc/MEMORY.md`,
read every session, and `src/doc.test.ts` checks the part a test *can* — every
path written down resolves, and the index matches the tree. **Prose about a tree
is a claim with no owner unless something fails when it stops being true.**

**Write the log entry as if the next session has no context**, because it does
not. The entries that proved useful later recorded *why a thing was rejected*,
not what was built — the build is in the diff.
