# HISTORY.md — how the project got here

The arc, at low resolution: what was decided, what was reversed, and what each
turn cost. `doc/LOG.md` is what happened *this session*, in detail; this is
what happened *to the project*, in the shape somebody arriving needs.

**Target: 250 lines, act at 300** (`CLAUDE.md`). Oldest first, because it is a
story rather than a feed. The target sits below `doc/MEMORY.md`'s on purpose:
current truth outranks how it was arrived at, so this file may never be the
longest thing in the repo.

**It is rewritten, not appended to.** When `doc/LOG.md` goes over its line, its
oldest sessions are *folded into the paragraph they belong to* and deleted — not
moved here intact. A verbatim archive is what git already is; what git cannot
give you cheaply is the arc, because it hands you commits rather than periods,
and changes rather than changes of mind.

A month becomes a section, a quarter a paragraph, a year a line. The file
converges; if it does not, it is being appended to.

---

## Before any code — the decision that changed everything

It began as a conversation, not a commit: a children's coding game, a robot that
has to pick something up.

The first real decision was about movement. The obvious model — **one arrow per
tile** — was rejected for something better: *you tell the robot what to do at
decisions, and it walks itself between them.* The rule settled as **the robot
runs straight until it can or must change; it consumes an instruction unless
carrying straight on is the only option**, and that one predicate turned out to
generate the whole game. Corners, side openings and dead ends all consume — and
on a fully open grid, where every tile is a junction, it degenerates neatly back
to one arrow per tile, which became the reveal at the end of World 1's curve.
The rejected model is still in there, as the hardest case.

Three more things were settled before a line was written, and none has been
revisited: **absolute arrows** rather than turn-left/turn-right, because mental
rotation mostly is not there before six; **auto-pickup** rather than a grab
command, keeping the vocabulary purely directional; and **no reset step**,
because a failed run should clean up after itself.

## The engine, and the split that carried the project

The first code was a pure TypeScript simulator with a Vitest suite and
hand-written levels — no rendering at all. `simulate(level, program)` returned a
trace of frames; the view would replay it later. That split — rules that know
nothing about milliseconds, a view that owns all of them — is the decision
everything else rests on, and it was made before there was anything to render.

Then the BFS solver, and with it the practice that defines this codebase: **par
is not authored, it is derived, and asserted minimal on every test run.** It
paid immediately: a hand-written par for the return-trip level was wrong — the
battery tile becomes a corner once the bridge behind it collapses — and the
solver said 4 where the author had said 3, before any pixels existed. It went on
to become infrastructure rather than a tool, judging generated rooms and running
live in the editor.

## Making it a game, and a lesson learnt twice

A Svelte 5 slice, then a single-file build, and several rebuilds — each fixing
something structural rather than cosmetic. Rebuilding `innerHTML` every frame
silently killed **every CSS transition**, the robot's travel included; persistent
nodes, patched. Tiles became a **continuous ribbon** — neighbour-aware seams,
outer corners only, one shared drop-shadow — which is what makes the path read as
a surface and the walls as negative space. The world and the console split into
**two deliberately unalike visual languages**, and the console stopped changing
between levels. Real arrows replaced triangles, because the play button was also
a triangle.

Then the themes, and a lesson that had to be learnt twice: the city shipped a
side-on **skyline** behind a top-down road, and later the lab shipped a papered
**wall** with lamps on cords. The board is seen from directly overhead and
backdrops must match. Both looked obviously wrong the moment they shipped, which
is the tell that the rule was known and not applied.

## Feel — a long stretch about the honesty of feedback

The bonk became the most important animation in the game: a lunge a quarter of a
tile into the wall, squash, recoil, dust, and the offending slot ringed and
**left** ringed. Removing the reset button entirely is what forced the rest —
with no reset the robot has to drive itself home with the program untouched,
which means `blame` has to become **real state** that survives the run that
produced it.

Planning dots became **vectors** in the same spirit: one continuous coloured
stroke for a run bought by a single instruction, because dots made every tile
look equally expensive and taught the opposite of the rule. Direction colours
were fixed as canonical, which immediately cost something — left was now red, so
the blamed slot could no longer be a red fill and became a red **ring**. That is
the shape these decisions keep taking: give a colour one meaning, run out of
colours, reach for shape.

Bits arrived, and with them the economy that later justified the workshop.

## Four worlds, each about a different kind of thinking

Not four difficulty tiers. Four questions.

- **The Lab.** Robby's home; the clutter is the *reason* each room has one way
  through. Props are hand-placed at authored coordinates, because a
  hash-scattered wall of plausible junk says nothing while a charger over the
  tile he wakes on says everything.
- **The Mechanical Forest.** Alternative routes, and passages shut for good. Two
  Ways and Bramble are deliberately the same room twice: in the first both
  routes work and use the same three arrows, in the second one is overgrown.
- **The Scrapyard.** Conveyors, and trays with a direction missing. **Not one
  par in that world spends a `left`.** Grand Tour is the thesis in a single
  instruction — the battery is one step to his left, there is no left, and one
  `right` sends him round all four belt directions and delivers him onto it.
- **The Cheese Moon.** Bridges that hold once, so the question stops being
  *which way* and becomes *in which order*.

Two design bugs here were caught by tests rather than by eye: a delivery belt
running under an arm let the optimal route skip a whole loop, and a "three
homecomings" assertion failed at two. Both were rooms that looked right and were
not, which is the case the solver exists for.

## Characters, and one reversal worth remembering

Funke arrived as a companion under a hard constraint: **the engine has never
heard of her.** She trails one frame behind Robby, derived from the same trace,
so she cannot desync and needs no pathfinding at all — a subsystem replaced by a
line of derivation that cannot go wrong. Later she stopped teleporting through
walls when idle and started exploring by breadth-first search.

She was briefly given a spotlight on wins: bigger, in front, three pounces. It
was wrong, and the fix was one sign — she now bounces in **counter-phase** with
him, and it reads as a duet rather than a cat upstaging a robot.

The rocket became a **departure rather than a reward**: they board at the end of
the cheering, you can see them through the porthole, the ship sits loaded and
breathing with a pilot flame, and only Next makes it burn. A reward animation is
something the game does to you; a departure is something you release.

## Tooling, and the recurring enemy

The smoke suite grew until it took two minutes, at which point it stopped being
run during work and started being run before pushing — the wrong end. It was
split on a rule that needs no judgement: **if it needs the robot to finish a
run, it belongs in the slow suite.** The fast one is ~15s, which is the only
property that matters about it. Both suites got a hard timeout and exactly one
retry, which **announces itself** rather than laundering a flake into green.

And running through the whole project, one enemy: **name collisions**, six of
them, each producing a symptom that looked like anything but its cause — a
`.cog` rule that turned the cog *part* into a spinning disc on the board, which
is why levels with parts looked broken and battery levels did not. The six are
listed with their symptoms in `doc/design/code/conventions.md`. Each fix added
a guard, and one guard caught its author's own collision inside the session it
was written. They are still guards, though: they fire after the mistake, and
ending the category rather than policing it is open work.

## Generation — the solver was already there

A design round first, then a slice. The insight was that generation could be
**generate-and-test** rather than correct-by-construction, because the judge
already existed: build shape deliberately, filter quality with the solver.

The filter that mattered is the **load-bearing test** — solve twice, once with
the world's mechanic disabled, and reject unless the answer *changes*. It took
acceptance from 55% to 17%, which is the point rather than the cost, and it
would have caught both hand-built levels where a mechanic turned out to be
bypassable.

Practice rooms pay one bit, are never recorded as solved, and roll another when
finished. The roller was later given a time budget and cached fallbacks, after
it turned out it could return nothing at all and silently open a curated room
wearing a Practice title.

## The editor — the same insight, pushed further

Design round, then build. **The solver runs live**: lift your finger and the
room re-solves, the answer draws itself on the grid, and the tray is derived
from the par. There is no validate button because there is nothing for one to
do. The gesture vocabulary is one rule — *grab what is under your finger* — with
tap to rotate a conveyor and drag off the edge to throw a piece away.

Two structural choices paid off later. Rooms a child builds are assembled at
runtime into a `Chapter` like any other, so the level select, minimaps, playing
and pips all work with no special cases. And a saved room stores **the map and
nothing else**: par and tray are solved for again on load, so a saved room can
never carry a stale par — which is also what makes a room shareable as a URL.

## The last stretch — two instructive bugs

The arrival card between worlds exposed an ordering bug that had always been
there: `playhead` survived the level change and indexed into a trace that no
longer had that many frames. Nothing had ever rendered between those two
statements before; a 3.4-second pause is what made it visible.

And the rocket, which sat wrong for three rounds. The CSS was applying exactly
as written — the built file was checked — but `height: 82%` was resolving
against an auto-sized grid row, an indefinite height, so the numbers being
adjusted did not mean anything. Positioned against the tile box instead, it
landed first try.

That is the lesson most worth passing on, and it generalises past CSS: **when
something will not move, stop adjusting the number and find out what it resolves
against.**

## Emilia played it

The dedication stopped being aspirational.

She is five, and she solves every level on her own. While she thinks she **makes
the arrow shapes with her hand**, tracing the direction in the air before she
picks up the token. Nothing in the game asks for that. It is a child rehearsing
a plan away from the board and then committing it — the one idea the whole thing
was built to teach, arriving without a word of text.

The surprise was the editor. It shipped as "a first slice" and it is the part
that took hold: she and her father build rooms for each other to solve. Belts
and bridges in adult hands make rooms that are hard for much older children, so
the ceiling is a long way above the shipped content.

That reordered everything. The editor's missing pieces stopped being a rough
edge on a side feature and became the constraint on the part people use, and
sharing a room by URL stopped being a neat idea the moment rooms were already
being passed between people by hand. The full account is
`doc/design/game/playtest.md`.

## The documents caught up

For most of the project the whole briefing was one 418-line handover holding
durable truth, method lessons, open questions and work-to-do at once — four
surfaces in a trench coat, which is why none of it could be kept current. It was
distributed into the surfaces described in `CLAUDE.md` and deleted; its best
part, the playtest, is a page of its own now.

The seeding pass immediately found four drifts of exactly the kind the structure
exists to prevent, all the same shape — the tree moved and the prose did not:
six stylesheets that are eight, four worlds that are five chapters with a
developer bench among them, a 500-line component that is 584, and **no shipped
level using a one-way** though the engine parses, simulates and solves them.

The response was not to be more careful. It was `src/doc.test.ts`, which fails
when a written-down path stops resolving or an index stops matching its tree.

## Where it stands

Four authored worlds of eight rooms, a bench world, an endless practice room, a
workshop, a level editor, 266 unit tests, 142 fast checks, and one ~250 KB HTML
file that runs from a phone with no network.

The one shape worth recording as *history* rather than status: **the editor is
the game now**, and the shipped curve is the smaller half of what people do with
this. Everything at the top of `doc/BOARD.md` follows from that.

For Emilia.
