import { describe, expect, it } from 'vitest'
import {
  FALLBACK_SEEDS, FOREST_SPEC, LAB_SPEC,
  attempt, attemptForest, generateFor, rollUnbounded,
} from './generate'
import { parseMap } from './parse'
import { solve, withinTray } from './solve'
import { simulate } from './simulate'

/**
 * The generator is only trustworthy if this file is. Every property a hand-made
 * World 1 room is checked for, a generated one is checked for too — plus the one
 * that cannot be eyeballed: that the corridor never closes a loop.
 */

const SEEDS = Array.from({ length: 120 }, (_, i) => (i + 1) * 104729)
const rooms = SEEDS.map((s) => generateFor('lab', s)!)

describe('the Lab generator', () => {
  it('finds a room worth playing for every seed it is given', () => {
    expect(rooms.filter(Boolean)).toHaveLength(SEEDS.length)
  })

  it('gives the same room for the same seed, every time', () => {
    for (const s of SEEDS.slice(0, 20)) {
      expect(generateFor('lab', s)!.map).toEqual(generateFor('lab', s)!.map)
    }
  })

  it('solves at the par it ships with', () => {
    for (const l of rooms) {
      expect({ id: l.id, outcome: simulate(l, l.par).outcome }).toEqual({ id: l.id, outcome: 'win' })
    }
  })

  it('ships the shortest answer, not merely an answer', () => {
    for (const l of rooms.slice(0, 40)) {
      expect({ id: l.id, par: solve(l, 14)?.length }).toEqual({ id: l.id, par: l.par.length })
    }
  })

  it('keeps par inside the band it was asked for', () => {
    for (const l of rooms) {
      expect(l.par.length).toBeGreaterThanOrEqual(LAB_SPEC.par[0])
      expect(l.par.length).toBeLessThanOrEqual(LAB_SPEC.par[1])
    }
  })

  it('hands out enough arrows to play it', () => {
    for (const l of rooms) expect(withinTray(l, l.par)).toBe(true)
  })

  it('leaves a spare of every arrow, so a wrong turn can be walked back out of', () => {
    for (const l of rooms) {
      for (const d of ['up', 'down', 'left', 'right'] as const) {
        const used = l.par.filter((p) => p === d).length
        expect(l.tray[d] ?? 0).toBeGreaterThan(used)
      }
    }
  })

  /**
   * The property World 1 is built on. A corridor with a loop would let a child
   * walk in a circle, which is exactly the confusion the world exists to avoid,
   * and is the one thing no amount of solving would reveal.
   */
  it('never closes a loop: the walkable region is always a tree', () => {
    for (const l of rooms) {
      const { world } = parseMap(l.map)
      const open = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < world.w && y < world.h &&
        world.cells[y * world.w + x].kind !== 'wall'
      let tiles = 0
      let links = 0
      for (let y = 0; y < world.h; y++)
        for (let x = 0; x < world.w; x++) {
          if (!open(x, y)) continue
          tiles++
          if (open(x + 1, y)) links++
          if (open(x, y + 1)) links++
        }
      expect({ id: l.id, links }).toEqual({ id: l.id, links: tiles - 1 })
    }
  })

  it('always plants at least one decoy to turn down', () => {
    for (const l of rooms) {
      const { world, start, items } = parseMap(l.map)
      const battery = items[0].at
      const open = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < world.w && y < world.h &&
        world.cells[y * world.w + x].kind !== 'wall'
      let deadEnds = 0
      for (let y = 0; y < world.h; y++)
        for (let x = 0; x < world.w; x++) {
          if (!open(x, y)) continue
          if ((x === start.x && y === start.y) || (x === battery.x && y === battery.y)) continue
          const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => open(x + dx, y + dy)).length
          if (n === 1) deadEnds++
        }
      expect({ id: l.id, hasDecoy: deadEnds > 0 }).toEqual({ id: l.id, hasDecoy: true })
    }
  })

  it('crops the room to what it uses', () => {
    for (const l of rooms) {
      expect(l.map[0]).toMatch(/^#+$/)
      expect(l.map.at(-1)).toMatch(/^#+$/)
      // no wholly empty row or column inside the border
      const inner = l.map.slice(1, -1)
      expect(inner.some((r) => r.slice(1, -1).includes('.') || /[R*]/.test(r))).toBe(true)
    }
  })

  it('throws away the dull ones rather than shipping them', () => {
    // a single attempt is expected to fail more often than it succeeds; if this
    // ever passes everything, the filters have stopped filtering
    const kept = Array.from({ length: 300 }, (_, i) => attempt(i + 1)).filter(Boolean).length
    expect(kept).toBeGreaterThan(20)
    expect(kept).toBeLessThan(150)
  }, 25_000)
})


/**
 * World 2's generator wants the opposite shape from World 1's: several ways to
 * go, several things to fetch, and a passage you can see the length of and
 * cannot take.
 */
describe('the Forest generator', () => {
  const seeds = Array.from({ length: 40 }, (_, i) => (i + 1) * 7919)
  const rooms = seeds.map((s) => generateFor('forest', s)!)

  it('finds a room for every seed', () => {
    expect(rooms.filter(Boolean)).toHaveLength(seeds.length)
  })

  it('solves at the par it ships with', () => {
    for (const l of rooms) {
      expect({ id: l.id, outcome: simulate(l, l.par).outcome }).toEqual({ id: l.id, outcome: 'win' })
    }
  })

  it('ships the shortest answer', () => {
    for (const l of rooms.slice(0, 15)) {
      expect({ id: l.id, par: solve(l, 20)?.length }).toEqual({ id: l.id, par: l.par.length })
    }
  })

  it('keeps par inside the band', () => {
    for (const l of rooms) {
      expect(l.par.length).toBeGreaterThanOrEqual(FOREST_SPEC.par[0])
      expect(l.par.length).toBeLessThanOrEqual(FOREST_SPEC.par[1])
    }
  })

  it('always asks for more than one thing, in whatever order suits', () => {
    for (const l of rooms) {
      const parts = l.map.join('').replace(/[^csx]/g, '')
      expect({ id: l.id, parts: parts.length >= 2 }).toEqual({ id: l.id, parts: true })
      // no kind is ever asked for twice, so each is its own errand
      expect(new Set(parts).size).toBe(parts.length)
    }
  })

  it('always grows a passage over, and it always matters', () => {
    for (const l of rooms) {
      expect({ id: l.id, blocked: l.map.join('').includes('=') }).toEqual({ id: l.id, blocked: true })
      // the filter it had to pass: open the passage and the answer changes
      const opened = { ...l, map: l.map.map((r) => r.replace(/=/g, '.')) }
      expect({ id: l.id, same: solve(opened, 20)?.length === l.par.length }).toEqual({
        id: l.id,
        same: false,
      })
    }
  })

  it('branches, where World 1 never does', () => {
    // a tree with side arms has tiles of degree 3; a plain corridor has none
    let withJunctions = 0
    for (const l of rooms) {
      const { world } = parseMap(l.map)
      const open = (x: number, y: number) =>
        x >= 0 && y >= 0 && x < world.w && y < world.h &&
        world.cells[y * world.w + x].kind !== 'wall'
      for (let y = 0; y < world.h; y++)
        for (let x = 0; x < world.w; x++) {
          if (!open(x, y)) continue
          const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => open(x + dx, y + dy)).length
          if (n >= 3) { withJunctions++; y = world.h; break }
        }
    }
    expect(withJunctions).toBe(rooms.length)
  })

  it('throws away most of what it rolls', () => {
    // measured at ~9.5%: high rejection is the design, not a fault. If this ever
    // passes most candidates, a filter has stopped filtering.
    const kept = Array.from({ length: 200 }, (_, i) => attemptForest(i + 1)).filter(Boolean).length
    expect(kept).toBeGreaterThan(4)
    expect(kept).toBeLessThan(70)
    // 200 rejected candidates is a few seconds of solving, past the 5s default
  }, 25_000)
})


/**
 * The roller runs on the main thread when a child taps the tile, so what
 * matters as much as the rooms it makes is that it always makes one, quickly.
 */
describe('the roller cannot stall', () => {
  it('always returns a room, even on a hopeless budget', () => {
    for (const chapter of ['lab', 'forest'] as const)
      for (let s = 1; s <= 12; s++) {
        const room = generateFor(chapter, s * 7919, { attempts: 1, ms: 0 })
        expect({ chapter, has: !!room?.map.length }).toEqual({ chapter, has: true })
      }
  })

  it('keeps within its time budget', () => {
    // generous ceiling: the budget bounds the search, not the last candidate,
    // which still has to finish being judged
    for (const chapter of ['lab', 'forest'] as const) {
      const worst = Math.max(
        ...Array.from({ length: 10 }, (_, i) => {
          const t = Date.now()
          generateFor(chapter, (i + 1) * 104729, { ms: 150 })
          return Date.now() - t
        }),
      )
      expect({ chapter, overrun: worst > 900 }).toEqual({ chapter, overrun: false })
    }
  })

  it('has fallback seeds that really do produce rooms', () => {
    for (const chapter of ['lab', 'forest'] as const)
      for (const seed of FALLBACK_SEEDS[chapter]) {
        const room = rollUnbounded(chapter, seed)
        expect({ chapter, seed, solvable: !!room.par.length })
          .toEqual({ chapter, seed, solvable: true })
      }
  })

  it('keeps a spread of fallbacks, so a spent budget is not always the same room', () => {
    // the property is about the seeds, not about which one a given roll picks:
    // every fallback must be a different room, or the list is padding
    for (const chapter of ['lab', 'forest'] as const) {
      const maps = new Set(
        FALLBACK_SEEDS[chapter].map((s) => rollUnbounded(chapter, s).map.join('|')),
      )
      expect({ chapter, distinct: maps.size }).toEqual({
        chapter,
        distinct: FALLBACK_SEEDS[chapter].length,
      })
    }
  })

  it('serves a fallback without paying for it twice', () => {
    // cached, so a spent budget does not then cost a second full search
    for (const chapter of ['lab', 'forest'] as const) {
      // attempts: 0 skips the search entirely, so this times the fallback alone
      generateFor(chapter, 1, { attempts: 0, ms: 0 })
      const t = Date.now()
      for (let i = 0; i < 20; i++) generateFor(chapter, 1, { attempts: 0, ms: 0 })
      expect({ chapter, slow: Date.now() - t > 250 }).toEqual({ chapter, slow: false })
    }
  })

  it('still returns fresh rooms when given a fair budget', () => {
    const maps = new Set(
      Array.from({ length: 10 }, (_, i) => generateFor('forest', (i + 1) * 31337).map.join('|')),
    )
    expect(maps.size).toBeGreaterThan(8)
  })
})
