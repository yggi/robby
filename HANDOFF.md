# Handoff

For whoever picks this up next. It covers what the thing is, how it is built,
why it is built that way, where it is thin, and what I would do next.

Read `MEMORY.md` first if you are about to change code. This document is the
reasoning; that one is the list of things that will bite you.

---

## 1. Audience

Children of about four to seven. Specifically: **children who cannot read.**

That constraint is not a style choice, it is the design brief, and almost every
decision in this codebase follows from it:

- There is no text anywhere in the game loop. Not on the buttons, not in the
  feedback, not in the failure states. Names appear on room tiles and in the
  header, where an adult reading over a shoulder will use them and a child will
  slowly learn to recognise the shape of a word.
- Every state has to be **legible as motion or colour**. "Wrong" is a lunge into
  a wall and a pulsing ring. "I don't know where to go" is a head tilt and a
  question mark. "I still need this" is a thought bubble with a greyed-out
  battery in it.
- Sound carries meaning. Each direction has its own pitch, so the tray is
  learnable by ear before it is learnable by symbol.
- Targets are large, failure is cheap, and nothing is ever destroyed by a
  mistake. A failed run costs one tap to fix.

The secondary audience is the adult sitting next to them. That is who the room
names, the level select, the workshop prices and this document are for.

## 2. What the game teaches

Not "coding" in the sense of syntax. One idea, over and over:

> You write a plan. Then you watch what your plan actually does.

The gap between intention and execution is where all programming lives, and it
is legible to a four-year-old the moment a robot walks confidently into a wall.

The mechanic is built to make that gap visible and cheap:

- **You plan, then you run.** The plan is a strip of arrows. Pressing play is a
  commitment, and the world is frozen until you make it.
- **The ghost path previews the plan.** By the time a child presses play they
  have usually already seen where it goes, so play stops being "will this work?"
  and becomes "I want to watch it happen".
- **One instruction can buy a lot of travel.** A corridor bought by a single
  arrow is drawn as one continuous stroke. That is abstraction, shown rather
  than explained.
- **Failure is diagnostic, not punitive.** The wrong slot is ringed and stays
  ringed. The robot puts itself back. Nothing is lost.

Worlds escalate the *kind* of thinking, not just the token count: follow a path
→ choose between paths → work with machinery that moves you → work out an order
of operations.

## 3. Tech stack

- **Svelte 5** (runes: `$state`, `$derived`, `$effect`) + **TypeScript**
- **Vite 6** with `vite-plugin-singlefile`
- **Vitest** for engine tests, **jsdom** for behavioural smoke tests
- Build output: **one `dist/index.html`**, ~250 KB, no external requests

Two build decisions worth keeping:

**The bundle is an IIFE, not an ES module.** That was so the smoke suite could
drive the real built artefact in jsdom, which does not execute module scripts.
The side benefit is that the file runs from `file://` with no server, which is
how it gets onto a phone.

**The font travels with the file.** Baloo 2, latin woff2 subsets only, inlined
as base64. Fontsource also ships legacy `.woff`, which would double the payload
for browsers that no longer exist; a smoke check asserts exactly two font faces
and no legacy duplicate.

## 4. Architecture

```
src/
  engine/          pure TypeScript, no DOM, no timing, fully unit-tested
    types.ts       Dir, Cell, Item, Level, Chapter, Theme (+ THEMES const)
    parse.ts       ASCII map → World. The map format lives here.
    simulate.ts    the rules. isDecision, onEnter triggers, belts, the Trace
    solve.ts       BFS solver → shortest program or null
    levels.ts      every shipped level, as ASCII maps with a verified par
    generate.ts    procedural rooms for the practice tile
    editor.ts      the editor's model: drafts, painting, the verdict
  view/            Svelte + DOM. Owns time, easing, sound, everything visible
    game.svelte.ts the single state store; screens, run playback, camera, economy
    Board.svelte   the world: tiles, sprites, particles, the plan
    ...            Console, GameBar, Menu, Rooms, Store, Editor, Intro, MiniMap
  styles/          six stylesheets, imported in a fixed order
```

### The engine/view split

The engine turns a level and a program into a `Trace`: a list of frames, each
with `from`, `to`, `event`, `carried`, the `cmdIndex` that authorised it, and a
complete world snapshot. It knows nothing about milliseconds.

The view replays that trace, choosing how long each frame is held (`DUR` in
`game.svelte.ts`) and what it looks like.

This is the load-bearing decision of the codebase. It means:

- the solver, the generator and the editor all reason about real gameplay
- animations can be retimed without touching a rule
- the engine is testable in milliseconds, with no browser
- a companion character can exist who provably cannot affect the game

### The solver as infrastructure

`solve()` is not a dev tool, it is a component. It:

- **validates every shipped level** — pars are asserted minimal on every run
- **filters generated rooms** — including the differential test below
- **powers the editor** — live, on every finished stroke

The single most useful technique in this project is what I came to call the
**load-bearing test**: solve a candidate twice, once as built and once with the
world's mechanic disabled, and reject it unless the answer *changes*. Note it is
difference, not direction: removing World 1's decoys shortens par, while opening
World 2's blocked passage lengthens it, and both mean the mechanic was doing
work. That one filter took generator acceptance from 55% to 17% and would have
caught, automatically, both hand-built levels where a mechanic turned out to be
bypassable.

### State

One store, `createGame()` in `game.svelte.ts`, passed down as `g`. It holds the
screen, the chapter and level indices, the program, the playhead, the camera,
the economy and the editor hand-off. Components are views onto it.

`Chapter` is the unit of content, and this pays off twice: **practice rooms** and
**rooms a child built** are both assembled at runtime into a `Chapter` like any
other, so the level select, minimaps, playing, pips and the next button all work
on them with no special cases.

## 5. Visual and audio style

### Two visual languages

Deliberately unalike, and the composition depends on it:

- **The world** — illustrative, themed, continuous, alive. It changes completely
  between worlds.
- **The console and the status bar** — matte charcoal, flat, geometric, dead
  still. Identical in every world, forever. It is the remote control in the
  child's hands, not part of the fiction.

The world is framed between the two. The play button is the only circle on a
console of squares, and the only triangle in the app.

### The path is the thing that glows

Walls are negative space. The walkable region is drawn as a single continuous
ribbon: seams vanish where two path tiles meet, only outer corners round off,
and the whole floor layer carries **one** drop-shadow rather than one per tile.
That last detail is what makes it read as a surface rather than a grid.

### Colour

| Meaning | Colour | Rule |
| --- | --- | --- |
| power | orange `#ff7b45` | the battery, and the light in Robby when charged |
| go | teal `#17b9a0` | the play button |
| up / right / down / left | blue / green / yellow / red | canonical, everywhere |
| wrong | red ring | a marker *on* a slot, never a fill |

Direction colours run through the tray token, the filled slot and the planning
vector, so a pre-reader can match a colour on the map to a colour under their
thumb without decoding an arrow.

### Characters

**Robby** is the constant. He is never re-themed; the world changes around him.
Unpowered he slumps five degrees, his antenna droops flat, his eyes are grey
half-lidded slits that blink slowly. When he reaches the battery the gauge in
his chest fills left to right in the battery's own orange, and his eyes take
that same colour. *The colour he gains is literally the colour he absorbed.*
Nothing has to be written down.

**Funke** is pure companion, and the architecture guarantees it: the engine has
never heard of her. She trails one frame behind Robby — literally, her tile is
where he was on the previous frame, derived from the same trace, so she cannot
desync and needs no pathfinding. When idle she explores by breadth-first search,
walking real routes a tile at a time. She reacts to everything: startled by a
bonk with her tail bristling, head-tilted at a shrug, and on a win she bounces
in **counter-phase** with Robby — when he is up she is down — which is what makes
it read as a duet rather than a cat upstaging a robot.

### Animation

Idle life runs on long cycles with deliberately non-matching periods so nothing
ever syncs into a metronome: Robby glances about (11s) and shifts his weight
(17s); Funke twitches an ear (7.3s) and looks around (13s).

Celebrations are drawn at random from four flourishes each, so winning the same
room twice does not play the same clip. The smoke suite plays twelve of them and
asserts the variety is real.

Sound is a machine: square waves throughout, plus filtered white noise for servo
whirr and relay clack. Steps are a servo tick, not a note.

### The rocket, and departures

The rocket is not a reward animation, it is a **departure**. Winning an exit
level just celebrates on the pad. Robby and Funke climb aboard at the end of the
cheering and you can see them through the porthole — his orange eyes, her violet
ones with little ear triangles. The ship then sits there loaded, breathing, with
a pilot flame, until you press Next. Only then does it burn.

Between worlds an arrival card names where they have landed.

## 6. UX patterns worth preserving

**Grab what is under your finger.** In the editor, press bare ground and you
paint; press a piece and you carry it. A press that does not move is a tap,
which turns a conveyor. One vocabulary, no modes, no tool switching for the
commonest actions.

**Drag it off the edge to throw it away.** The room outlines in red while you
hold it out there. Robby is excluded — there is exactly one of him.

**Never make a child perform bookkeeping.** No reset button, no validate button,
no confirm dialog in the game loop. The one destructive action outside a level —
erasing progress — takes two taps and disarms itself after four seconds.

**Show the answer, do not score it.** The editor draws the solved route on the
room as you build. The ghost path previews a plan before it runs. The thought
bubble says what is still needed, and ticks it off the moment it is picked up.

**Camera as punctuation.** Winning pushes in on the celebration; pressing Next
swaps the level *inside* that tight framing, with transitions off, then pulls
back to reveal the new room. The change happens where it cannot be seen.

## 7. Testing

Three layers, and the split matters:

| Suite | What | Time |
| --- | --- | --- |
| `npm run test:unit` | the engine, the solver, every par, the generator, the editor model | ~5s |
| `npm test` | the above, plus a build, plus the fast smoke suite | ~15s |
| `npm run test:full` | plays levels through: celebrations, world transitions, the shop | ~2min |

The dividing rule is written into the fast suite: **if it needs the robot to
finish a run, it belongs in the full suite.** Waiting out step frames and a 2.6s
celebration is what took the old single suite to two minutes, and a two-minute
check is one nobody runs.

`test/harness.mjs` boots the real built artefact in jsdom. Two things in there
are not obvious and both were learnt the hard way:

- **A Web Animations shim that runs real timing.** Without it Svelte's out-
  transitions never finish, outgoing screens are never unmounted, and selectors
  silently pick up stale copies of removed screens. Before the shim existed, the
  throw from `Element.animate` aborted the effect queue and *every particle
  effect in the game was untestable*.
- **An uncaught-error collector.** jsdom hides these in its own console.

`test/run-smoke.mjs` gives each suite a hard timeout and exactly one retry, and
says plainly when a pass came from the retry rather than laundering flakiness
into green.

### How to test things you cannot see

jsdom has no layout engine, so nothing can measure a box. The approach that has
worked is to **test the rule instead of the pixel**: scrape the built CSS and
assert invariants over it. Every element placed at a board coordinate is matched
by a rule that sizes it; no two keyframes share a name; no board kind is styled
bare; no selector is defined twice; every theme has a palette. These have caught
more real bugs than any assertion about the DOM.

## 8. Open threads

Roughly in the order I would take them.

**Animation randomness is uneven.** Celebrations and lift paths vary; almost
nothing else does. Idle tics, bonks and pickups play identically every time.
There is a pattern to copy in `throwParty()`.

**Generation stops at World 2.** `generate.ts` has generators for the Lab
(self-avoiding corridors with decoy stubs) and the Forest (a trunk with side
branches and one overgrown passage). The Scrapyard and the Moon have none, and
the practice tile only appears in the first two worlds. The differential filter
would do its best work on conveyors — "solve it again with the belts turned to
floor" is precisely the check that catches a decorative conveyor.

**World 2 generation is near the edge of comfortable.** ~120ms median, ~560ms
worst on the main thread, with a spinner covering it. If a third generator lands
I would move generation into a worker rather than tune the budget again.

**The editor is a first slice.** It has floor, wall, battery, bridge and
conveyor. It has no gates or plates (a linked pair is inherently a two-step
interaction), no one-ways, no keys, no parts beyond a single battery, and no
multi-objective or rocket goals. Grid size is fixed at 9×7 and cannot be
changed. Undo exists but only from the toolbar.

**No story between rooms.** The rooms tell you *where* you are — the Sleep Bay
has his berth and Funke's basket beside it — but nothing connects them into a
journey. A wordless beat between rooms, Funke padding ahead through a doorway,
would turn thirty-two places into one adventure. The arrival card is the first
step in that direction.

**The workshop is one slot per character.** Antenna, tail, nose, four parts
each. Bits accumulate faster than there is anything to spend them on.

**~~Nothing has been tested with an actual child.~~** It has been now, and it
worked. See §11.

## 9. Weak points

**Name collisions.** Six so far, listed in `MEMORY.md`. Two guards exist and
both have since caught real regressions, but the underlying hazard remains:
board kinds become element classes, so any bare rule on `cog` or `belt` or
`exit` lands on the board. A naming convention — prefixing structural classes —
would end the category rather than policing it.

**`Board.svelte` is ~500 lines** and does too much: derivation, drag-free
rendering, particles, camera, Funke's AI. The particle code is imperative DOM
and could move to a module cleanly; Funke's roaming is self-contained and could
too.

**Editing this codebase with string splices is dangerous.** Three separate times
a replacement left the old block behind, and being later in the cascade it won,
so the "fix" never rendered. The cheese moon shipped a stale palette that way.
The duplicate-selector check exists because of it. In a real editor with real
diffs this is a non-issue — which is part of why this handover is happening.

**Some CSS is only verified by regex.** Checks like "the fins are pulled down
past the flame overhang" assert a literal `bottom:-6%` in the built file. They
catch deletion but not wrongness, and they need updating whenever the value is
retuned. A visual regression tool would replace a dozen of them.

**Accessibility beyond the target audience is thin.** There are `aria-label`s
throughout and `prefers-reduced-motion` is honoured properly, but it has never
been driven by keyboard end-to-end or heard through a screen reader.

**No error boundary.** If a render throws, the screen goes blank.

## 10. Extension ideas

- **Worlds 5+.** The engine already supports gates and plates (linked), keys,
  one-ways and multi-part manifests; only one-ways are entirely unused in
  shipped content. A world about *opening the way for yourself* — plates, gates,
  keys — is available for the writing.
- **Sharing a built room.** The map is `string[]`. A room is a short URL.
- **Two-player**, or a parent mode: one builds, the other solves.
- **A replay of your own wrong answer**, kept and offered back. Watching your
  earlier mistake next to your fix is a strong teaching beat.
- **Loops.** The most-requested next concept in this genre and the one I would
  be most careful with — repetition needs nesting in the strip, and retrofitting
  nesting into a flat list is the painful version. Design the strip for it
  before writing any of it.

## 11. What happened when a child played it

Emilia, five — the Emilia of the dedication.

**She solves every level in the game on her own.** All four worlds, unassisted.

The thing worth writing down is *how* she does it: **she makes the arrow shapes
with her hand as she reasons**, tracing the direction in the air before she
reaches for the token. Nobody taught her that and nothing in the game asks for
it. Some notes on what it means, and what it settles:

- The gap between plan and execution landed. She is not driving the robot; she
  is rehearsing a plan away from the board and then committing it. That is the
  entire thesis of §2, and it arrived without a word of text.
- The direction colours are doing their job. The gesture is a *direction*, not a
  symbol lookup — she is not decoding an arrow glyph, she is recalling a way to
  go and matching it under her thumb.
- The three tuning numbers §8 said to watch were guesses that came out right.
  The 380ms step, the bonk shudder and one-tap slot removal all survived contact
  with the only user who matters, and none of them needs revisiting on current
  evidence.

**The editor is the runaway success**, and it was shipped as "a first slice".
She loves it, and it turned the game into something played *between* people:
she and her father build rooms for each other to solve. An adult building with
belts and bridges can make rooms that are a real challenge for older children,
so the ceiling is far higher than the shipped content suggests.

That reorders §8 completely. The editor's missing pieces — gates and plates,
one-ways, keys, multi-part goals, a grid that is not fixed at 9×7 — are no
longer a rough edge on a side feature. They are the constraint on the part of
this that people actually use, and I would take them before anything else in
that list. Sharing a built room (§10: "the map is `string[]`, a room is a short
URL") stops being a neat idea and becomes the obvious next feature, because
rooms are already being passed between people by hand.

The one thing still untested is the beginning: Emilia had an adult beside her
the first time. Whether a child meets Robby cold and gets moving is a different
question from whether the game is solvable, and it is the one I would watch next.

## 12. Handover checklist

- `npm install && npm test` should be green in about fifteen seconds.
- `npm run check:full` before any release.
- There is no git history; this arrived as a directory. First commit should be
  the whole tree, and `LOG.md` is the narrative that history would otherwise
  have carried.
- No secrets, no accounts, no network calls, no analytics. Keep it that way; it
  is a children's game that works on a plane.

---

A closing note, since it shaped everything. This started as a conversation about
a mecha simulator and became a game about a robot who has run out of power and
his cat. The best decisions in it were not clever: separating the rules from the
pixels, letting a solver be the judge of quality, and treating a four-year-old
as somebody who deserves to be told the truth about what their plan did.

The dedication on the title screen is not decoration. Build for her.
