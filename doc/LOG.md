# LOG.md — worklog

Append-only. **Newest first.** What was actually done, and closed cards. Not
plans, not open questions.

**Target: 1000 lines, act at 1200** (`CLAUDE.md`). At 1200, **fold** the oldest
sessions into the paragraph of `doc/HISTORY.md` they belong to and delete them
here. Not moved intact: a verbatim archive is what git already is.

Entry format:

```
## YYYY-MM-DD — title
Cards: [id] ...
What happened, in past tense. Anything tried and rejected, and why.
```

---

## 2026-08-26 — open up the editor, and make landscape an orientation

Cards: [R-003] closed. [R-005] half-answered and rewritten. [R-030] and [R-031]
opened from what was measured.

Seven asks from one session with the game on a phone, six of them about the
editor and one about the orientation it was held in.

**Landscape was broken, not squashed.** `.board` and `.egrid` each sized a tile
by subtracting a constant from the window height — `100dvh - 366px`,
`100dvh - 340px` — standing in for the gamebar and the console. A constant does
not scale: 43% of an 844px portrait window, **94%** of the same phone turned
sideways. Below ~366px of window it went negative, and `width: calc(w * -4px)`
is an invalid declaration, so the board *and every absolutely-positioned tile
in it* fell back to `auto`. There was not one orientation query in the repo.
Both now measure — `.scene` and `.canvas` are `container-type: size` and the
sizes come off `100cqw`/`100cqh` with a `max()` floor — and on short landscape
windows the console stands beside the board rather than under it, the editor's
tray/tools/themes likewise as a rail. The rail is held by a wrapper that is
`display: contents` in portrait, so portrait's rows are untouched.

**Two bugs fell out of that.** The editor's grid column was `auto`, so it
stretched to the tools row — five brushes, play and keep are wider than a 390px
phone — and once the grid measured its own box instead of the window it
inherited the overflow. `minmax(0, 1fr)` and a wrapping tools row fix a
clipping that was already shipping. And `viewport-fit=cover` was set with only
top and bottom insets handled, so a notch ate the console sideways.

**Robby left `Draft.cells`.** He was a map character, which is why `paint()` had
to refuse his tile — painting him would have deleted him. `Draft.start` holds
him now. Three things stopped being special cases: the floor under him paints,
moving him no longer writes bare floor over the tile he was on (it did, silently
eating a conveyor every time), and he can be put down anywhere including a wall,
which the room *says* rather than refusing the drop. The save format did not
move: `draftMap()` writes `R` back at `start`, and a room only saves when the
ground under him is plain floor, so the character it replaces is the `.` it
already means. `draftFrom()` is the inverse, and replacing the one hand-written
copy of it in `game.svelte.ts` fixed a live bug — editing a saved room was
dropping its tray.

**The gesture grammar came from the ask, verbatim, and it is better than what
was there.** Hold to pick a thing up, leave the tile to draw a trail, tap to
paint — and a tap turns a conveyor or changes an object only under the tool that
made it. What that buys: terrain became terrain. Belts and bridges used to be
carryable, not by decision but by accident of `grab` being "anything that is not
`#` or `.`", and the cost of that was that **no brush could overdraw one** — a
press picked it up instead. Nothing is committed on `pointerdown` any more; the
press starts a timer and records the origin, and which of the three gestures it
was is only knowable later.

Mid-gesture the grid renders `move(draft, from, hover)` — the draft the release
will produce — rather than a second rendering path that has to agree with the
first. That is what makes the carried piece ride under the finger. Dragging
Robby used to move nothing at all: `.lifted` dimmed the tile and he stayed put.

**The battery brush is an object brush.** One button walking a ring — battery,
cog, coil, core, rocket — cycled by tapping the tool tile it already is, which
also gives a conveyor its direction *before* it is painted rather than after
three taps on the grid. `goalFor()` derives the goal from the room and is asked
by both `assess()` and `playable()`; had only the first asked, a saved errand
room would have come back a collect room and been played at a par that is not
true. Two battery-only assumptions went with it: the editor rendered
`item === 'battery'` and nothing else, so a cog in a draft parsed, changed the
answer and **drew nothing**, and `itemIcon()` now holds the ternary all three
callers were writing out.

**The verdict left the bar and went into Robby's thought bubble.** It was an
English sentence — "needs robot and battery" — under the grid of the one game
whose brief is that the player cannot read. Four states, each a thing shown:
thinking, nothing to fetch, not on solid ground, no way through. `Verdict`'s
`needs: string[]` went with the bar that printed it. Only the par stays a
number, and that is for the adult. The bubble is the same `.think` he thinks in
while playing, sized off `--c`, which the editor already supplies.

**The rocket's refusal is a frame now.** Arriving short was a complete no-op in
the engine — `satisfied()` returned false and he drove across — so the shudder
the view already had (520ms×2) was cut off by the next 380ms step. A `denied`
`FrameEvent`, set on the arrival frame, holds it for 900ms; `DUR` is
`Record<FrameEvent, number>` so the compiler demanded the duration, and `tick()`
looks a frame's sound up by name, so `sfx.denied` wired itself and the ad-hoc
`if (shortHanded) sfx.denied()` in `Board.svelte` could be deleted. No outcome
changes, so no shipped par moved — which is the acceptance test, and it is run
on every suite. Measured in Chromium: the pad now turns him away for 1825ms.

**The whole 9×7 is editable.** `inside()` reserved a wall border, leaving a 7×5
interior that nothing on screen distinguished from a paintable one. Renamed to
`within()` so a caller wanting the old meaning fails to compile.

### What was measured rather than assumed

The solver cost of opening the ring, because open space is what makes `solve()`
expensive and the editor solves on every finished stroke:

| wide-open room | `assess()` |
|---|---|
| 9×7 (the editor's size) | **650–770ms** |
| 9×9 | 917ms |
| 11×7 | 1175ms |
| 11×9 (`MAX_W`×`MAX_H`) | **2547ms** |

The dedup on world state is what stops it exploding — the frontier is bounded by
distinct states, not by 4^depth. 9×7 is fine behind the spinner the editor
already shows. **11×9 is not**, and `MAX_W`/`MAX_H` permit it today, which is
[R-005]'s real constraint and is now written into the test that fails on it.

### Rejected, and why

- **Free pixel-following for the carried piece.** Cell-snapping is honest to a
  tile game, needs no second positioning system, and re-uses `--x`/`--y`/`--c`
  like everything else on the board. The piece is visibly under the finger
  either way.
- **Refusing to drop Robby on a wall.** A refused drop is a thing that has to be
  explained; a room that says *he is not standing on anything* is a thing that
  can be seen. Same argument as the red outline over the bin.
- **A wider landscape rail (44vw).** Tried, to stop the save button wrapping to
  its own line at 640px. It cost the grid 40px and the button wrapped anyway.

### Two things a check could not have told us

`git checkout` on one file, to undo a planted fault, took the whole rewrite of
`Editor.svelte` with it — the plant had been applied on top of uncommitted work.
Rewritten from context, but the lesson is cheap: **plant faults on a committed
tree, or with a copy beside you.** The two plants either side of it used `cp` to
a scratch file and cost nothing.

And the duplicate-selector guard read the stylesheet flat, so the first
landscape block looked like eight stale blocks. It cuts the sheet into scopes
now — top level, and each `@media` body — because *within* a scope a repeated
selector is still the fault it was written for, proven by planting one.

287 → **302** unit tests, 199 → **226** fast checks, **145** full. Driven in
Chromium at 390×844, 844×390 and 640×360.

## 2026-08-26 — end the collision category

Cards: [R-013], [R-010] and [R-026] closed. [R-023] closed on the way past.
[R-029] opened from what the guards found.

Two cards on one branch because they meet at the particle code: every particle
class name in the game is a string literal inside the block [R-013] moves out of
`Board.svelte`, and one of them — `star` — was collision **seven**.

**[R-013].** `Board.svelte` 582 → **449**. Two modules out:

- **`src/view/particles.ts`** — `spawn`, `pickup`, `exhaust`, `puff`,
  `celebrate`, as plain functions taking the element to hang particles on, in
  the shape `bits.ts` and `fly.ts` already use.
- **`src/view/roam.ts`** — `routesFrom` (the breadth-first search) and
  `nextStroll` (which tile she picks, and the walk back out through Robby's tile
  to get there). **Pure**, so `src/view/roam.test.ts` can exist: 11 tests, and
  the two that matter were proven by planting the historical fault — a
  hand-written wall-and-blocked check in place of the engine's `passable` — and
  watching *only* the shut-gate and fallen-bridge tests go red.

The clock stayed in the component: `padAlong`'s `setTimeout` cadence and the
interval that starts a stroll are the view's job. Moving them into a
`.svelte.ts` factory would have bought rune-ownership risk and nothing else.

**`throwParty` stayed too**, and that is a decision rather than an oversight:
`party` and `beat` are celebration *state*, read by `catPos`, `catCls` and
`botCls`. It is a third thing in the file, but not a third module — pulling it
out means either exporting three reactive values or moving the cat's whole
class derivation with it.

**[R-010].** `src/view/css.ts` is now the only road from a name the engine owns
to a class in the DOM: `kindCls('belt')` → `k-belt`, `markCls('w')` → `m-w`.
Three families were prefixed — cell and item kinds (`Board.svelte`,
`Editor.svelte`, including the editor's brushes), the minimap's single letters
(`.b` and `.m` were live hazards), and every particle (`fx-`). About twenty
selectors across four stylesheets and twenty more sites in the two smoke suites.

The rename failed loudly once, which is the good failure mode: a CSS-text check
pinning `\.tile\.fragile::before` that a class-name grep does not find.

**[R-026] is closed by construction rather than by patch.** `.confetti` and
`.star` were both bare single-class rules declaring `animation`, at equal
specificity, and `.star` — the *sky decor*, five hundred lines further down
`world.css` — came later, so a third of the confetti ran `twinkle … infinite`
instead of `fall`. The confetti is `fx-confetti fx-star` now and the decor's
`.star` cannot reach it.

### Three guards, and what the third of them found

Each was proven by planting its fault and watching it go red. Fast suite 191 →
**199**, full 142 → **145**.

1. **No element wears a bare engine name.** Sampled on every navigation, an
   empty sample fails. Written twice: the first version asserted *every* class
   was prefixed and failed on `swatch batt`, which is a legitimate hand-written
   variant. The invariant that is actually wanted is narrower — no element may
   carry a name the *engine* owns — and it needs no allowlist, which is why it
   is the right one.
2. **No rule names a class nothing writes, and nothing is written with no rule.**
3. **No element is claimed by two animations.** [R-026]'s general form. Two
   samples: the DOM, and the multi-class strings `particles.ts` writes — because
   confetti exists for 2.8 seconds after a win and the fast suite never gets
   there, so the DOM half alone would have watched the original bug go past.

**[R-023] fell out.** The guards' lists are read from the files that own them —
`CELL_KINDS`/`ITEM_KINDS` from `src/engine/types.ts`, `MARKS` from `css.ts`,
`FX_CLASSES` from `particles.ts` — by regex over the source text, since a `.mjs`
suite can read TypeScript even though it cannot import it. The bare-kind guard's
own transcribed list, the one that was missing `oneway` for the mechanic's whole
life, is gone.

### `.spark` has never existed

Guard 2's second direction found it immediately. `pickup()` spawned eight
`<span class="spark">`, each given a colour, a direction and an 18ms-stepped
delay — and **no `.spark` rule has ever been written, in any commit**
(`git log --all -S`). They were unstyled inline spans of no size: born, laid out
to nothing, removed 900ms later, on every pickup the game has ever played.

The spawn code is deleted rather than styled. Deleting is provably
behaviour-preserving — no rule, no size, no animation, nothing on screen ever —
whereas writing the rule would be designing a burst that changes how every
pickup in the game feels, which is not a refactor's decision to make. [R-029]
carries the intent.

Also removed: `.paint.robot`, a palette rule for a brush `Brush` has never had.

Two smaller things fixed in passing, both the same category in a different
place: `const at = g.playhead` inside `Board.svelte`'s particle effect shadowed
the `at` imported from `parse` (renamed `frame`), and `MiniMap`'s cell field was
called `kind` while holding a mark rather than a kind.

One behaviour change, deliberate and small: `nextStroll`'s fallback when every
tile is stale used to index a differently-filtered list with a random number
that was always zero, so Funke always went to the same tile and could pick the
one she was already on. It picks properly now.

## 2026-08-26 — one fact, written once

Cards: [R-022] opened and closed. [R-002], [R-004] and [R-006] got cheaper.
[R-023]…[R-027] opened from what the audit turned up.

The engine was sound; the layer just above it — **turning a map string into a
playable level** — had been written once per caller and the copies had started
to disagree. Two new modules and a lot of deletions:

- **`src/engine/legend.ts`** — the map format as a table, read in both
  directions. The characters were being interpreted in **five** places: the
  if-else ladder in `parse.ts`, `CHAR`/`BELTS` in `editor.ts`, `PART_CHARS` in
  `generate.ts`, a four-character ladder in `MiniMap.svelte`, and raw
  `ch === '*'` tests in `Editor.svelte`'s markup. Now one list; `charFor` is the
  inverse the parser never had, which is what lets the editor's palette be a
  list of *tiles* rather than a second copy of the table.
- **`src/engine/level.ts`** — `probe`, `derive`, `trayFor`, `OPEN_TRAY`,
  `DRAFT_DEPTH`. Three callers built the same placeholder `Level`, solved it,
  derived a tray and patched both back in; all three spelled the all-nines tray
  as a bare literal with nothing saying it exists to defeat `withinTray`.

**Line count is not the win, and pretending otherwise would be dishonest.**
Engine code, comments stripped: **868 → 921 lines**, i.e. slightly *up*, because
two new modules arrived and `CELL_KINDS`/`ITEM_KINDS` as `const` arrays cost
more lines than the unions they replaced. What went down is **the number of
places a fact is written**: the legend 5 → 1, the probe-level dance 3 → 1,
`trayFor` 2 → 1, the tray histogram `par.filter(p => p === d).length` 5 → 1, the
gate-opening loop 3 → 1, the direction-vector table 6 → 1, the belt-rotation
table 3 → 1, `"x,y"` keys 4 → 1, and "which chapters can generate" 2 → 1.

**Three name collisions were living inside `src/engine/` itself** — the failure
mode `doc/design/code/conventions.md` calls this codebase's recurring one, six
times over in CSS, in the one place no guard looks. `at` was both
`(world, p) → Cell` and `(draft, x, y) → string`; `toMap` both synthesised a
grid and joined rows; `Cell` was both a tile and a `{x, y}`. Renamed to
`cellAt` / `draftMap` / `renderMap`, and generate's `Cell` was simply a `Vec2`.

### Two real defects, both consequences of the duplication

**`clone(d: Draft)` returned `{ theme, cells }` only**, dropping `name` and
`tray` — and `paint`, `rotate`, `move` and `discard` all went through it, so
naming a room or tightening its tray and then painting one more tile threw both
away. `Editor.svelte` rebuilt them with a spread of its own, which is why it
never showed. **`playable()` had no completeness check**, so a saved room with
no `R` reached `parseMap` and *threw* — inside a `$derived` over everything in
storage, with no error boundary ([R-014]). Both now fail a test before the fix
and pass after; the fault was planted for each and watched to fail.

### Things that turned out not to be true

Worth recording, because two of them were confidently believed while planning.

- **A key-opened gate is not misclassified.** `openAllGates` pushed to `changed`
  but never to `kind`, which looked like it would fall through the event ternary
  to `'collapse'` — but `kind.push('pickup')` happens *first* and `'pickup'` is
  ahead of `'gate'` in the priority chain, so the frame was always reported
  correctly. The three loops were still worth collapsing into one; no bug was
  fixed by it, and claiming one would have been wrong.
- **The round-trip test cannot prove the legend is right.** Parse and serialise
  share the table, so a consistent relabelling round-trips perfectly. Swapping
  `E` and `W` was tried: it **passed** the round trip while failing twenty tests
  elsewhere. The comment above it now says what it proves (agreement) and what
  proves the rest (the solver re-deriving every shipped par). This is
  `doc/META.md`'s *a check that only catches deletion is half a check* with a
  new face — a check that can only catch *disagreement*.
- **The first minimap check passed on a planted fault.** It counted `.mini i.m`
  marks, and the parts lying on the floor were also drawing `m`, so a Scrapyard
  whose conveyors had stopped being drawn still scored 5. `m` now means terrain
  machinery only, and the fault takes it to 0. **Planting the fault is the only
  reason that was found**; the check had already been written, run and seen to
  pass.

### Found while auditing, not fixed here

**Plate `E` does not exist, and gate 5 therefore has no plate.** The legend
advertised `A-I` — nine plates — but `E` was spent on the east conveyor first
and the old parser read the belt table before the letter range, so `E` in a map
has always been a conveyor. Left alone deliberately: the characters *are* the
save format, and moving one would silently rewrite every room anybody has
already built. `legend.ts` now states the gap and a test asserts no character is
spent twice, so it is visible rather than accidental.

**`oneway` was missing from the bare-kind guard's list** (`smoke.fast.mjs`), so
a bare `.oneway {}` rule was the one board kind nothing would have caught — the
same kind that no shipped level uses ([R-004]). One word, added. Deriving that
list from the engine rather than re-typing it is [R-023].

### Also

`MiniMap.svelte` reads the parsed world instead of the map characters, so belts,
bridges, gates and one-ways stop drawing as indistinguishable plain path — the
Scrapyard's eight thumbnails now show their machinery (64 marks where there were
none). `game.svelte.ts` lost its `chapter.id as ChapterId` cast: `canGenerate()`
is a type guard, and the two statements of which worlds have a generator are one.
`generate.test.ts` keeps its two hand-written neighbour walks on purpose — a test
that shared a helper with the code under test would be testing nothing.

**Counted rather than estimated:** 266 → **276** unit tests, 190 → **191** fast
checks, **142** full checks unchanged. `solve()` on the Scrapyard finale: 338ms
for its 13-token par. Driven by hand in a real browser as well as in jsdom —
naming a room, tightening its tray, painting and turning a conveyor.

## 2026-08-26 — `docs/` → `doc/`

Cards: none. A rename.

Every path-shaped reference followed, including this file's: a rename moves a
document's address without changing the document, so the usual reason not to
rewrite the record — that it would be editing the past to match the present —
does not apply. `src/docs.test.ts` became `src/doc.test.ts` with it, because a
repo half-committed to a token is the exact detail this was cleaning up.

**The two references the bulk rewrite could not reach were inside the checker
itself**, where the directory appears as `docs\/` in a regex and the escape hid
it from a `docs/` search. Had they been missed, the path check would have
matched nothing and passed — which is the `(0 checked)` shape again, and which
is why `expect(checked).toBeGreaterThan(20)` exists. It stayed at 160 scraped
paths across the rename, and the fault-planting was re-run against the new
regex to confirm it still fails.

Line-count targets stay **soft gates**: prose, not assertions. They are
judgement calls about when a surface wants condensing, and a build that fails at
361 lines would buy exactly the line-shaving the band exists to prevent.

## 2026-08-26 — the arc leaves the log, and the root empties

Cards: [R-000] extended and closed.

**`doc/LOG.md` was two documents.** It held a dated worklog on top of an eleven-part
narrative history written from the whole project, and the two have opposite
disciplines — one is appended to and never touched again, the other has to be
rewritten as it ages or it stops being readable. Split: `doc/HISTORY.md` is the
arc, oldest first, rewritten rather than appended to, targeted at 250 lines
*below* MEMORY's 300 so current truth always outranks how it was arrived at.

The mechanism is `laborsim`'s, which replaced three verbatim `doc/log/`
archives with it after they grew 1,577 lines in a month, condensed 2% of what
they held, duplicated four entries between themselves and were read by nothing.
This repo never built those archives, so it skipped straight to the thing that
replaced them: **when the log overflows, its oldest sessions fold into the
paragraph they belong to and are deleted.** Nothing is lost — it is all in git —
and what git cannot give you cheaply is the arc, because it hands you commits
rather than periods, and changes rather than changes of mind.

**`doc/handoff-2026-08.md` was deleted rather than kept as a record.** Last
session's argument for keeping it — §11 is the only playtest that exists — had
already been answered by the same session's work: the playtest is
`doc/design/game/playtest.md`, better placed and cross-linked. What was left
was 433 lines duplicating content that now has owners, carrying three facts
known to be wrong, in a repo that had just adopted the rule that an archive
duplicating git is not worth its drift. Recoverable at
`git show 2d8fec1:doc/handoff-2026-08.md`.

**The root is now `CLAUDE.md`, `README.md` and configuration.** Every other
surface moved to `doc/`. Two files stayed and the reason is mechanical rather
than aesthetic: `CLAUDE.md` is discovered at the repository root by the agent
that reads it, and `README.md` is what GitHub renders. Both are entrypoints for
readers who have not been told where to look; everything else is for readers who
have been.

References were rewritten to **full paths** in the process: a backticked
`doc/MEMORY.md` rather than a bare filename. That is not tidiness —
`src/doc.test.ts` only resolves a backticked path that carries a directory, so
every bare filename was unverifiable prose and is now a checked link. Counted
rather than estimated: **106 scraped paths before, 158 after.** The check earned
it back within the hour — it failed on a `README.md` link to the deleted
handover that had been missed by eye twice.

`CLAUDE.md` gained the **gates** section: the four conditions that decide
whether work is finished, stated as things to check rather than things to
remember. The write order already said what to update; nothing said what makes a
change complete.

`doc/META.md` gained one entry that this session actually earned — **a document
that needs two disciplines is two documents** — with both incidents, the
handover and the log, because the same shape turning up twice in one day is what
makes it a pattern rather than an anecdote.

Two small things found by doing the work rather than planning it. The path check
walked into a git worktree left in the repo root and reported four broken links
that were all correct where they were written; `markdownUnder` now skips any
directory containing a `.git`, because somebody else's tree is not this tree's
problem. And `doc/HISTORY.md` came out of its first draft at 275 lines —
already inside its own notice band on the day it was created — so it was
condensed to 251 before being committed. It sits one line over target, and
**that is where it stays**: acting at 251 is precisely the line-shaving the band
exists to prevent.

## 2026-08-26 — the surfaces

Cards: [R-000] opened. `doc/BOARD.md`, `doc/NOTES.md` and `doc/META.md`
created; `doc/design/` seeded; `HANDOFF.md` distributed.

`CLAUDE.md` was a briefing that pointed at three documents. It is now a contract:
a read order, a write order, and surfaces that each have a stated job, a target
size and a line at which they get condensed rather than shaved. Structure
follows `laborsim`, which has been running it long enough to have opinions about
the band.

**`HANDOFF.md` was the problem this solves.** 418 lines holding durable truth,
method lessons, open questions and work-to-do *at once* — four surfaces in a
trench coat, which is why none of it could be kept current: there was nowhere to
put an update that did not also mean re-reading the other three kinds of thing.

Rejected on the way: **leaving it at the root as a second entrypoint.** Two
documents claiming to be the briefing is the drift hazard the whole structure
exists to remove, and it would have started on the first session that updated
one of them.

**Three drifts were found while seeding**, all of the same kind — the tree moved
and the prose did not:

- **six stylesheets → eight.** `index.css` imports eight, and the comment at the
  top of that file is right where the docs were wrong.
- **four worlds → five chapters.** `chapters` is
  `[lab, forest, scrapyard, cheeseMoon, testWorld]` and the level select shows
  six tiles. Test World ships to players. `README.md` knew; `HANDOFF.md` and
  `doc/MEMORY.md` did not, and "all four worlds" reads differently once you know
  there is a fifth on the menu. Now a thread in `doc/NOTES.md`, because the
  question is not a fact to record but a decision nobody made.
- **`Board.svelte` ~500 → 584 lines**, and the view has **nine plain modules**
  the architecture description elided behind an ellipsis — about 1,200 lines, a
  third of the view. Now in the repo map, and the file is a card.

A fourth turned up while writing the rules page: **no shipped level anywhere
uses a one-way**, though `parse.ts` parses `^ v < >`, `simulate.ts` runs them
and `solve.ts` solves them. Test World's own comment claims "every trigger the
engine supports has a level here". Carded as [R-004], with the check that keeps
the claim true rather than a promise to remember.

`src/doc.test.ts` checks the parts of a documentation tree a test can check:
every markdown path written down resolves, every cluster page indexes its own
tree, and no content page has crept into the `doc/MEMORY.md` index. Each of the
three was verified by **planting the fault and watching it fail** — a broken
link, an unindexed page, a content page in the index — and each carries the
sample-size assertion `CLAUDE.md` requires, because the alternative is the
`(0 checked)` incident again with different subjects.
