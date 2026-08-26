import { describe, expect, it } from 'vitest'
import { LEGEND, LINKS, charFor, cellOf, glyphFor } from './legend'
import { chapters } from './levels'
import { parseMap } from './parse'
import { CELL_KINDS, ITEM_KINDS, posKey } from './types'

const allLevels = chapters.flatMap((c) => c.levels)

/**
 * The legend is the save format. A room built by a child is stored as its map
 * string and nothing else, so a character that changes meaning silently
 * rewrites every room anybody has already made — which is why these are
 * assertions rather than a comment.
 */
describe('the legend', () => {
  it('gives every kind of tile a character', () => {
    const homeless = CELL_KINDS.filter((k) => !LEGEND.some((g) => g.cell === k))
    expect({ checked: CELL_KINDS.length, homeless }).toEqual({
      checked: CELL_KINDS.length,
      homeless: [],
    })
    expect(CELL_KINDS.length).toBeGreaterThan(5)
  })

  it('gives every kind of item a character', () => {
    const homeless = ITEM_KINDS.filter((k) => !LEGEND.some((g) => g.item === k))
    expect({ checked: ITEM_KINDS.length, homeless }).toEqual({
      checked: ITEM_KINDS.length,
      homeless: [],
    })
    expect(ITEM_KINDS.length).toBeGreaterThan(3)
  })

  /**
   * The one that matters. Two entries claiming a character used to be settled
   * by the order of an if-else ladder, which is how `E` ended up meaning an
   * east conveyor while the legend's comment still advertised plates `A-I`.
   */
  it('never spends one character twice', () => {
    const chars = LEGEND.map((g) => g.ch)
    const twice = [...new Set(chars.filter((c, i) => chars.indexOf(c) !== i))]
    expect({ checked: chars.length, twice }).toEqual({ checked: chars.length, twice: [] })
    expect(chars.length).toBeGreaterThan(20)
  })

  /** `E` is the conveyor, so gate 5 is the one gate with no plate. */
  it('has a plate for every gate but the one E took', () => {
    const gates = LINKS.filter((n) => LEGEND.some((g) => g.cell === 'gate' && g.link === n))
    const plated = LINKS.filter((n) => LEGEND.some((g) => g.cell === 'plate' && g.link === n))
    expect(gates).toEqual(LINKS)
    expect(plated).toEqual(LINKS.filter((n) => n !== 5))
    expect(glyphFor('E')?.cell).toBe('belt')
  })

  it('writes back exactly what it read', () => {
    let checked = 0
    for (const g of LEGEND) {
      expect({ ch: g.ch, back: charFor(g) }).toEqual({ ch: g.ch, back: g.ch })
      checked++
    }
    expect(checked).toBe(LEGEND.length)
  })

  it('reads a plain floor as a floor, not as whatever stands on one', () => {
    expect(charFor({ cell: 'floor' })).toBe('.')
    expect(charFor({ cell: 'floor', start: true })).toBe('R')
    expect(charFor({ cell: 'floor', item: 'battery' })).toBe('*')
  })

  it('starts a gate shut and a bridge whole', () => {
    expect(cellOf(glyphFor('1')!)).toEqual({ kind: 'gate', link: 1, open: false })
    expect(cellOf(glyphFor('~')!)).toEqual({ kind: 'fragile', collapsed: false })
  })
})

/**
 * Round-tripping every shipped map proves the table and the parser agree: a
 * character that parses to a cell the legend cannot write back, or writes back
 * as a *different* character, would change a room's shape on the way through —
 * which matters the moment `charFor` is used to save one.
 *
 * **It cannot prove the table is right**, and it should not be read as if it
 * could. Parse and serialise share the table, so any consistent relabelling —
 * swapping `E` and `W`, say — round-trips perfectly. Tried, and it passed here
 * while failing twenty tests elsewhere: what proves the *meaning* is the solver
 * re-deriving every shipped par in `engine.test.ts`. This is agreement, not
 * correctness.
 */
describe('every shipped map survives a round trip', () => {
  it('re-writes each row exactly as it was drawn', () => {
    let rows = 0
    for (const level of allLevels) {
      const { world, items, start } = parseMap(level.map)
      const itemAt = new Map(items.map((i) => [posKey(i.at), i.kind]))
      const back = Array.from({ length: world.h }, (_, y) =>
        Array.from({ length: world.w }, (_, x) => {
          const cell = world.cells[y * world.w + x]
          return charFor({
            cell: cell.kind,
            dir: cell.dir,
            only: cell.only,
            link: cell.link,
            item: itemAt.get(posKey({ x, y })),
            start: start.x === x && start.y === y,
          })
        }).join(''),
      )
      // padded, because a short row is walled rather than ragged
      expect({ id: level.id, back }).toEqual({
        id: level.id,
        back: level.map.map((r) => r.padEnd(world.w, '#')),
      })
      rows += level.map.length
    }
    expect(rows).toBeGreaterThan(150)
  })
})
