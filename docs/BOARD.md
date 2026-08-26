# BOARD.md — task board

One task per card. Cards carry *what* and *done-when*, never rationale — that
belongs in `docs/MEMORY.md` or `docs/NOTES.md`.

**Targets:** `doing` 3 · `ready` 10 · `backlog` 40 · `history` 10.
**Act at** 4 · 12 · 48 · 12 (`CLAUDE.md`). History past its target moves to
`docs/LOG.md`; ready past its target means a card goes back to backlog, not that
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

Order comes from the playtest (`docs/design/game/playtest.md`), which reordered
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
  in one direction is the cheapest hard room an adult can build.
- **done-when:** one-ways can be painted and turned, and a room built with one
  solves with the same par the solver derives.
- **needs:** R-004 (the same check proves it is reachable at all)

### [R-003] The editor can ask for more than one thing
- **what:** multi-part manifests and the rocket goal exist in the engine
  (`Goal.exit` with `requires`) and are unreachable from the editor, which
  places a single battery and nothing else. This is what lets a built room be
  about *order*, which is the whole of World 4.
- **done-when:** a built room can require two parts and a rocket, and the
  thought bubble ticks them off as it does in a shipped level.

### [R-004] Every cell kind appears in a shipped level, and a check says so
- **what:** Test World's comment claims one room per mechanic; no shipped level
  anywhere uses a one-way. Add the missing room(s) and the check that keeps the
  claim true. Scrape `CellKind` and `ItemKind` from the engine, walk every map
  in `chapters`, fail on a kind nothing uses — and assert the sample was
  non-empty, per `CLAUDE.md`.
- **done-when:** the check exists, it fails when a room is removed, and it
  passes.

### [R-005] The grid is not fixed at 9×7
- **what:** editor rooms are 9×7 and cannot be resized. An adult building for an
  older child runs out of room; a small child wants fewer tiles, not more. The
  solver cost is the constraint — open space is what makes `solve()` expensive
  — so a bigger grid needs the depth cap thought about, not just the numbers
  changed.
- **done-when:** the grid can be sized in the editor, and the live verdict still
  returns fast enough not to be felt on the largest size offered.

### [R-006] A room is a URL
- **what:** the map is `string[]` and rooms already save as the map string and
  nothing else, so a built room is a short link. Par and tray are re-solved on
  load, which means a shared room cannot arrive with a stale par — and a link
  that no longer solves must drop out rather than open wrong.
- **done-when:** a link opens somebody else's room, playable, with a par derived
  on arrival; and it works from `file://` with no network.

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
- **done-when:** `docs/design/game/playtest.md` has a second session in it, and
  the board has whatever cards it produced.

### [R-010] End the name-collision category
- **what:** six collisions so far, and the two guards fire after the mistake.
  Prefix structural classes so a board kind cannot collide with a component
  class by construction, and keep the guards as a net.
- **done-when:** a bare rule on a board kind name is impossible to write by
  accident, and the guards still pass.

---

## backlog

### [R-011] Randomness below the celebration line
- **what:** idle tics, bonks and pickups play identically every time; the
  pattern to copy is in `throwParty()`. Blocked on where the line goes — see the
  thread in `docs/NOTES.md`, which argues feedback should *not* vary.
- **done-when:** the things that reward you vary, the things that tell you what
  happened do not, and the smoke suite asserts the variety is real.
- **needs:** NOTES thread "what should vary"

### [R-012] A wordless beat between rooms
- **what:** thirty-two rooms and no journey between them. Funke padding ahead
  through a doorway, no text, no tap, and skippable by the second time.
- **done-when:** finishing a room leads into the next one rather than cutting to
  it, and it can be sat through twice without wanting to be skipped.
- **needs:** NOTES thread "thirty-two rooms, no journey"

### [R-013] `Board.svelte` is doing five jobs
- **what:** 584 lines holding derivation, rendering, particles, the camera and
  Funke's roaming AI. Two of those come out cleanly: the particle code is
  imperative DOM and wants to be a module, and Funke's breadth-first roaming is
  self-contained.
- **done-when:** particles and Funke's roaming are modules, and `Board.svelte`
  renders.

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
  (`docs/design/game/playtest.md`); this is the version the game knows about.
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

### [R-021] Driven by keyboard, once, end to end
- **what:** aria-labels and reduced-motion are in; nothing has been driven by
  keyboard or heard through a screen reader. Do it once and write down what it
  was like before deciding what it should be.
- **done-when:** the game is completable without a pointer, and
  `docs/NOTES.md`'s keyboard thread has an answer in it.
- **needs:** NOTES thread "is there a keyboard story at all?"

---

## history

### [R-000] The agentic structure, seeded from the handover — **closed**
`CLAUDE.md` was a briefing that pointed at three documents; it is now a contract
with a read order, a write order, gates, and six surfaces that each have a
target size and a line where they get condensed. The old `HANDOFF.md` was one
418-line document holding durable truth, method lessons, open questions and
work-to-do at once — four surfaces in a trench coat, and the reason none of it
could be kept current. It was distributed into `docs/MEMORY.md`,
`docs/META.md`, `docs/NOTES.md`, this board and `docs/design/`'s four clusters,
and then deleted: what was left of it duplicated content that now has owners,
and an archive that duplicates git is not worth its drift.

The log's downstream side became `docs/HISTORY.md` — the arc, oldest first,
rewritten rather than appended to — so an overflowing log condenses into a story
instead of accumulating a second copy of the commit history. All core surfaces
moved to `docs/`; the root is `CLAUDE.md`, `README.md` and configuration.

Four drifts were found while seeding and are now recorded correctly: the
stylesheet count (six → **eight**), the chapter count (four → **five**, with
Test World on the level select), `Board.svelte` (~500 → **584**), and no shipped
level using a one-way. The last two are cards ([R-013], [R-004]).
`src/docs.test.ts` checks what a test can check about a documentation tree —
that every path written down resolves, that each cluster page indexes its own
tree, and that no content page creeps into the MEMORY index — with the
sample-size assertion `CLAUDE.md` requires.
