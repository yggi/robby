import { at } from '../engine/parse'
import type { World } from '../engine/types'

/**
 * Neighbour-aware tile geometry. The 3px seam collapses to zero wherever two
 * path tiles meet, and a corner only rounds when both adjacent sides are wall.
 * That is what turns a grid of squares into a continuous corridor.
 */
export function geom(world: World, x: number, y: number) {
  const wk = (X: number, Y: number) => {
    const c = at(world, { x: X, y: Y })
    return c.kind !== 'wall' && !(c.kind === 'fragile' && c.collapsed)
  }
  const n = wk(x, y - 1), e = wk(x + 1, y), s = wk(x, y + 1), w = wk(x - 1, y)
  const G = 3, R = 18
  return {
    in: `${n ? 0 : G}px ${e ? 0 : G}px ${s ? 0 : G}px ${w ? 0 : G}px`,
    rad: `${!n && !w ? R : 0}px ${!n && !e ? R : 0}px ${!s && !e ? R : 0}px ${!s && !w ? R : 0}px`,
    ori: e && w && !n && !s ? 'h' : n && s && !e && !w ? 'v' : '',
  }
}
