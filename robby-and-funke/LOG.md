# Development log

Written from the whole history, in the order things happened. It is here because
this project has no git history, and because *why* something is the way it is
turned out to matter more than what it is.

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
practice room, a workshop, a level editor, 259 unit tests, 189 fast checks, 141
behavioural checks, and one 250 KB HTML file that runs from a phone with no
network.

For Emilia.
