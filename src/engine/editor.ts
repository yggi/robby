import { charFor } from './legend'
import { derive } from './level'
import { simulate } from './simulate'
import {
  OBJECTIVES, posKey, type Dir, type Goal, type ItemKind, type Level, type Theme,
} from './types'

/**
 * The editor's model, kept out of the view so it can be tested without a finger.
 *
 * A draft is a grid of map characters and nothing else. Par, tray and
 * playability are never stored — they are asked of the solver whenever the grid
 * changes. That is the whole design: there is no validate step to forget, and a
 * saved room cannot carry a par that has gone stale.
 */

/**
 * Robby is not a brush. There is always exactly one of him and he can never be
 * removed, so he is placed with the room and moved by dragging — a palette
 * button for him could only ever be used wrongly.
 *
 * `object` is one brush rather than five: it paints whatever kind it is
 * currently set to, and that kind is changed by tapping it — on the tool tile
 * to choose what lands next, or on a placed one to change what is already
 * there. Same for the conveyor's direction. A palette of nine buttons would not
 * fit under a thumb, and a child would have to read it.
 */
export type Brush = 'wall' | 'floor' | 'object' | 'fragile' | 'belt'

/**
 * The characters the editor paints with, read off the legend rather than typed
 * out again. Each of these is now a statement of *what the brush places*, so it
 * cannot drift from what the parser will read back.
 */
export const WALL = charFor({ cell: 'wall' })
export const FLOOR = charFor({ cell: 'floor' })
export const ROBOT = charFor({ cell: 'floor', start: true })
export const ROCKET = charFor({ cell: 'exit' })

/**
 * The ring the object brush walks, in the order a room grows in ambition: the
 * battery every first room is about, the three repair parts, and then the
 * rocket that asks for all of them. Read off the legend, so a kind cannot be
 * offered here that the parser will not read back.
 */
export const OBJECTS = [
  charFor({ cell: 'floor', item: 'battery' }),
  charFor({ cell: 'floor', item: 'cog' }),
  charFor({ cell: 'floor', item: 'coil' }),
  charFor({ cell: 'floor', item: 'core' }),
  ROCKET,
]
export const nextObject = (ch: string) => OBJECTS[(OBJECTS.indexOf(ch) + 1) % OBJECTS.length]

export interface Draft {
  theme: Theme
  /** what a child called it; blank until they say otherwise */
  name?: string
  /**
   * How many of each arrow the player is given. Left alone it follows the
   * answer, but an author can tighten it — a room with one spare arrow and a
   * room with five are quite different puzzles from the same map.
   */
  tray?: Partial<Record<Dir, number>>
  /**
   * Row-major grid of map characters — terrain and objects. **Never `R`.**
   *
   * Robby used to be a character in here, which is why `paint` had to refuse
   * his cell: painting him would have deleted him, and there is only one of
   * him. So the floor under him could not be changed, and moving him wrote
   * plain floor behind, destroying whatever tile he had been standing on.
   */
  cells: string[][]
  /** where Robby stands. He is a character in the *map*, not in the grid. */
  start: [number, number]
}

/** Grids stay small: an open room is both a poor puzzle and a slow one to solve. */
export const MAX_W = 11
export const MAX_H = 9

/**
 * A room that already works. Starting from a blank grid meant the first thing a
 * child saw was "needs robot and battery" — a complaint before they had done
 * anything. This starts as the simplest playable room there is: a corridor with
 * Robby at one end and a battery at the other, solvable in one arrow.
 */
export function starterDraft(theme: Theme, w = 9, h = 7): Draft {
  const W = Math.min(w, MAX_W)
  const H = Math.min(h, MAX_H)
  const cells = Array.from({ length: H }, () => Array.from({ length: W }, () => WALL))
  const y = (H / 2) | 0
  for (let x = 1; x < W - 1; x++) cells[y][x] = FLOOR
  cells[y][W - 2] = OBJECTS[0]
  return { theme, cells, start: [1, y] }
}

/**
 * A draft from a map — a saved room on its way back into the editor, or a room
 * written out longhand in a test. Robby is lifted out of the characters into
 * `start`, leaving plain floor where he stood.
 *
 * This was written by hand at the one call site that needed it
 * (`game.svelte.ts`), which is also where the room's saved tray was being
 * dropped on the way in — so editing a room silently loosened it.
 */
export function draftFrom(
  map: string[],
  o: { theme: Theme; name?: string; tray?: Partial<Record<Dir, number>> },
): Draft {
  const cells = map.map((r) => r.split(''))
  let start: [number, number] = [0, 0]
  cells.forEach((row, y) =>
    row.forEach((ch, x) => {
      if (ch !== ROBOT) return
      start = [x, y]
      row[x] = FLOOR
    }),
  )
  return { theme: o.theme, name: o.name, tray: o.tray, cells, start }
}

export const width = (d: Draft) => d.cells[0].length
export const height = (d: Draft) => d.cells.length
export const cellAt = (d: Draft, x: number, y: number) => d.cells[y]?.[x] ?? WALL
/**
 * Every cell of the grid is paintable, the outermost ring included.
 *
 * It used to be `x > 0 && … < width - 1`, which reserved a one-tile wall border
 * and left a 9×7 room with a 7×5 interior. Nothing said so: the hint layer drew
 * the same faint square on a border cell as on any other, so pressing the edge
 * was a silent no-op. The border was never load-bearing either — `at()` in
 * `parse.ts` returns wall for anything outside the map, so a floor tile on the
 * edge is walled in by the outside world at no cost.
 *
 * Renamed from `inside` deliberately: the predicate means something else now,
 * and a caller that wanted the old meaning should fail to compile rather than
 * quietly get the new one.
 */
export const within = (d: Draft, x: number, y: number) =>
  x >= 0 && y >= 0 && x < width(d) && y < height(d)

/**
 * The draft as a map — the save format, unchanged.
 *
 * Robby is written back in at `start`. Nothing is lost by that: a draft only
 * saves once the verdict is `ok`, and `standing()` below refuses anything but
 * plain floor under him, so the character `R` replaces is always the `.` it
 * already means.
 */
export const draftMap = (d: Draft): string[] =>
  d.cells.map((row, y) =>
    row.map((ch, x) => (x === d.start[0] && y === d.start[1] ? ROBOT : ch)).join(''),
  )

/** Is Robby standing on ground a robot can stand on? */
export const standing = (d: Draft) => cellAt(d, d.start[0], d.start[1]) === FLOOR

/** Is this where Robby is? */
export const isStart = (d: Draft, x: number, y: number) =>
  d.start[0] === x && d.start[1] === y

/**
 * A draft is copied on every stroke, so undo is a stack of drafts and nothing
 * has to be diffed. It must copy the *whole* draft: this listed `theme` and
 * `cells` only, so naming a room or tightening its tray and then painting one
 * more tile threw both away. `Editor.svelte` happened to rebuild them with a
 * spread of its own, which is why it never showed.
 */
export const cloneDraft = (d: Draft): Draft => ({ ...d, cells: d.cells.map((r) => [...r]) })

/**
 * Conveyors turn on the spot rather than needing four buttons of their own,
 * and they turn clockwise, which is what a tap reads as.
 */
const TURN: Dir[] = ['right', 'down', 'left', 'up']
export const BELTS = TURN.map((dir) => charFor({ cell: 'belt', dir }))
export const rotated = (ch: string) => BELTS[(BELTS.indexOf(ch) + 1) % BELTS.length]

/**
 * What a brush lays down. The two that carry a setting take it as an argument
 * rather than holding one: the model stays a pure function of the draft and the
 * stroke, and the current kind lives in the screen that shows it.
 */
export const charOf = (brush: Brush, kind: string): string =>
  brush === 'wall' ? WALL
  : brush === 'floor' ? FLOOR
  : brush === 'fragile' ? charFor({ cell: 'fragile' })
  : kind

/** Whether a brush is the one that made this character — what a tap cycles. */
export const owns = (brush: Brush, ch: string) =>
  (brush === 'belt' && BELTS.includes(ch)) || (brush === 'object' && OBJECTS.includes(ch))

/**
 * Write one character, keeping the room's two singletons true.
 *
 * There is one rocket — `parseMap` keeps the last `@` it reads, so a second one
 * would silently disable the first — and Robby is never in `cells` at all.
 */
function write(d: Draft, x: number, y: number, ch: string): Draft {
  if (!within(d, x, y) || cellAt(d, x, y) === ch) return d
  const next = cloneDraft(d)
  if (ch === ROCKET)
    next.cells.forEach((row, ry) =>
      row.forEach((c, rx) => {
        if (c === ROCKET) next.cells[ry][rx] = FLOOR
      }),
    )
  next.cells[y][x] = ch
  return next
}

/**
 * Paint one cell. Returns a new draft, so undo is a stack of drafts and nothing
 * has to be diffed.
 *
 * It no longer refuses the cell Robby is standing on. He is not in `cells`, so
 * there is nothing to overwrite — the floor under him is ground like any other,
 * and painting a wall there is a thing a child may do and be told about
 * (`assess`'s `ground` verdict) rather than a thing that silently does nothing.
 */
export const paint = (d: Draft, x: number, y: number, brush: Brush, kind: string): Draft =>
  write(d, x, y, charOf(brush, kind))

/** Turn a conveyor on the spot. Anything else is left alone. */
export function rotate(d: Draft, x: number, y: number): Draft {
  const ch = cellAt(d, x, y)
  return BELTS.includes(ch) ? write(d, x, y, rotated(ch)) : d
}

/** Change a placed object into the next kind along the ring. */
export function cycle(d: Draft, x: number, y: number): Draft {
  const ch = cellAt(d, x, y)
  return OBJECTS.includes(ch) ? write(d, x, y, nextObject(ch)) : d
}

/**
 * Pick up whatever is on a cell, or nothing.
 *
 * **Only things, never terrain.** This used to be "anything that is not `#` or
 * `.`", which made conveyors and bridges carryable by accident of the rule
 * rather than by decision — so a press on one picked it up instead of painting,
 * and no brush could overdraw it. What can be carried is now what a child would
 * call a thing: the parts, the rocket, and Robby.
 */
export function grab(d: Draft, x: number, y: number): string | null {
  if (isStart(d, x, y)) return ROBOT
  const ch = cellAt(d, x, y)
  return OBJECTS.includes(ch) ? ch : null
}

/** Robby is the one thing that cannot be thrown away. */
export const removable = (ch: string) => ch !== ROBOT

/**
 * Carry a piece from one cell to another.
 *
 * Robby moves without touching `cells` at all, so the tile he was standing on
 * survives — it used to be written back as plain floor, which quietly erased a
 * conveyor or a bridge every time he was dragged off one. He can be put down
 * anywhere, including on a wall; the verdict says so rather than the drop being
 * refused, because a refused drop is a thing that has to be explained.
 */
export function move(d: Draft, from: [number, number], to: [number, number]): Draft {
  const held = grab(d, from[0], from[1])
  if (!held) return d
  if (to[0] === from[0] && to[1] === from[1]) return d
  if (!within(d, to[0], to[1])) return d
  if (held === ROBOT) return { ...cloneDraft(d), start: [to[0], to[1]] }
  const cleared = cloneDraft(d)
  cleared.cells[from[1]][from[0]] = FLOOR
  return write(cleared, to[0], to[1], held)
}

/** Dragged off the edge of the room: put it down outside and it is gone. */
export function discard(d: Draft, from: [number, number]): Draft {
  const held = grab(d, from[0], from[1])
  if (!held || !removable(held)) return d
  return write(d, from[0], from[1], FLOOR)
}

/**
 * What the room is, said in the four ways a room can be.
 *
 * There is no `needs: string[]` any more. It held English words — `"robot"`,
 * `"battery"` — which were printed into a bar in a game whose whole design
 * brief is that the player cannot read. Each state is now a thing Robby's
 * thought bubble can show.
 */
export type Verdict =
  /** nothing in the room to go and get */
  | { status: 'target' }
  /** Robby is standing on something that is not floor */
  | { status: 'ground' }
  /** no answer inside `DRAFT_DEPTH` — unreachable, or simply too long */
  | { status: 'nopath' }
  | { status: 'ok'; par: Dir[]; level: Level; route: string[] }

const count = (map: string[], ch: string) =>
  map.reduce((n, row) => n + [...row].filter((c) => c === ch).length, 0)

/** Every objective kind lying in a map, in the legend's order. */
export const objectivesIn = (map: string[]): ItemKind[] =>
  OBJECTIVES.filter((kind) => count(map, charFor({ cell: 'floor', item: kind })))

/**
 * What finishing this room means — derived from the room, never chosen.
 *
 * A rocket in the room makes it an errand: fetch everything lying about, *then*
 * fly. Without one it is a collect-the-lot. Both callers ask this, because a
 * saved room that came back as the wrong kind of goal would be played at a par
 * that is not true, which is the one thing `doc/MEMORY.md` §8 promises cannot
 * happen.
 */
export const goalFor = (map: string[]): Goal =>
  count(map, ROCKET) ? { type: 'exit', requires: objectivesIn(map) } : { type: 'collect' }

/**
 * What a room is still missing before it is worth asking the solver about.
 *
 * This check comes first and cannot be skipped: `satisfied()` is true the
 * moment no objectives remain, so a grid with nothing to fetch is *won at step
 * zero*. Handing a blank room to the solver would have it reported back as a
 * perfectly good level.
 *
 * It runs on the map rather than on a `Draft` because both callers need it —
 * the editor assessing what a child is building, and a saved room arriving from
 * storage. `playable()` used to skip it, and a room with no `R` therefore threw
 * out of `parseMap` rather than dropping quietly out of the list.
 *
 * A rocket counts as a target on its own: driving to the rocket with an empty
 * manifest is the simplest room in the game, not a broken one.
 */
export const hasTarget = (map: string[]) =>
  !!(count(map, ROCKET) || objectivesIn(map).length)

export const complete = (map: string[]) => count(map, ROBOT) === 1 && hasTarget(map)

/** Ask the solver what it makes of the draft. */
export function assess(d: Draft): Verdict {
  const map = draftMap(d)
  if (!hasTarget(map)) return { status: 'target' }
  // before the solver, and it has to be: the map writes `R` over whatever is
  // under him, so a draft with him on a wall would otherwise solve as if the
  // wall were floor and save as a room he could never have started in
  if (!standing(d)) return { status: 'ground' }

  const level = derive(map, {
    id: 'mine-draft',
    theme: d.theme,
    room: 'My Room',
    goal: goalFor(map),
    tray: d.tray,
  })
  if (!level) return { status: 'nopath' }

  // the route, so the editor can show the answer rather than just score it
  const route = simulate(level, level.par).frames.map((f) => posKey(f.to))
  return { status: 'ok', par: level.par, level, route: [...new Set(route)] }
}

/* ── saved rooms ───────────────────────────────────────────────────────── */

export interface SavedRoom {
  id: string
  theme: Theme
  map: string[]
  name?: string
  tray?: Partial<Record<Dir, number>>
}

/**
 * Turn a saved room back into a playable level. Par is solved for again on the
 * way in, so a room saved before an engine change can never be played at a par
 * that is no longer true — it simply drops out of the list instead.
 *
 * Dropping out is the *only* failure allowed here. This runs inside a `$derived`
 * over everything in storage, so anything that throws takes the whole screen
 * with it — which is why the completeness check is not optional.
 */
export function playable(room: SavedRoom, n: number): Level | null {
  if (!room?.map?.length || !complete(room.map)) return null
  return derive(room.map, {
    id: room.id,
    theme: room.theme,
    room: room.name?.trim() || `Room ${n}`,
    goal: goalFor(room.map),
    tray: room.tray,
  })
}
