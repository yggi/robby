# BOARD.md — task board

One task per card. Cards carry *what* and *done-when*, never rationale — that
belongs in `doc/MEMORY.md` or `doc/NOTES.md`.

**Targets:** `doing` 3 · `ready` 10 · `backlog` 40 · `history` 10.
**Act at** 4 · 12 · 48 · 12 (`CLAUDE.md`). History past its target moves to
`doc/LOG.md`; ready past its target means a card goes back to backlog, not that
ready is bigger now.

Card format:

```
### [id] Title
- **what:** one or two lines
- **done-when:** the observable condition that closes the card
- **needs:** blocking card ids or open threads (omit if none)
```

---

## doing

*(empty)*

---

## ready

Order comes from the playtest (`doc/design/game/playtest.md`), which reordered
everything: the editor is not a side feature with rough edges, it is the surface
people actually use, and its missing pieces are the constraint on the part of
this that gets played. The editor cards come first, then the one that makes a
built room shareable, because rooms are already being passed between people by
hand.

### [R-001] The editor can place a gate and its plate
- **what:** a linked pair is the first editor piece that is inherently a
  two-step interaction — placing one means placing the other and knowing which
  gate this plate opens. The engine and the map format already carry `link`.
  The editor's live solve already refuses an unsolvable draft, so a plate with
  no gate fails safe; it should not be *placeable* in that state for long.
- **done-when:** a child can place a plate and a gate, see which belongs to
  which without reading anything, and the room solves.

### [R-002] The editor can place a one-way
- **what:** `oneway` is parsed (`^ v < >`), simulated and solvable, and used by
  nothing. The editor is where it would first pay: a room whose route is forced
  in one direction is the cheapest hard room an adult can build. Since [R-022]
  a new brush is a row in `CHAR` reading `charFor({ cell: 'oneway', only })`,
  not an edit in five files.
- **done-when:** one-ways can be painted and turned, and a room built with one
  solves with the same par the solver derives.
- **needs:** R-004 (the same check proves it is reachable at all)

### [R-004] Every cell kind appears in a shipped level, and a check says so
- **what:** Test World's comment claims one room per mechanic; no shipped level
  anywhere uses a one-way. Add the missing room(s) and the check that keeps the
  claim true. The scraping half is done: `CELL_KINDS` and `ITEM_KINDS` are
  `const` arrays since [R-022] and `legend.test.ts` already walks them, so this
  is now "walk every map in `chapters`, fail on a kind nothing uses" — with the
  sample-size assertion `CLAUDE.md` requires.
- **done-when:** the check exists, it fails when a room is removed, and it
  passes.

### [R-005] The grid is not fixed at 9×7
- **what:** editor rooms are 9×7 and cannot be resized. An adult building for an
  older child runs out of room; a small child wants fewer tiles, not more. The
  whole 9×7 is now editable, so this is only about the *size*, and the solver
  cost is measured rather than feared: a wide-open 9×7 answers in 650–770ms,
  9×9 in 917ms, 11×7 in 1175ms, and **11×9 in 2547ms** — which `MAX_W`/`MAX_H`
  permit today and which is too slow to solve on a finished stroke. So a bigger
  grid needs the depth cap or the solve moved off the main thread, not the
  numbers changed. The numbers are in `editor.test.ts`, and the check fails at
  11×9.
- **done-when:** the grid can be sized in the editor, and the live verdict still
  returns fast enough not to be felt on the largest size offered.
- **needs:** R-030 (or a depth cap that scales with open space)

### [R-030] The live solve is on the main thread, and it is felt
- **what:** `assess()` blocks for up to 770ms on a wide-open 9×7 and the editor
  covers it with a spinner and two `requestAnimationFrame`s. That is the ceiling
  now, not after [R-005] makes the grid bigger. `generate.ts` has the same
  problem and its own card — one worker answers both.
- **done-when:** a finished stroke never blocks the main thread, and the
  spinner is animating because it is animating.
- **needs:** R-008 (the same worker)

### [R-031] `MAX_W` and `MAX_H` are a promise nothing keeps
- **what:** they are enforced in `starterDraft` alone, which is called once with
  no arguments — so nothing in the app can produce any size but 9×7, and
  anything that could would get 11×9, which takes 2547ms to solve. Either the
  cap belongs where drafts are made, or it should say what it is really for.
- **done-when:** a draft cannot exist above the cap, and something fails if one
  does.

### [R-006] A room is a URL
- **what:** the map is `string[]` and rooms already save as the map string and
  nothing else, so a built room is a short link. Par and tray are re-solved on
  load, which means a shared room cannot arrive with a stale par — and a link
  that no longer solves must drop out rather than open wrong.
- **done-when:** a link opens somebody else's room, playable, with a par derived
  on arrival; and it works from `file://` with no network.
- **note:** the failure path is safe as of [R-022] — `playable()` checks the map
  is complete before touching the solver, so a mangled link drops out instead of
  throwing out of `parseMap` into a screen with no error boundary.

### [R-007] Generation for the Scrapyard
- **what:** `generate.ts` stops at World 2. Conveyors are where the load-bearing
  test does its best work — "solve it again with the belts turned to floor" is
  exactly the check that catches a decorative conveyor.
- **done-when:** the practice tile appears in World 3 and its rooms pass the
  differential filter at an acceptance rate worth recording.
- **needs:** R-008 (World 2 is already near the budget on the main thread)

### [R-008] Generation moves off the main thread
- **what:** World 2 generation is ~120ms median and ~560ms worst case, with a
  spinner over it. That is the ceiling now, not after a third generator lands.
  A worker rather than another round of tuning.
- **done-when:** rolling a practice room does not block the main thread, and the
  spinner is animating because it is animating, not because it is transform-only.

### [R-009] Meeting Robby cold
- **what:** nobody has started this game without an adult beside them. Watch a
  child open it for the first time, alone, and write down where they stop. Not a
  build — an observation, and the only card here whose output is a document.
- **done-when:** `doc/design/game/playtest.md` has a second session in it, and
  the board has whatever cards it produced.

---

## backlog

### [R-011] Randomness below the celebration line
- **what:** idle tics, bonks and pickups play identically every time; the
  pattern to copy is in `throwParty()`. Blocked on where the line goes — see the
  thread in `doc/NOTES.md`, which argues feedback should *not* vary.
- **done-when:** the things that reward you vary, the things that tell you what
  happened do not, and the smoke suite asserts the variety is real.
- **needs:** NOTES thread "what should vary"

### [R-012] A wordless beat between rooms
- **what:** thirty-two rooms and no journey between them. Funke padding ahead
  through a doorway, no text, no tap, and skippable by the second time.
- **done-when:** finishing a room leads into the next one rather than cutting to
  it, and it can be sat through twice without wanting to be skipped.
- **needs:** NOTES thread "thirty-two rooms, no journey"

### [R-014] An error boundary
- **what:** if a render throws, the screen goes blank — on a phone, with no
  console, in front of a child. Anything is better: Robby shrugging, and a tap
  that goes back to the menu.
- **done-when:** a thrown render lands somewhere a five-year-old can get out of.

### [R-015] The workshop has one slot per character
- **what:** antenna, tail, nose — four parts each, one slot each. Bits
  accumulate faster than there is anything to spend them on, which makes solving
  rooms pay less as you go.
- **done-when:** there is more to buy than there are bits to buy it with, at
  every point on the curve.

### [R-016] World 5 — opening the way for yourself
- **what:** the engine already supports gates and plates (linked), keys,
  one-ways and multi-part manifests. A world about making the room let you
  through is available for the writing, and it is the one that would put every
  unused mechanic in front of a player.
- **done-when:** eight rooms, every par derived by the solver, and the
  differential filter run over each one by hand before it ships.
- **needs:** R-004

### [R-017] Your own wrong answer, played back
- **what:** keep the failed run and offer it beside the fix. Watching what you
  did next to what you meant is the strongest available version of the thing
  this game is about — and the trace already holds everything needed.
- **done-when:** after a win, the run that failed first can be watched again.

### [R-018] Loops
- **what:** the most-requested next concept in this genre and the one to be most
  careful with. Repetition needs nesting in the strip, and retrofitting nesting
  into a flat list is the painful version. **Design the strip for it before
  writing any of it.**
- **done-when:** a child can say "do this twice" and see it happen — and the
  strip that holds it was designed for nesting, not adapted to it.

### [R-019] Two-player, or a parent mode
- **what:** one builds, the other solves. Already happening informally
  (`doc/design/game/playtest.md`); this is the version the game knows about.
- **done-when:** handing the phone over is a thing the game does, not a thing
  people do around it.
- **needs:** R-006

### [R-020] Replace the regex CSS claims
- **what:** a dozen checks assert literal values in the built file. They catch
  deletion, not wrongness, and they are re-tuned by hand. Blocked on what the
  honest replacement is in a repo with no external assets.
- **done-when:** the claims that are about *appearance* are checked by something
  that can see, and the rest are gone.
- **needs:** NOTES thread "regex is holding up a dozen CSS claims"

### [R-023] The themes list still comes from a transcription
- **what:** the board-kind half is done — `namesIn()` in `test/harness.mjs`
  reads `CELL_KINDS`, `ITEM_KINDS`, `MARKS` and `FX_CLASSES` out of the source
  text, so adding a kind cannot leave a guard behind. The **nine themes** are
  still re-typed in `smoke.fast.mjs`'s palette check, and `THEMES` is a `const`
  array like the others, so this is one more `namesIn()` call.
- **done-when:** adding a theme to the engine cannot leave the guard behind,
  and something fails if it does.

### [R-029] The pickup burst was never drawn
- **what:** `pickup()` spawned eight `.spark` spans with a colour, a direction
  and a stepped delay, and **no `.spark` rule has ever existed in any commit**,
  so nothing rendered — found by the guard that now asserts every class the code
  writes has a rule. The dead spawn code is deleted; the intent is not. A ring
  alone is thin for the one moment the game says *you got it*, but eight sparks
  on every pickup changes the feel of the whole curve, so it wants deciding
  rather than restoring.
- **done-when:** picking something up either has a burst that was designed, or
  a line in `doc/design/feel/motion-and-sound.md` saying the ring is the whole
  of it on purpose.

### [R-024] Three guards can pass on an empty sample
- **what:** the `@keyframes`, clip-rule and bare-kind guards each interpolate a
  count into their label and never assert it — `no two animations share a name
  (0 defined)` would print `ok`. That is exactly the `(0 checked)` shape
  `CLAUDE.md` gate 3 forbids, in the file that exists to enforce it. The five
  guards added since all assert their counts; these three still do not. One
  more of the same shape while in there: `Funke does not upstage Robby` in
  `smoke.full.mjs` asserts the cat lacks a class nothing has ever given it.
- **done-when:** each fails on an empty sample, proven by planting it.

### [R-025] `report()` does not do what the docs say it does
- **what:** `doc/design/testing/harness.md` says "the report fails if any
  arrived" of the uncaught-error collector. `report()` never reads `errors`; the
  only assertion is one point-in-time check in the full suite, and the fast
  suite does not import it at all. Either wire it in or stop claiming it.
- **done-when:** an uncaught error fails both suites, proven by throwing one.

### [R-027] `bits.ts` is two modules in a trench coat
- **what:** a coin-flight animation and the entire save file share one file, and
  the persistence half is eleven near-identical `try/catch` wrappers over five
  keys, with three different spellings of the same comment. `loadRooms()` is
  typed `unknown[]` and cast at the call site. This is `doc/META.md`'s own *a
  document that needs two disciplines is two documents*, applied to code.
- **done-when:** reading and writing a key is one helper, the save file has its
  own module, and the types survive the boundary.

### [R-028] Practice is not a `Chapter`, though everything says it is
- **what:** `doc/MEMORY.md` claimed practice rooms and built rooms are both
  assembled into a `Chapter` "with no special cases". Only built rooms are;
  practice is a bare `Level` held outside the chapter system and needs a special
  case in six places (`game.svelte.ts` ×4, `GameBar.svelte`, `Rooms.svelte`).
  The document has been corrected — this card is making the claim true again.
- **done-when:** practice is a chapter of one, and the six special cases are
  gone.

### [R-021] Driven by keyboard, once, end to end
- **what:** aria-labels and reduced-motion are in; nothing has been driven by
  keyboard or heard through a screen reader. Do it once and write down what it
  was like before deciding what it should be.
- **done-when:** the game is completable without a pointer, and
  `doc/NOTES.md`'s keyboard thread has an answer in it.
- **needs:** NOTES thread "is there a keyboard story at all?"

---

## history

### [R-003] The editor can ask for more than one thing — **closed**
The battery brush is an **object** brush: one button walking a ring — battery,
cog, coil, core, rocket — cycled by tapping the tool tile it already is, which
also aims a conveyor before it is painted rather than after three taps on the
grid. `goalFor(map)` derives the goal from the room and is asked by both
`assess()` and `playable()`; with only the first asking, a saved errand room
would have reloaded as a collect room and been played at a par that is not true.

Two battery-only assumptions went with it. The editor rendered
`item === 'battery'` and nothing else, so a cog in a draft parsed, changed the
answer and **drew nothing at all**; and the battery-else-part-else-key ternary
was written out at three call sites, one of which had been narrowed. It is
`itemIcon()` now.

The bubble does tick the manifest off — it is the board's own `.think`, which
already did, and the built room reaches it by being a `Chapter` like any other.

### [R-013] + [R-010] + [R-026] End the collision category — **closed**
`Board.svelte` 582 → **449**: particles and Funke's roaming are modules
(`particles.ts`, `roam.ts`), and the roaming half is now **pure**, so it has 11
unit tests where it had none — proven by planting the historical fault, the
hand-written passability check that had her padding through shut gates.
`throwParty` deliberately stayed: `party` and `beat` are celebration state read
by three derivations in the component.

`src/view/css.ts` is the only road from a name the engine owns to a class in the
DOM. Three families namespaced — cell and item kinds (`k-`), the minimap's
single letters (`m-`, and `.b`/`.m` were live hazards), every particle (`fx-`).
Collision **seven** ([R-026] — a third of the confetti running the sky decor's
`twinkle … infinite` instead of `fall`, in the shipped build) closed by
construction rather than by patch.

Three guards, each proven by planting its fault: no element wears a bare engine
name, no rule names a class nothing writes *and nothing is written with no rule*,
and no element is claimed by two animations. [R-023] fell out — every guard list
is read from the file that owns it, so the transcribed kinds list that was
missing `oneway` for the mechanic's whole life is gone.

**The second guard found that `.spark` has never existed.** Every pickup spawned
eight of them, styled by nothing, in every commit the game has ever had. Deleted
rather than styled — deleting is provably behaviour-preserving, designing a
burst is not a refactor's call ([R-029]).

The first version of guard 1 was wrong in an instructive way: it asserted *every*
class was prefixed and failed on `swatch batt`, a legitimate hand-written
variant. The invariant actually wanted is narrower and needs no allowlist.

276 → **287** unit tests, 191 → **199** fast checks, 142 → **145** full.

### [R-022] One fact, written once — **closed**
The layer that turns a map string into a playable level had been written once
per caller. Two new engine modules: `legend.ts` (the map format as a table, read
in both directions — it was being interpreted in five places) and `level.ts`
(`probe` / `derive` / `trayFor` / `OPEN_TRAY` / `DRAFT_DEPTH` — the
placeholder-solve-patch dance was written three times, each spelling the
all-nines tray as a bare literal). Also collapsed: three gate-opening loops into
one, six copies of the direction-vector table and three of the belt-rotation
table into `DELTA`/`DIR_ANGLE`, four `"x,y"` key schemes into `posKey`, and
Funke's roaming onto the engine's own `passable` — she had been padding through
shut gates and fallen bridges.

**Three name collisions were inside `src/engine/`**, where no guard looks: `at`,
`toMap` and `Cell` each meant two things. Renamed.

Two real defects fell out and were fixed with a planted fault each: `clone(Draft)`
silently dropped a room's name and tray on every stroke, and `playable()` threw
out of `parseMap` on an incomplete saved room rather than dropping it.

Engine code is **flat** (868 → 921 lines, comments stripped) — the win is places
a fact is written, not lines. 266 → **276** unit tests, 190 → **191** fast
checks, **142** full checks.

Two beliefs did not survive contact: a key-opened gate was never misclassified
(`pickup` outranks `gate` in the event chain), and the legend round-trip test
**cannot** prove the table is right — swapping `E` and `W` passes it while
failing twenty tests elsewhere. Both are recorded in `doc/LOG.md` rather than
quietly dropped.

### [R-000] The agentic structure, seeded from the handover — **closed**
`CLAUDE.md` was a briefing that pointed at three documents; it is now a contract
with a read order, a write order, gates, and six surfaces that each have a
target size and a line where they get condensed. The old `HANDOFF.md` was one
418-line document holding durable truth, method lessons, open questions and
work-to-do at once — four surfaces in a trench coat, and the reason none of it
could be kept current. It was distributed into `doc/MEMORY.md`,
`doc/META.md`, `doc/NOTES.md`, this board and `doc/design/`'s four clusters,
and then deleted: what was left of it duplicated content that now has owners,
and an archive that duplicates git is not worth its drift.

The log's downstream side became `doc/HISTORY.md` — the arc, oldest first,
rewritten rather than appended to — so an overflowing log condenses into a story
instead of accumulating a second copy of the commit history. All core surfaces
moved to `doc/`; the root is `CLAUDE.md`, `README.md` and configuration.

Four drifts were found while seeding and are now recorded correctly: the
stylesheet count (six → **eight**), the chapter count (four → **five**, with
Test World on the level select), `Board.svelte` (~500 → **584**), and no shipped
level using a one-way. The last two are cards ([R-013], [R-004]).
`src/doc.test.ts` checks what a test can check about a documentation tree —
that every path written down resolves, that each cluster page indexes its own
tree, and that no content page creeps into the MEMORY index — with the
sample-size assertion `CLAUDE.md` requires.
