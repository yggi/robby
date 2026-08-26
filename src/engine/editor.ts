import { charFor } from './legend'
import { derive } from './level'
import { simulate } from './simulate'
import { posKey, type Dir, type Level, type Theme } from './types'

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
 */
export type Brush = 'wall' | 'floor' | 'battery' | 'fragile' | 'belt'

/**
 * The characters the editor paints with, read off the legend rather than typed
 * out again. Each of these is now a statement of *what the brush places*, so it
 * cannot drift from what the parser will read back.
 */
export const WALL = charFor({ cell: 'wall' })
export const FLOOR = charFor({ cell: 'floor' })
const ROBOT = charFor({ cell: 'floor', start: true })

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
  /** row-major grid of map characters, including the wall border */
  cells: string[][]
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
  cells[y][1] = ROBOT
  cells[y][W - 2] = CHAR.battery
  return { theme, cells }
}

export const width = (d: Draft) => d.cells[0].length
export const height = (d: Draft) => d.cells.length
export const cellAt = (d: Draft, x: number, y: number) => d.cells[y]?.[x] ?? WALL
export const inside = (d: Draft, x: number, y: number) =>
  x > 0 && y > 0 && x < width(d) - 1 && y < height(d) - 1

export const draftMap = (d: Draft): string[] => d.cells.map((r) => r.join(''))
/**
 * A draft is copied on every stroke, so undo is a stack of drafts and nothing
 * has to be diffed. It must copy the *whole* draft: this listed `theme` and
 * `cells` only, so naming a room or tightening its tray and then painting one
 * more tile threw both away. `Editor.svelte` happened to rebuild them with a
 * spread of its own, which is why it never showed.
 */
export const cloneDraft = (d: Draft): Draft => ({ ...d, cells: d.cells.map((r) => [...r]) })

const CHAR: Record<Brush, string> = {
  wall: WALL,
  floor: FLOOR,
  battery: charFor({ cell: 'floor', item: 'battery' }),
  fragile: charFor({ cell: 'fragile' }),
  belt: charFor({ cell: 'belt', dir: 'right' }),
}

/**
 * Conveyors turn on the spot rather than needing four buttons of their own,
 * and they turn clockwise, which is what a tap reads as.
 */
const TURN: Dir[] = ['right', 'down', 'left', 'up']
export const BELTS = TURN.map((dir) => charFor({ cell: 'belt', dir }))
export const rotated = (ch: string) => BELTS[(BELTS.indexOf(ch) + 1) % BELTS.length]

/**
 * Paint one cell. Returns a new draft, so undo is a stack of drafts and nothing
 * has to be diffed.
 */
export function paint(d: Draft, x: number, y: number, brush: Brush): Draft {
  if (!inside(d, x, y)) return d
  // Robby is never painted over: he cannot be replaced, only moved
  if (cellAt(d, x, y) === ROBOT) return d
  const ch = CHAR[brush]
  if (cellAt(d, x, y) === ch) return d

  const next = cloneDraft(d)
  next.cells[y][x] = ch
  return next
}

/** Turn a conveyor on the spot. Anything else is left alone. */
export function rotate(d: Draft, x: number, y: number): Draft {
  const ch = cellAt(d, x, y)
  if (!BELTS.includes(ch)) return d
  const next = cloneDraft(d)
  next.cells[y][x] = rotated(ch)
  return next
}

/** Pick up whatever is on a cell. Plain ground and walls are painted, not carried. */
export function grab(d: Draft, x: number, y: number): string | null {
  const ch = cellAt(d, x, y)
  return ch === WALL || ch === FLOOR ? null : ch
}

/** Robby is the one thing that cannot be thrown away. */
export const removable = (ch: string) => ch !== ROBOT

function place(d: Draft, x: number, y: number, ch: string): Draft {
  if (!inside(d, x, y) || cellAt(d, x, y) === ROBOT) return d
  const next = cloneDraft(d)
  next.cells[y][x] = ch
  return next
}

export function move(d: Draft, from: [number, number], to: [number, number]): Draft {
  const held = grab(d, from[0], from[1])
  if (!held) return d
  if (to[0] === from[0] && to[1] === from[1]) return d
  if (!inside(d, to[0], to[1]) || cellAt(d, to[0], to[1]) === ROBOT) return d
  const cleared = cloneDraft(d)
  cleared.cells[from[1]][from[0]] = FLOOR
  return place(cleared, to[0], to[1], held)
}

/** Dragged off the edge of the room: put it down outside and it is gone. */
export function discard(d: Draft, from: [number, number]): Draft {
  const held = grab(d, from[0], from[1])
  if (!held || !removable(held)) return d
  const next = cloneDraft(d)
  next.cells[from[1]][from[0]] = FLOOR
  return next
}

export type Verdict =
  | { status: 'empty'; needs: string[] }
  | { status: 'unreachable' }
  | { status: 'ok'; par: Dir[]; level: Level; route: string[] }

const count = (map: string[], ch: string) =>
  map.reduce((n, row) => n + [...row].filter((c) => c === ch).length, 0)

/**
 * What a room is still missing before it is worth asking the solver about.
 *
 * This check comes first and cannot be skipped: `satisfied()` is true the
 * moment no objectives remain, so a grid with no battery on it is *won at step
 * zero*. Handing a blank room to the solver would have it reported back as a
 * perfectly good level.
 *
 * It runs on the map rather than on a `Draft` because both callers need it —
 * the editor assessing what a child is building, and a saved room arriving from
 * storage. `playable()` used to skip it, and a room with no `R` therefore threw
 * out of `parseMap` rather than dropping quietly out of the list.
 */
export function missing(map: string[]): string[] {
  const needs: string[] = []
  if (count(map, ROBOT) !== 1) needs.push('robot')
  if (!count(map, CHAR.battery)) needs.push('battery')
  return needs
}

/** Ask the solver what it makes of the draft. */
export function assess(d: Draft): Verdict {
  const map = draftMap(d)
  const needs = missing(map)
  if (needs.length) return { status: 'empty', needs }

  const level = derive(map, {
    id: 'mine-draft',
    theme: d.theme,
    room: 'My Room',
    tray: d.tray,
  })
  if (!level) return { status: 'unreachable' }

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
  if (!room?.map?.length || missing(room.map).length) return null
  return derive(room.map, {
    id: room.id,
    theme: room.theme,
    room: room.name?.trim() || `Room ${n}`,
    tray: room.tray,
  })
}
