import { solve } from './solve'
import { DIRS, spend, type Dir, type Goal, type Level, type Theme } from './types'

/**
 * Turning a map into a playable level: the one place that asks the solver what
 * a room is worth.
 *
 * Three callers used to do this dance longhand — the generator judging a
 * candidate, the editor assessing a draft, and the editor loading a saved room.
 * All three built the same placeholder `Level`, solved it, derived a tray from
 * the answer and patched the two back in; all three spelled the all-nines tray
 * as a bare literal with no explanation of what it was for. The copies had
 * already drifted: only one of them checked that the room was complete before
 * handing it to the solver.
 */

/**
 * A tray the solver cannot be limited by.
 *
 * `withinTray` (`solve.ts`) prunes any program that spends more of a direction
 * than the tray holds, which is right when playing and wrong when *deriving*
 * par — the tray is the thing being worked out. Nine of everything is past any
 * par this game accepts, so the search runs unconstrained.
 *
 * It is not a "generous default": handing a real tray to `probe` would silently
 * cap the answer and produce a par that is minimal only within that tray.
 */
export const OPEN_TRAY: Level['tray'] = { up: 9, right: 9, down: 9, left: 9 }

/**
 * How deep to search a room somebody is building.
 *
 * Solving is exponential in depth and dominated by open space, so the cap is
 * the longest answer the editor is willing to call a room, plus nothing. A
 * draft that needs more than this reads as unsolvable, which is the honest
 * answer for a room a child is meant to finish.
 */
export const DRAFT_DEPTH = 14

/**
 * The tray a room is played with.
 *
 * Unasked, it is forgiving: the answer plus one spare of each, so a wrong turn
 * can always be walked back out of. Given the author's own counts it honours
 * them — but never below what the answer actually spends, because a tray that
 * cannot hold the solution is not a harder room, it is a broken one.
 */
export function trayFor(par: Dir[], chosen?: Partial<Record<Dir, number>>): Level['tray'] {
  const floor = spend(par)
  const tray: Level['tray'] = {}
  for (const d of DIRS) tray[d] = chosen ? Math.max(floor[d], chosen[d] ?? floor[d]) : floor[d] + 1
  return tray
}

export interface ProbeOpts {
  id: string
  theme: Theme
  room?: string
  goal?: Goal
  /** the author's tray, if they have tightened it */
  tray?: Partial<Record<Dir, number>>
}

/**
 * An unsolved level: everything the solver needs to run, and nothing it is
 * meant to work out. `par` is empty and the tray is open on purpose — this is
 * the question, not the answer.
 */
export const probe = (map: string[], o: ProbeOpts): Level => ({
  id: o.id,
  theme: o.theme,
  room: o.room,
  map,
  goal: o.goal ?? { type: 'collect' },
  tray: OPEN_TRAY,
  par: [],
})

/**
 * Ask the solver about a map, and hand back the finished level or nothing.
 *
 * **The caller must have checked the room is complete first.** `satisfied()`
 * is true the moment no objectives remain, so a grid with no battery is won at
 * step zero — the empty par below is the only defence here, and it is a
 * backstop rather than the check. See `assess()` in `editor.ts`.
 */
export function derive(map: string[], o: ProbeOpts, depth = DRAFT_DEPTH): Level | null {
  const level = probe(map, o)
  const par = solve(level, depth)
  if (!par || !par.length) return null
  return { ...level, par, tray: trayFor(par, o.tray) }
}
