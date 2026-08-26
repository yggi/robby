# LOG.md — worklog

Append-only. **Newest first**, above the numbered history. What was actually
done, and closed cards. Not plans, not open questions.

**Target: 1000 lines, act at 1200** (`CLAUDE.md`). At 1200, cut the oldest
sections into a `docs/log/` archive and link them here. Cut back to 1000 or
under: an archive pass that leaves you at 1199 is one you will repeat.

Entry format:

```
## YYYY-MM-DD — title
Cards: [id] ...
What happened, in past tense. Anything tried and rejected, and why.
```

Everything below the first entry is the **narrative history** — written from the
whole project in the order things happened, because this project had no git
history when it arrived, and because *why* something is the way it is turned out
to matter more than what it is. It is numbered rather than dated for that
reason. New work goes above it, dated.

---

## 2026-08-26 — the surfaces

Cards: [R-000] closed. `BOARD.md`, `NOTES.md` and `META.md` created;
`docs/design/` seeded; `HANDOFF.md` archived.

`CLAUDE.md` was a briefing that pointed at three documents. It is now a contract:
a read order, a write order, and five surfaces that each have a stated job, a
target size and a line at which they get condensed rather than shaved. Structure
follows `laborsim`, which has been running it long enough to have opinions about
the band.

**`HANDOFF.md` was the problem this solves.** 418 lines holding durable truth,
method lessons, open questions and work-to-do *at once* — four surfaces in a
trench coat, which is why none of it could be kept current: there was nowhere to
put an update that did not also mean re-reading the other three kinds of thing.
It has been distributed and archived at `docs/handoff-2026-08.md`, with a header
saying it is a record.

Rejected on the way: **deleting it.** §11 is the only playtest that exists and
the document is the best account of a particular moment; a record that is clearly
marked as a record costs nothing and cannot mislead. Also rejected: **leaving it
at the root as a second entrypoint.** Two documents claiming to be the briefing
is the drift hazard the whole structure exists to remove, and it would have
started on the first session that updated one of them.

**Three drifts were found while seeding**, all of the same kind — the tree moved
and the prose did not:

- **six stylesheets → eight.** `index.css` imports eight, and the comment at the
  top of that file is right where the docs were wrong.
- **four worlds → five chapters.** `chapters` is
  `[lab, forest, scrapyard, cheeseMoon, testWorld]` and the level select shows
  six tiles. Test World ships to players. `README.md` knew; `HANDOFF.md` and
  `MEMORY.md` did not, and §11's "all four worlds" reads differently once you
  know there is a fifth on the menu. Now a thread in `NOTES.md`, because the
  question is not a fact to record but a decision nobody made.
- **`Board.svelte` ~500 → 584 lines**, and the view has **nine plain modules**
  the architecture description elides behind an ellipsis — about 1,200 lines, a
  third of the view. Now in the repo map, and the file is a card.

A fourth thing turned up while writing the rules page: **no shipped level
anywhere uses a one-way**, though `parse.ts` parses `^ v < >`, `simulate.ts`
runs them and `solve.ts` solves them. Test World's own comment claims "every
trigger the engine supports has a level here". Carded as [R-004], with the check
that keeps the claim true rather than a promise to remember.

`src/docs.test.ts` checks the parts of a documentation tree a test can check:
every markdown path written down resolves, every cluster page indexes its own
tree, and no content page has crept into the `MEMORY.md` index. Each of the
three was verified by **planting the fault and watching it fail** — a broken
link, an unindexed page, a content page in the index — and each carries the
sample-size assertion `CLAUDE.md` requires, because the alternative is the
`(0 checked)` incident again with different subjects.

---

## 1. The mechanic, before any code

It began as a conversation, not a commit. A children's coding game, a robot that
has to pick something up.

The first real decision was about movement, and it changed everything. The
obvious model — one arrow per tile — was rejected for something better: **you
tell the robot what to do at decisions, and it walks itself between them.**

The rule settled as: *the robot runs straight until it can or must change; it
consumes an instruction unless carrying straight on is the only option.* Corners
consume. Side openings consume. Dead ends consume. And on a fully open grid,
where every tile is a junction, it degenerates neatly to one arrow per tile —
which became the reveal at the end of World 1's curve.

Also settled here, before a line was written: absolute arrows rather than
turn-left/turn-right, because mental rotation mostly is not there before six;
auto-pickup rather than a grab command, keeping the vocabulary purely
directional; and no reset step, because a failed run should clean up after
itself.

## 2. The engine, and the decision that carried the project

The first code was a pure TypeScript simulator with a Vitest suite and
hand-written levels — no rendering at all. `simulate(level, program)` returned a
trace of frames; the view would later replay it.

Then the BFS solver, and with it the practice that defines this codebase: **par
is not authored, it is derived, and asserted minimal on every test run.**

It paid immediately. A hand-written par for the return-trip level was wrong — I
had forgotten that the battery tile becomes a corner once the bridge behind it
collapses. The solver said 4, not 3, before any pixels existed.

## 3. Making it a game

A Svelte 5 slice, then a single-file build. Several rebuilds happened in this
stretch, each fixing something structural:

- Rebuilding `innerHTML` every frame silently killed every CSS transition,
  including the robot's travel. Persistent nodes, patched.
- Tiles became a **continuous ribbon** — neighbour-aware seams, outer corners
  only, one shared drop-shadow. The path became a surface rather than a grid.
- The world and the console split into two deliberately unalike visual
  languages, and the console stopped changing between levels.
- Real arrows replaced triangles, because the play button was also a triangle.

Then themes: house, garden, city, factory, ship. The city taught a lesson twice
— a side-on skyline behind a top-down road — that had to be learnt again later
when the lab got a papered wall. Backdrops are seen from directly overhead.

## 4. Feel

A long stretch of tuning, most of it about honesty of feedback.

The bonk became the most important animation in the game: a lunge a quarter of a
tile into the wall, squash, recoil, dust, and the offending slot ringed and left
ringed. The reset button was removed entirely — the robot drives itself home and
the program is untouched — which forced `blame` to become real state, since the
ring is then the only thing pointing at the mistake.

Planning dots became **vectors**: one continuous coloured stroke for a run
bought by a single instruction, because dots made every tile look equally
expensive. Direction colours were fixed as canonical, which forced the blamed
slot to stop being a red fill and become a red ring, since left was now red.

Bits arrived — coins that flip between 0 and 1 — and with them the economy that
later justified the workshop.

## 5. Worlds

Four of them, each about a different kind of thinking, each par verified.

- **The Lab.** Robby's home; the clutter is the reason each room has one way
  through. Corners, then junctions. Props are hand-placed at authored
  coordinates, because a hash-scattered wall of plausible junk says nothing
  while a charger over the tile he wakes on says everything.
- **The Mechanical Forest.** Alternative routes and passages shut for good. Two
  Ways and Bramble are the same room twice — in the first both routes work and
  use the same three arrows, in the second one is overgrown.
- **The Scrapyard.** Conveyors, and trays with a direction missing. Not one par
  in that world spends a `left`; Grand Tour is the thesis in one instruction —
  the battery is one step to his left, there is no left, and a single `right`
  sends him round all four belt directions and delivers him onto it.
- **The Cheese Moon.** Bridges that hold once. The question stops being *which
  way* and becomes *in which order*. The finale lands him on the rocket short-
  handed, so the last part is a walk the length of the moon and back.

Two design bugs in this stretch were caught by tests rather than by eye: a
delivery belt running under an arm let the optimal route skip a whole loop, and
a "three homecomings" assertion failed at two.

## 6. Characters

Funke arrived as a companion with a hard constraint: **the engine has never
heard of her.** She trails one frame behind Robby, derived from the same trace,
so she cannot desync and needs no pathfinding.

She was briefly given a spotlight on wins — bigger, in front, three pounces —
and it was wrong. She now bounces in counter-phase with him: when he is up she
is down. It reads as a duet.

Later she stopped teleporting through walls when idle and started exploring by
breadth-first search, walking real routes a tile at a time.

The rocket became a departure rather than a reward: they board at the end of the
cheering, you can see them through the porthole, the ship sits loaded and
breathing, and only Next makes it burn.

## 7. Tooling, and the recurring enemy

The smoke suite grew until it took two minutes, at which point it was split: a
ten-second structural pass that runs on every change, and an opt-in behavioural
pass that plays levels through. The dividing rule is written into the fast
suite: if it needs the robot to finish a run, it belongs in the slow one.

The suites got a hard timeout and one retry, which announces itself rather than
laundering a flaky pass into green.

And running through the whole project, one enemy: **name collisions.** Six of
them, each producing a symptom that looked like anything but its cause.

- `.exit` matched the floor tile under the rocket
- `.screen.play` matched the play *button* — control assertions were testing a div
- two `@keyframes roll` meant Robby's treads ran the dice animation twenty times
  a second
- `.tray` gave the arrow tray the parts bin's `overflow-x: auto`, clipping the
  count badges
- `.cog` turned the cog *part* into a 22px spinning disc — which is why levels
  with parts looked broken and battery levels did not
- `.grid` was both the level select and the editor

Each fix added a guard. The guards now catch these mechanically, and one of them
caught my own collision inside the same session it was written.

## 8. Generation

A design round first, then a slice. The insight was that the solver already
existed, so generation could be **generate-and-test** rather than
correct-by-construction: build shape deliberately, filter quality with the
solver.

The filter that mattered was the **load-bearing test** — solve twice, once with
the world's mechanic disabled, and reject unless the answer changes. It took
acceptance from 55% to 17%, which is the point.

Practice rooms pay one bit, are never recorded as solved, and roll another when
finished. The roller was later given a time budget and a cached fallback, after
it turned out it could return nothing at all and silently open a curated room
wearing a Practice title.

## 9. The editor

Design round, then build. Same insight, pushed further: **the solver runs live.**
Lift your finger and the room re-solves; the answer draws itself on the grid;
the tray is derived from the par. There is no validate button because there is
nothing for one to do.

The gesture vocabulary is one rule — grab what is under your finger — with tap
to rotate a conveyor and drag off the edge to throw a piece away.

Two structural choices paid off. Rooms a child builds are assembled at runtime
into a `Chapter` like any other, so the level select, minimaps, playing and pips
all work with no special cases. And a saved room stores **the map and nothing
else**: par and tray are solved for again on load, so a saved room can never
carry a stale par.

## 10. The last stretch

Polish, and two instructive bugs.

The arrival card between worlds exposed an ordering bug that had always been
there: `playhead` survived the level change and indexed into a trace that no
longer had that many frames. Nothing had rendered between those two statements
before; a 3.4-second pause is what made it visible.

And the rocket, which sat wrong for three rounds. The CSS was applying exactly
as written — I checked the built file — but `height: 82%` was resolving against
an auto-sized grid row, an indefinite height, so the numbers I kept adjusting
did not mean anything. Positioned against the tile box instead, and it landed
first try.

That one is the lesson I would most want to pass on: when something will not
move, stop adjusting the number and go and find out what it resolves against.

---

**Where it ended up:** four worlds of eight rooms, a bench world, an endless
practice room, a workshop, a level editor, 259 unit tests, 190 fast checks, 141
behavioural checks, and one 250 KB HTML file that runs from a phone with no
network.

For Emilia.

---

## 11. Emilia played it

The dedication stopped being aspirational.

She is five, and she solves every level in the game on her own. While she thinks
she **makes the arrow shapes with her hand** — tracing the direction in the air
before she picks up the token. Nothing in the game asks for that. It is a child
rehearsing a plan away from the board and then committing it, which is the one
idea the whole thing was built to teach, arriving without a word of text.

The surprise was the editor. It shipped as "a first slice" and it is the part
that took hold: she and her father build rooms for each other to solve. Belts
and bridges in adult hands make rooms that are hard for much older children, so
the ceiling is a long way above the shipped content.

That reorders the open threads in `HANDOFF.md`. The editor's missing pieces are
not a rough edge on a side feature any more, and sharing a room by URL stops
being a neat idea the moment rooms are already being passed between people.

Written up properly in `HANDOFF.md` §11.
