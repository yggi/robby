import { passable } from '../engine/simulate'
import { neighbours, posKey, type Vec2, type World } from '../engine/types'

/**
 * Where Funke can get to, and where she goes next.
 *
 * She used to pick a tile within two squares and slide to it, which took her
 * straight through walls — a cat teleporting across a corner. Now she walks: a
 * breadth-first search finds a real route, and she takes it a tile at a time.
 *
 * Both functions here are pure, which is the point of the file. The clock —
 * how fast she pads, how long she waits between strolls — lives in the view,
 * because time is the view's job (`doc/design/code/architecture.md`).
 */

/** How far from home she is willing to wander. */
export const REACH = 6

/**
 * Every tile reachable from `home` within `reach` steps, each mapped to the
 * route that gets there. The route excludes `home` itself and ends on the
 * tile it is keyed by.
 *
 * Passability is the **engine's own predicate**, not a shorter one written out
 * here. This used to test wall and blocked only, so she padded across shut
 * gates and bridges that had already fallen.
 */
export function routesFrom(world: World, home: Vec2, reach = REACH): Map<string, Vec2[]> {
  const seen = new Map<string, Vec2[]>()
  seen.set(posKey(home), [])
  const queue: Vec2[] = [home]
  while (queue.length) {
    const p = queue.shift()!
    const route = seen.get(posKey(p))!
    if (route.length >= reach) continue
    for (const n of neighbours(p)) {
      if (seen.has(posKey(n))) continue
      if (!passable(world, n)) continue
      seen.set(posKey(n), [...route, n])
      queue.push(n)
    }
  }
  return seen
}

/**
 * The next walk she takes, from wherever she is standing to somewhere she has
 * not been lately — or `null` when there is nowhere worth going.
 *
 * Routes are held from **Robby's** tile, so a walk starting anywhere else has
 * to be re-rooted: she retraces her own route back out to him and carries on
 * from there. That is what keeps every step a neighbour of the last, which is
 * the property that stops her crossing a wall between two legal tiles.
 *
 * `pick` is the only impurity the caller supplies — pass a seeded chooser and
 * this function is deterministic, which is what makes it testable.
 */
export function nextStroll(
  routes: Map<string, Vec2[]>,
  here: Vec2,
  home: Vec2,
  lately: string[],
  pick: (n: number) => number = (n) => Math.floor(Math.random() * n),
): Vec2[] | null {
  const from = routes.get(posKey(here))
  const elsewhere = [...routes.entries()].filter(
    ([k, route]) => route.length > 0 && k !== posKey(here),
  )
  // somewhere new if there is one, otherwise anywhere at all rather than
  // standing still: pacing the same two squares still reads as a live cat
  const fresh = elsewhere.filter(([k]) => !lately.includes(k))
  const options = fresh.length ? fresh : elsewhere
  if (!options.length) return null
  const target = options[Math.min(pick(options.length), options.length - 1)]
  if (!target) return null

  // walk back out to Robby's tile, then on to the target
  const back = from?.length ? [...from.slice(0, -1).reverse(), home] : []
  return [...back, ...target[1]]
}
