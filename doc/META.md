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
exactly as written; `height: 82%` was resolving against an auto-sized *grid row*,
so the numbers meant nothing. Find the containing block first — one lookup, and
it ends the hunt.

**Ask what the runtime swallowed. Silence from a test is not evidence.**
Twice, jsdom ate what mattered. It hides uncaught errors in its own console, so a
suite passes in full while the app throws on every frame (the harness collects
them now). And without a Web Animations shim, out-transitions never finished, so
removed screens were never unmounted — and the throw from `Element.animate`
aborted the effect queue, making **every particle effect untestable**, silently.
Before trusting a green run, know what the environment is allowed to eat.

## Verification

**Do not author a par. Ask the solver, then assert it.**
A hand-written par was wrong: the battery tile becomes a corner once the bridge
behind it collapses, and the solver said 4 where the author said 3, before any
pixels existed. Every par is derived on every run because of that afternoon.
**If a judgement can be computed, computing it once beats being right about it
repeatedly.**

**Prove a mechanic matters by taking it away.**
Generator acceptance went 55% → 17% once candidates were solved *twice* — as
built, and with the world's mechanic disabled — and rejected unless the answer
changed. Difference, not direction: decoys removed shortens par, a blocked
passage opened lengthens it, and either way the mechanic was load-bearing.
**A feature you cannot switch off cannot be shown to do anything.**

**The four ways a green check is lying, each of which has happened here.**

- **It sampled nothing.** The board-sizing guard read the DOM once, at the end,
  and the fast suite ends in the editor where there is no board — so it checked
  *nothing* for its whole life, saying `(0 checked)` every run under a line that
  read `ok`. Sample on every navigation, and **assert the count**.
- **Its yardstick is its subject.** The legend round-trip shares the table with
  both halves, so any *consistent* relabelling passes. Swapping `E` and `W` was
  planted and it **passed**, while failing twenty tests elsewhere. What proved
  the meaning was the solver re-deriving every par.
- **It only runs one way.** The rule-to-code cross-reference caught stale
  stylesheet rules. Run the other way — every class the *code* writes must have
  a rule — it found `.spark` immediately: eight particles spawned on every
  pickup, styled by nothing, in every commit the game ever had. One line each.
- **It only catches deletion.** `bottom:-6%` asserted as a literal catches the
  rule going away, not the rule being wrong. Worth keeping, worth labelling; not
  a guarantee.

The defence against all four is one cheap habit: **plant the fault.** Two checks
written the same afternoon passed on the very fault they were written for — the
minimap one counted marks the parts on the floor were still supplying, so a room
whose conveyors had stopped being drawn still scored five. Both had been
written, run, and seen to say `ok`. Plant on a committed tree or with a copy
beside you: a `git checkout` meant as an undo once took an uncommitted rewrite
of `Editor.svelte` with it, because the plant sat on top of the work it tested.

**The bug lives in the dimension the harness holds still.**
One reported glitch survived a sweep of all 41 rooms at their par, wrong
programs, reduced motion, replay and the endless room — every run clean, because
every run held the viewport still, and the fault was in *resizing*. A second
survived sampling every painted frame at 20x CPU throttle, because the fault was
a timer race that clean timers win. **List what the harness never varies before
calling a symptom unreproducible**; a green sweep is evidence about the axis you
moved, not about the one you did not.

**Two clocks written as the same constant will collide.**
Twice, a day apart. The robot's walk was 380ms and his frame was held 380ms, so
every step finished at the instant the next began; on a four-tile run bought by
one instruction that race ran four times, and a transition that loses it restarts
from where it began — a tile backwards and a snap forward. Then the rocket's cue
was scheduled at 900ms and the camera's push-in *was* 900ms, so audio synthesis
landed on the frame a scale animation settles, which is the frame it re-rasters
on. Neither reproduced in a headless browser, whose timers are clean and whose
GPU is absent. **A margin between two clocks has to be stated and checked; equal
constants are a collision waiting for a slower machine.**

**A two-minute check is one nobody runs.**
The smoke suite was one suite until step frames and a 2.6s celebration took it
past two minutes — at which point it stopped being run during work and started
being run before pushing, the wrong end. Split on a rule needing no judgement:
**if it needs the robot to finish a run, it belongs in the full suite.**

## Design

**End a category; do not police it.**
Seven name collisions before this was acted on, and guards fire *after* the
mistake. Board kinds were element classes, so `.cog {}` landed on the board
whether you meant it or not. The fix was one 47-line module (`src/view/css.ts`)
making the wrong thing *impossible to write*; the guards stayed on as a net.

The seventh collision was found by doing the sixth's fix, and the new guard's
first version asserted *every* class was prefixed — which failed on a legitimate
hand-written variant. **A guard that needs an allowlist is stating the wrong
invariant.**

**The unit that makes special cases disappear is the one to build on.**
Rooms a child built are assembled at runtime into a `Chapter` like any other, so
the level select, minimaps, pips, playing and the next button all work on them
with no special cases. That was not the motivation for `Chapter`, it was the
consequence. Follow decisions downstream before defending them.

**A boundary can guarantee what discipline only promises.**
Funke cannot affect the game, and not because nobody wired her in: the engine has
never heard of her. She trails one frame behind by reading the same trace, so she
cannot desync. Look for the boundary that makes breaking a rule impossible, not
the review that would notice.

## Bookkeeping

**A document that needs two disciplines is two documents.**
Twice in one day. `HANDOFF.md` held durable truth, method lessons, open questions
and work-to-do at once, so no update could be made without re-reading the other
three. Then `LOG.md` turned out to be a worklog sitting on a narrative history —
one appended to, the other *rewritten* as it ages. **The tell is a maintenance
rule stated twice with different verbs for different parts of one file.**

**An archive that duplicates git is not worth its drift.**
Fold an overflowing log into the arc it belongs to and delete it. Nothing is lost
— git has it twice over — and what git cannot give cheaply *is* the arc: it hands
you commits rather than periods, changes rather than changes of mind. A handover
kept "as a record" was deleted the next session anyway, leaving three wrong facts.

**Editing by string splice leaves the old block behind, and later wins.**
Three times a replacement landed beside the block it meant to replace, and being
later in the cascade the stale one won — so the "fix" never rendered. The cheese
moon shipped a stale palette that way; the duplicate-selector check exists
because of it.

**A document that describes the tree lies within about a month.**
The handover said six stylesheets (eight), four worlds (five ship), `Board.svelte`
at ~500 lines (584 by then). So counts a reader would act on live in
`doc/MEMORY.md`, and `src/doc.test.ts` checks the part a test *can*. **Prose about
a tree is a claim with no owner unless something fails when it stops being true.**

**Write the log entry as if the next session has no context**, because it does
not. The entries that proved useful recorded *why a thing was rejected*, not what
was built — the build is in the diff.
