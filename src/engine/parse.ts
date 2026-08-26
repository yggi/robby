import type { Cell, Dir, Item, Level, Vec2, World } from './types'

/**
 * LEGEND
 *   #        wall
 *   .        floor
 *   R        robot start (floor)
 *   *        battery   (pickup, objective)
 *   k        key       (pickup, opens every gate on contact)
 *   1-9      gate, closed, link id = digit
 *   A-I      pressure plate, opens gate 1-9 (A->1, B->2, ...)
 *   ^ v < >  one-way floor: may only be exited in that direction
 *   ~        fragile floor: collapses once the robot steps off it
 *   @        the rocket: the way out, if the manifest is satisfied
 *   c s x    cog, coil and core: parts, collectable in any order
 *   =        a way through that is blocked for good
 *   N E S W  a conveyor running north, east, south or west
 */

const BELT: Record<string, Dir> = { N: 'up', E: 'right', S: 'down', W: 'left' }

const ONEWAY: Record<string, Dir> = {
  '^': 'up',
  v: 'down',
  '<': 'left',
  '>': 'right',
}

export interface Parsed {
  world: World
  start: Vec2
  exit: Vec2 | null
  items: Item[]
}

export function parseMap(rows: string[]): Parsed {
  const h = rows.length
  const w = Math.max(...rows.map((r) => r.length))
  const cells: Cell[] = []
  const items: Item[] = []
  let start: Vec2 | null = null
  let exit: Vec2 | null = null

  for (let y = 0; y < h; y++) {
    const row = rows[y].padEnd(w, '#')
    for (let x = 0; x < w; x++) {
      const ch = row[x]
      let cell: Cell = { kind: 'floor' }

      if (ch === '#') cell = { kind: 'wall' }
      else if (ch === '~') cell = { kind: 'fragile', collapsed: false }
      else if (ch === '@') { cell = { kind: 'exit' }; exit = { x, y } }
      else if (ch === '=') cell = { kind: 'blocked' }
      else if (BELT[ch]) cell = { kind: 'belt', dir: BELT[ch] }
      else if (ch in ONEWAY) cell = { kind: 'oneway', only: ONEWAY[ch] }
      else if (ch >= '1' && ch <= '9')
        cell = { kind: 'gate', link: Number(ch), open: false }
      else if (ch >= 'A' && ch <= 'I')
        cell = { kind: 'plate', link: ch.charCodeAt(0) - 64 }
      else if (ch === 'R') start = { x, y }
      else if (ch === '*')
        items.push({ id: `b${items.length}`, kind: 'battery', at: { x, y } })
      else if (ch === 'k')
        items.push({ id: `k${items.length}`, kind: 'key', at: { x, y } })
      else if (ch === 'c')
        items.push({ id: `c${items.length}`, kind: 'cog', at: { x, y } })
      else if (ch === 's')
        items.push({ id: `s${items.length}`, kind: 'coil', at: { x, y } })
      else if (ch === 'x')
        items.push({ id: `x${items.length}`, kind: 'core', at: { x, y } })

      cells.push(cell)
    }
  }

  if (!start) throw new Error('level has no R (robot start)')
  return { world: { w, h, cells }, start, exit, items }
}

export function levelStart(level: Level): Parsed {
  return parseMap(level.map)
}

export function at(world: World, p: Vec2): Cell {
  if (p.x < 0 || p.y < 0 || p.x >= world.w || p.y >= world.h)
    return { kind: 'wall' }
  return world.cells[p.y * world.w + p.x]
}

export function cloneWorld(world: World): World {
  return { w: world.w, h: world.h, cells: world.cells.map((c) => ({ ...c })) }
}
