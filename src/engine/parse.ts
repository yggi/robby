import { cellOf, glyphFor } from './legend'
import type { Cell, Item, Level, Vec2, World } from './types'

/**
 * ASCII map → World.
 *
 * The legend itself lives in `legend.ts`, as a table that this reads and the
 * editor, the generator and the minimap read too. It used to be an if-else
 * ladder here with a comment above it, and four partial re-statements
 * elsewhere.
 */

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
    // short rows are walled rather than ragged, so a map may be drawn to the
    // shape of its room rather than padded out by hand
    const row = rows[y].padEnd(w, '#')
    for (let x = 0; x < w; x++) {
      const g = glyphFor(row[x])
      // an unknown character is bare floor: a map is written by hand, and a
      // typo should leave a room playable rather than un-parseable
      cells.push(g ? cellOf(g) : { kind: 'floor' })
      if (!g) continue
      if (g.start) start = { x, y }
      if (g.cell === 'exit') exit = { x, y }
      if (g.item) items.push({ id: `${g.ch}${items.length}`, kind: g.item, at: { x, y } })
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
