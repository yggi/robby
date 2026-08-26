import { simulate } from './simulate'
import { solve } from './solve'
import { DIRS, type Dir, type Level, type Theme } from './types'

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

export const WALL = '#'
export const FLOOR = '.'

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
  cells[y][1] = 'R'
  cells[y][W - 2] = '*'
  return { theme, cells }
}

export const width = (d: Draft) => d.cells[0].length
export const height = (d: Draft) => d.cells.length
export const at = (d: Draft, x: number, y: number) => d.cells[y]?.[x] ?? WALL
export const inside = (d: Draft, x: number, y: number) =>
  x > 0 && y > 0 && x < width(d) - 1 && y < height(d) - 1

export const toMap = (d: Draft): string[] => d.cells.map((r) => r.join(''))
export const clone = (d: Draft): Draft => ({ theme: d.theme, cells: d.cells.map((r) => [...r]) })

const CHAR: Record<Brush, string> = {
  wall: WALL,
  floor: FLOOR,
  battery: '*',
  fragile: '~',
  belt: 'E',
}

/** Conveyors turn on the spot rather than needing four buttons of their own. */
export const BELTS = ['E', 'S', 'W', 'N'] as const
export const rotated = (ch: string) => BELTS[(BELTS.indexOf(ch as 'E') + 1) % BELTS.length]

/**
 * Paint one cell. Returns a new draft, so undo is a stack of drafts and nothing
 * has to be diffed.
 */
export function paint(d: Draft, x: number, y: number, brush: Brush): Draft {
  if (!inside(d, x, y)) return d
  // Robby is never painted over: he cannot be replaced, only moved
  if (at(d, x, y) === 'R') return d
  const ch = CHAR[brush]
  if (at(d, x, y) === ch) return d

  const next = clone(d)
  next.cells[y][x] = ch
  return next
}

/** Turn a conveyor on the spot. Anything else is left alone. */
export function rotate(d: Draft, x: number, y: number): Draft {
  const ch = at(d, x, y)
  if (!BELTS.includes(ch as 'E')) return d
  const next = clone(d)
  next.cells[y][x] = rotated(ch)
  return next
}

/** Pick up whatever is on a cell. Plain ground and walls are painted, not carried. */
export function grab(d: Draft, x: number, y: number): string | null {
  const ch = at(d, x, y)
  return ch === WALL || ch === FLOOR ? null : ch
}

/** Robby is the one thing that cannot be thrown away. */
export const removable = (ch: string) => ch !== 'R'

function place(d: Draft, x: number, y: number, ch: string): Draft {
  if (!inside(d, x, y) || at(d, x, y) === 'R') return d
  const next = clone(d)
  next.cells[y][x] = ch
  return next
}

export function move(d: Draft, from: [number, number], to: [number, number]): Draft {
  const held = grab(d, from[0], from[1])
  if (!held) return d
  if (to[0] === from[0] && to[1] === from[1]) return d
  if (!inside(d, to[0], to[1]) || at(d, to[0], to[1]) === 'R') return d
  const cleared = clone(d)
  cleared.cells[from[1]][from[0]] = FLOOR
  return place(cleared, to[0], to[1], held)
}

/** Dragged off the edge of the room: put it down outside and it is gone. */
export function discard(d: Draft, from: [number, number]): Draft {
  const held = grab(d, from[0], from[1])
  if (!held || !removable(held)) return d
  const next = clone(d)
  next.cells[from[1]][from[0]] = FLOOR
  return next
}

export type Verdict =
  | { status: 'empty'; needs: string[] }
  | { status: 'unreachable' }
  | { status: 'ok'; par: Dir[]; level: Level; route: string[] }

const count = (d: Draft, ch: string) =>
  d.cells.reduce((n, row) => n + row.filter((c) => c === ch).length, 0)

/** What the answer needs, plus one spare of each — the forgiving default. */
export function trayFor(par: Dir[]): Level['tray'] {
  const tray: Level['tray'] = {}
  for (const dir of DIRS) tray[dir] = par.filter((p) => p === dir).length + 1
  return tray
}

/** The fewest of each arrow a room can be played with at all. */
export const trayFloor = (par: Dir[]): Record<Dir, number> =>
  Object.fromEntries(DIRS.map((d) => [d, par.filter((p) => p === d).length])) as Record<Dir, number>

/**
 * The author's counts, never allowed below what the answer actually spends —
 * a tray that cannot hold the solution is not a harder room, it is a broken one.
 */
export function resolveTray(par: Dir[], chosen?: Partial<Record<Dir, number>>): Level['tray'] {
  if (!chosen) return trayFor(par)
  const floor = trayFloor(par)
  const tray: Level['tray'] = {}
  for (const d of DIRS) tray[d] = Math.max(floor[d], chosen[d] ?? floor[d])
  return tray
}

export const draftLevel = (d: Draft, id = 'mine-draft'): Level => ({
  id,
  theme: d.theme,
  room: 'My Room',
  map: toMap(d),
  goal: { type: 'collect' },
  tray: { up: 9, right: 9, down: 9, left: 9 },
  par: [],
})

/**
 * Ask the solver what it makes of the draft.
 *
 * The completeness check has to come first and cannot be skipped: `satisfied()`
 * is true the moment no objectives remain, so a grid with no battery on it
 * solves instantly at par zero. Handing a blank room to the solver would have
 * it reported as a perfectly good level.
 */
export function assess(d: Draft): Verdict {
  const needs: string[] = []
  if (count(d, 'R') !== 1) needs.push('robot')
  if (!count(d, '*')) needs.push('battery')
  if (needs.length) return { status: 'empty', needs }

  const level = draftLevel(d)
  const par = solve(level, 14)
  if (!par || !par.length) return { status: 'unreachable' }

  // the route, so the editor can show the answer rather than just score it
  const route = simulate({ ...level, par }, par).frames.map((f) => `${f.to.x},${f.to.y}`)
  return {
    status: 'ok',
    par,
    level: { ...level, par, tray: resolveTray(par, d.tray) },
    route: [...new Set(route)],
  }
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
 */
export function playable(room: SavedRoom, n: number): Level | null {
  const level: Level = {
    id: room.id,
    theme: room.theme,
    room: room.name?.trim() || `Room ${n}`,
    map: room.map,
    goal: { type: 'collect' },
    tray: { up: 9, right: 9, down: 9, left: 9 },
    par: [],
  }
  const par = solve(level, 14)
  if (!par || !par.length) return null
  return { ...level, par, tray: resolveTray(par, room.tray) }
}
