# META.md — how the work goes

Durable lessons about **method**, not about the game. `doc/MEMORY.md` is what the
project *is*; this is what building it has taught us about building it.

Every entry names the incident that earned it. An abstract rule nobody paid for
is advice; a rule with a scar is a lesson. If an entry loses its incident, it
has probably stopped being true.

**Target: 150 lines, act at 180** (`CLAUDE.md`). At 180 the entries have gone
abstract — merge or cut, back to 150 or below in one pass.

---

## Diagnosis

**When a number is ignored, check what it means before changing it.**
The rocket sat wrong through two full rounds of nudging percentages. The CSS was
applying exactly as written; `height: 82%` was resolving against an auto-sized
*grid row*, so the numbers did not mean anything. Two rounds went into tuning a
value that was never the variable. If a percentage seems to be ignored, find its
containing block first — that is one lookup, and it ends the hunt.

**Ask what the runtime swallowed.**
jsdom hides uncaught errors in its own console, so a smoke suite can pass in
full while the app throws on every frame. The harness collects them now
(`errors`). The general form: before trusting a green run, know what the
environment is allowed to eat silently.

**A missing shim can make a whole subsystem untestable, quietly.**
Svelte's out-transitions never finished in jsdom without a Web Animations shim,
so outgoing screens were never unmounted and selectors picked up stale copies of
removed screens. Worse: the throw from `Element.animate` aborted the effect
queue, which meant **every particle effect in the game was untestable** — and
nothing said so. The suite was green. Silence from a test is not evidence.

## Verification

**Do not author a par. Ask the solver, then assert it.**
A hand-written par for the return-trip level was wrong: the battery tile becomes
a corner once the bridge behind it collapses, and the solver said 4 where the
author said 3 — before any pixels existed. Every par in the game is derived and
re-derived on every run because of that one afternoon. The wider rule: if a
judgement can be computed, computing it once is cheaper than being right about
it repeatedly.

**Prove a mechanic matters by taking it away.**
The generator's acceptance rate went from 55% to 17% when candidates started
being solved *twice* — as built, and with the world's mechanic disabled — and
rejected unless the answer changed. It is difference, not direction: decoys
removed shortens par, a blocked passage opened lengthens it, and both mean the
mechanic was load-bearing. It would have caught, automatically, both hand-built
levels where a mechanic turned out to be bypassable. **A feature you cannot
switch off cannot be shown to be doing anything.**

**A check that can pass on an empty sample eventually will.**
The board-sizing guard read `.board [style*="--x"]` once, at the end of the
suite. The fast suite ends in the editor, where there is no board — so it had
been checking *nothing* for as long as it had existed, and saying so on every
run in a cheerfully passing line reading `(0 checked)`. The number went unread
because the line said `ok`. It lives in the harness now as `sweepBoard()` /
`checkBoardSizing()`: samples are collected on every navigation, asserted at the
end, and **an empty sample is a failure**. Put the count in the label and make
the count itself an assertion.

**A check built on the thing it checks proves agreement, not correctness.**
The legend round-trip — parse every shipped map, write it back, compare — reads
like proof the table is right. It is not: parse and serialise share the table,
so any *consistent* relabelling round-trips perfectly. Swapping `E` and `W` was
planted to find out, and it **passed** while failing twenty tests elsewhere.
What proved the meaning was the solver re-deriving every par. The round trip is
still worth having, and its comment now says which half it holds. Distinct from
the two entries below: not an empty sample, not deletion-only — a check whose
subject and whose yardstick are the same object.

The corollary is the general defence, and it is cheap: **plant the fault.** Two
checks written the same afternoon passed on the fault they were written for —
the minimap one counted marks that the parts on the floor were still supplying,
so a room whose conveyors had stopped being drawn still scored five. Both had
been written, run, and seen to say `ok`.

**A check that only catches deletion is half a check, and should say so.**
Several CSS invariants assert a literal value in the built file — "the fins are
pulled down past the flame overhang" is `bottom:-6%`. That catches the rule
being removed, not the rule being wrong, and it has to be re-tuned by hand every
time the value is. They are worth keeping and worth labelling; do not mistake
one for a guarantee.

**A two-minute check is one nobody runs.**
The smoke suite was one suite until waiting out step frames and a 2.6s
celebration took it past two minutes, at which point it stopped being run during
work and started being run before pushing — which is the wrong end. Split on a
rule that can be applied without judgement: **if it needs the robot to finish a
run, it belongs in the full suite.** The fast one is ~15s and gets run
constantly, which is the only property that matters.

## Design

**End a category; do not police it.**
Six name collisions, and the guards that catch them are guards — they fire after
the mistake. Board kinds become element classes, so `.cog {}` lands on the board
whether you meant it or not, and no amount of care removes the hazard. A naming
convention that prefixes structural classes would make the wrong thing
*impossible to write*, which beats making it detectable. The guards were the
right first move; they are not the fix.

**The unit that makes special cases disappear is the one to build on.**
`Chapter` is the unit of content, so practice rooms and rooms a child built are
assembled at runtime into a `Chapter` like any other — and the level select,
minimaps, pips, playing and the next button all work on them with no special
cases at all. That was not the motivation for `Chapter`; it was the consequence.
Follow decisions downstream before defending them.

**A boundary can guarantee what discipline only promises.**
Funke cannot affect the game, and the reason is not that nobody wired her in: it
is that the engine has never heard of her. She trails one frame behind Robby by
reading the same trace, so she also cannot desync and needs no pathfinding. When
a rule matters, look for the boundary that makes breaking it impossible rather
than the review that would notice.

## Bookkeeping

**A document that needs two disciplines is two documents.**
Twice in one day, the same shape. `HANDOFF.md` held durable truth, method
lessons, open questions and work-to-do at once — and could not be kept current,
because there was nowhere to put an update that did not also mean re-reading the
other three kinds of thing. Then `LOG.md` turned out to be a dated worklog
sitting on top of a narrative history: one is appended to and never touched
again, the other has to be *rewritten* as it ages or it stops being readable.
Neither was badly written. Both were unmaintainable for the same structural
reason. **The tell is a maintenance rule that has to be stated twice with
different verbs for different parts of the same file** — at that point it is two
files, and splitting costs an afternoon while not splitting costs every session.

**An archive that duplicates git is not worth its drift.**
Inherited rather than earned here, from `laborsim`, which ran three verbatim log
archives for a month: 1,577 lines, 2% of what they held condensed, four entries
duplicated between them, and read by nothing. The replacement is to **fold** an
overflowing log into the arc it belongs to and delete it. Nothing is lost —
it is all in git twice over — and what git cannot give you cheaply is the arc,
because it hands you commits rather than periods, and changes rather than
changes of mind. The corollary bit immediately: a handover kept "as a record"
one session was deleted the next, because everything unique in it had been given
an owner and what remained was three wrong facts and a second place to look.

**Editing by string splice leaves the old block behind, and later wins.**
Three separate times a replacement landed beside the block it was meant to
replace rather than over it — and being later in the cascade, the stale one won,
so the "fix" never rendered. The cheese moon shipped a stale palette that way.
The duplicate-selector check exists because of it. In a real editor with real
diffs this is a non-issue, which is the argument for using one.

**A document that describes the tree lies within about a month.**
The handover said six stylesheets (there are eight), four worlds (five chapters
ship, and Test World is on the level select), and `Board.svelte` at ~500 lines
(584). None of it was carelessness; the tree moved and the prose did not. Two
responses, both taken: the counts that a reader would act on now live in
`doc/MEMORY.md` where they are read every session, and `src/doc.test.ts` checks the
parts of the shape a test *can* check — that every path written down resolves,
that the index matches the tree. Prose about a tree is a claim with no owner
unless something fails when it stops being true.

**Write the log entry as if the next session has no context.**
Because it does not. The entries that proved useful later recorded *why a thing
was rejected*, not what was built — the build is in the diff.
