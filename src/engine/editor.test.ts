import { describe, expect, it } from 'vitest'
import {
  assess, cellAt, cycle, discard, draftFrom, grab, move, paint, playable, removable,
  rotate, starterDraft, draftMap, goalFor, standing, width, height,
} from './editor'
import type { Brush, Draft } from './editor'

/** A room written out longhand, Robby included, the way a saved one arrives. */
const draw = (theme: 'lab', rows: string[]): Draft => draftFrom(rows, { theme })

/** The brushes that carry a setting take it as an argument; these are the defaults. */
const KIND: Partial<Record<Brush, string>> = { object: '*', belt: 'E' }
const brush = (d: Draft, x: number, y: number, b: Brush, kind = KIND[b] ?? '') =>
  paint(d, x, y, b, kind)

describe('the editor model', () => {
  it('starts as a room that already works', () => {
    const d = starterDraft('lab')
    expect(width(d)).toBe(9)
    expect(height(d)).toBe(7)
    const v = assess(d)
    expect(v.status).toBe('ok')
    expect(v.status === 'ok' && v.par).toEqual(['right'])
  })

  /**
   * The outermost ring used to be reserved as a wall border, so a 9×7 room had
   * a 7×5 interior and nothing on screen said so. It is paintable now; the
   * outside of the map walls it in by itself (`at()` in `parse.ts`).
   */
  it('paints every cell of the grid, the outer ring included', () => {
    const d = starterDraft('lab')
    for (const [x, y] of [[0, 0], [8, 3], [4, 0], [4, 6], [8, 6]] as const)
      expect(cellAt(brush(d, x, y, 'floor'), x, y)).toBe('.')
  })

  it('and paints nothing off the grid', () => {
    const d = starterDraft('lab')
    expect(draftMap(brush(d, 9, 3, 'floor'))).toEqual(draftMap(d))
    expect(draftMap(brush(d, -1, 3, 'floor'))).toEqual(draftMap(d))
  })

  /**
   * Robby used to be a character in `cells`, so `paint` had to refuse his tile
   * — painting him would have deleted him. He lives in `start` now, so the
   * ground under him is ground: paint it, and he is still standing there, on
   * whatever it has become.
   */
  it('paints the floor under Robby, and keeps Robby', () => {
    const d = brush(starterDraft('lab'), 1, 3, 'wall')
    expect(cellAt(d, 1, 3)).toBe('#')
    expect(d.start).toEqual([1, 3])
    expect(standing(d)).toBe(false)
    expect(assess(d).status).toBe('ground')
  })

  it('and moving him leaves the tile he was standing on alone', () => {
    let d = brush(starterDraft('lab'), 1, 3, 'belt')
    d = move(d, [1, 3], [4, 3])
    expect(cellAt(d, 1, 3)).toBe('E') // it used to be written back as bare floor
    expect(d.start).toEqual([4, 3])
  })

  it('lets him be put down anywhere, and says what is wrong rather than refusing', () => {
    const d = move(starterDraft('lab'), [1, 3], [0, 0])
    expect(d.start).toEqual([0, 0])
    expect(assess(d).status).toBe('ground')
  })

  it('turns a conveyor on the spot, and leaves anything else alone', () => {
    let d = starterDraft('lab')
    d = brush(d, 4, 3, 'belt')
    expect(d.cells[3][4]).toBe('E')
    expect(rotate(d, 4, 3).cells[3][4]).toBe('S')
    expect(draftMap(rotate(d, 2, 3))).toEqual(draftMap(d))
  })

  /**
   * The object brush is one button carrying five kinds rather than five
   * buttons — a palette that fitted under a thumb was the constraint.
   */
  it('cycles an object through the parts and out to the rocket', () => {
    let d = starterDraft('lab')
    for (const want of ['c', 's', 'x', '@', '*']) {
      d = cycle(d, 7, 3)
      expect(cellAt(d, 7, 3)).toBe(want)
    }
  })

  it('and cycles nothing that is not an object', () => {
    const d = brush(starterDraft('lab'), 4, 3, 'belt')
    expect(draftMap(cycle(d, 4, 3))).toEqual(draftMap(d))
    expect(draftMap(cycle(d, 0, 0))).toEqual(draftMap(d))
  })

  /**
   * `parseMap` keeps the last `@` it reads, so a second rocket would quietly
   * disable the first — a room with two exits where only one of them is real.
   */
  it('keeps exactly one rocket, wherever the second one is put', () => {
    let d = brush(starterDraft('lab'), 7, 3, 'object', '@')
    d = brush(d, 3, 3, 'object', '@')
    expect(draftMap(d).join('').match(/@/g)?.length).toBe(1)
    expect(cellAt(d, 3, 3)).toBe('@')
    expect(cellAt(d, 7, 3)).toBe('.')
  })

  it('throws a piece away when it is carried off the edge', () => {
    const d = starterDraft('lab')
    expect(assess(discard(d, [7, 3])).status).toBe('target')
  })

  it('but never Robby', () => {
    expect(removable('R')).toBe(false)
    const d = starterDraft('lab')
    expect(draftMap(discard(d, [1, 3]))).toEqual(draftMap(d))
  })

  /**
   * What can be carried is what a child would call a thing. Terrain is painted
   * and overdrawn — conveyors and bridges used to be carryable by accident of
   * the old rule ("anything that is not `#` or `.`"), which meant no brush
   * could overdraw one: a press picked it up instead.
   */
  it('picks up things, and paints terrain', () => {
    const d = draw('lab', ['#####', '#R.*#', '#####'])
    expect(grab(d, 1, 1)).toBe('R')
    expect(grab(d, 3, 1)).toBe('*')
    expect(grab(d, 2, 1)).toBeNull()
    expect(grab(d, 0, 0)).toBeNull()
    const belted = brush(d, 2, 1, 'belt')
    expect(grab(belted, 2, 1)).toBeNull()
    const spanned = brush(d, 2, 1, 'fragile')
    expect(grab(spanned, 2, 1)).toBeNull()
  })

  it('leaves floor behind when something is dragged away', () => {
    const d = draw('lab', ['#####', '#R.*#', '#####'])
    expect(draftMap(move(d, [3, 1], [2, 1]))).toEqual(['#####', '#R*.#', '#####'])
  })

  /**
   * Every stroke copies the draft, and the copy used to list `theme` and
   * `cells` only — so naming a room or tightening its tray and then painting
   * one more tile threw both away silently.
   */
  it('carries the name and the tray through a stroke', () => {
    const named: Draft = draftFrom(['#######', '#R...*#', '#######'], {
      theme: 'lab', name: 'Emilia', tray: { right: 5 },
    })
    for (const after of [
      brush(named, 2, 2, 'wall'),
      rotate(brush(named, 3, 1, 'belt'), 3, 1),
      cycle(brush(named, 3, 1, 'object'), 3, 1),
      move(named, [5, 1], [4, 1]),
      discard(named, [5, 1]),
    ]) {
      expect(after.name).toBe('Emilia')
      expect(after.tray).toEqual({ right: 5 })
    }
  })

  /**
   * The draft is not the save format — the map is. Robby has to survive the
   * trip out and back, and so does the tray, which the one hand-written copy of
   * this dance was dropping.
   */
  it('round-trips a saved room, Robby and tray and all', () => {
    const map = ['#######', '#R...*#', '#######']
    const d = draftFrom(map, { theme: 'lab', name: 'Two Cogs', tray: { right: 5 } })
    expect(d.start).toEqual([1, 1])
    expect(d.cells[1][1]).toBe('.')
    expect(draftMap(d)).toEqual(map)
    expect(d.tray).toEqual({ right: 5 })
  })
})

/**
 * The completeness check is the important one. `satisfied()` is true the moment
 * there are no objectives left, so an empty grid solves at par zero — hand one
 * straight to the solver and it reports a blank room as a fine level.
 */
describe('the verdict', () => {
  it('says the room has nothing to go and get', () => {
    expect(assess(draw('lab', ['#####', '#R..#', '#####'])).status).toBe('target')
  })

  it('says so when the battery cannot be got to', () => {
    const d = draw('lab', ['#####', '#R#*#', '#####'])
    expect(assess(d).status).toBe('nopath')
  })

  it('solves a real room and hands back a playable level', () => {
    const d = draw('lab', ['#######', '#R...*#', '#######'])
    const v = assess(d)
    expect(v.status).toBe('ok')
    if (v.status !== 'ok') return
    expect(v.par).toEqual(['right'])
    expect(v.level.par).toEqual(['right'])
    expect(v.route).toContain('5,1')
  })

  it('derives a tray with a spare of everything', () => {
    const d = draw('lab', ['#####', '#R..#', '###.#', '###*#', '#####'])
    const v = assess(d)
    if (v.status !== 'ok') throw new Error('expected a solvable room')
    for (const dir of ['up', 'down', 'left', 'right'] as const)
      expect(v.level.tray[dir]).toBe(v.par.filter((p) => p === dir).length + 1)
  })
})

/**
 * A rocket turns a room from "fetch everything" into "fetch everything, *then*
 * fly" — which is the whole of World 4, and was unreachable from the editor
 * because `derive` was never handed a goal.
 */
describe('a room with a rocket in it', () => {
  const errand = ['#########', '#R..c..@#', '#########']

  it('asks for everything lying about, then the rocket', () => {
    expect(goalFor(errand)).toEqual({ type: 'exit', requires: ['cog'] })
    expect(goalFor(['#####', '#R.*#', '#####'])).toEqual({ type: 'collect' })
  })

  it('lists the manifest in the legend order, not the order they were placed', () => {
    expect(goalFor(['##########', '#Rx.s.c.@#', '##########'])).toEqual({
      type: 'exit', requires: ['cog', 'coil', 'core'],
    })
  })

  it('solves, and is not won by walking past the pad', () => {
    const v = assess(draw('lab', errand))
    expect(v.status).toBe('ok')
    expect(v.status === 'ok' && v.par.length).toBe(1)
  })

  /**
   * The goal has to be derived on the way back in as well. A saved errand room
   * that reloaded as a collect room would be finished by picking the cog up and
   * never reaching the rocket — played at a par that is not true, which is the
   * one failure `doc/MEMORY.md` §8 says cannot happen.
   */
  it('comes back out of storage as the same room', () => {
    const saved = playable({ id: 'x', theme: 'lab', map: errand }, 1)
    expect(saved?.goal).toEqual({ type: 'exit', requires: ['cog'] })
    const fresh = assess(draw('lab', errand))
    expect(saved?.par).toEqual(fresh.status === 'ok' ? fresh.par : null)
  })

  /** A pad and nothing else is the simplest room there is, not a broken one. */
  it('counts as a target on its own', () => {
    const v = assess(draw('lab', ['#####', '#R.@#', '#####']))
    expect(v.status).toBe('ok')
    expect(v.status === 'ok' && v.level.goal).toEqual({ type: 'exit', requires: [] })
  })
})

/**
 * Opening the outer ring took the paintable area from 35 cells to 63, and open
 * space is exactly what makes `solve()` expensive — every tile of an open room
 * is a junction, so the answer is one arrow per tile
 * (`doc/design/code/solver.md`). The editor solves on every finished stroke and
 * a child is holding the phone, so this is not a claim to make and move on
 * from: it is measured, and the number is in the label.
 *
 * The worst case in the editor is the whole grid open with the two ends in
 * opposite corners — 14 arrows, which is `DRAFT_DEPTH` exactly, so the search
 * runs to the very bottom before it answers.
 *
 * Measured, so the budget is not a guess: **9×7 open, 650–770ms**. The dedup on
 * world state (`solve.ts`) is what keeps that from exploding — the frontier is
 * bounded by distinct states, not by 4^depth. The curve past it is steep and
 * worth knowing before `doc/BOARD.md` [R-005] makes the grid resizable: 9×9
 * open is 917ms, 11×7 is 1175ms, and **11×9 — which `MAX_W`/`MAX_H` already
 * permit — is 2547ms**, which is what this check fails on when planted.
 */
describe('the live verdict stays live on the biggest room the editor can make', () => {
  const wideOpen = (): Draft => {
    const rows = Array.from({ length: 7 }, () => '.'.repeat(9))
    rows[6] = '.'.repeat(8) + '*'
    return draftFrom(rows, { theme: 'lab' })
  }

  it('answers a wide-open 9x7 inside the budget', () => {
    const started = performance.now()
    const v = assess(wideOpen())
    const ms = Math.round(performance.now() - started)
    console.log(`      wide-open 9x7 solved in ${ms}ms`)
    expect(v.status).toBe('ok')
    expect(v.status === 'ok' && v.par.length).toBe(14)
    expect(ms).toBeLessThan(1500)
  })
})

describe('saved rooms', () => {
  it('are stored as a map and solved again on the way back in', () => {
    const room = { id: 'mine-1', theme: 'lab' as const, map: ['#######', '#R...*#', '#######'] }
    const level = playable(room, 1)
    expect(level?.par).toEqual(['right'])
    expect(level?.room).toBe('Room 1')
  })

  it('drop out of the list rather than being played at a par that is not true', () => {
    const broken = { id: 'x', theme: 'lab' as const, map: ['#####', '#R#*#', '#####'] }
    expect(playable(broken, 1)).toBeNull()
  })

  /**
   * The rooms list is `$derived` over everything in storage, and there is no
   * error boundary — so a room that throws takes the whole screen with it, on a
   * phone, in front of a child. An incomplete map used to reach `parseMap` and
   * throw `level has no R`; the only failure allowed here is dropping out.
   */
  it('drop out rather than throwing, however broken the map is', () => {
    const cases = [
      ['no robot', ['#####', '#..*#', '#####']],
      ['two robots', ['#######', '#R.R.*#', '#######']],
      ['nothing to fetch', ['#####', '#R..#', '#####']],
      ['nothing at all', ['#####', '#...#', '#####']],
      ['no rows', []],
    ] as const
    for (const [why, map] of cases)
      expect({ why, level: playable({ id: 'x', theme: 'lab', map: [...map] }, 1) })
        .toEqual({ why, level: null })
  })
})

describe('the tray an author chooses', () => {
  const room = ['#######', '#R...*#', '#######']
  const draw2 = (tray?: Record<string, number>) => draftFrom(room, { theme: 'lab', tray })

  it('follows the answer when left alone', () => {
    const v = assess(draw2())
    if (v.status !== 'ok') throw new Error('expected a solvable room')
    expect(v.level.tray.right).toBe(2) // one used, one spare
  })

  it('can be loosened as far as the author likes', () => {
    const v = assess(draw2({ right: 6 }))
    expect(v.status === 'ok' && v.level.tray.right).toBe(6)
  })

  /**
   * A tray too small to hold the solution is not a harder room, it is a broken
   * one — so the floor is whatever the answer actually spends.
   */
  it('is never allowed below what the answer spends', () => {
    const v = assess(draw2({ right: 0 }))
    expect(v.status === 'ok' && v.level.tray.right).toBe(1)
  })

  it('travels with a saved room', () => {
    const level = playable(
      { id: 'x', theme: 'lab', map: room, tray: { right: 5, up: 0 } },
      1,
    )
    expect(level?.tray.right).toBe(5)
    expect(level?.tray.up).toBe(0)
  })
})
