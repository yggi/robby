import { describe, expect, it } from 'vitest'
import {
  assess, discard, grab, move, paint, playable, removable, rotate,
  starterDraft, toMap, width, height,
} from './editor'
import type { Draft } from './editor'

const draw = (theme: 'lab', rows: string[]): Draft => ({
  theme,
  cells: rows.map((r) => r.split('')),
})

describe('the editor model', () => {
  it('starts as a room that already works', () => {
    const d = starterDraft('lab')
    expect(width(d)).toBe(9)
    expect(height(d)).toBe(7)
    const v = assess(d)
    expect(v.status).toBe('ok')
    expect(v.status === 'ok' && v.par).toEqual(['right'])
  })

  it('will not paint outside the wall', () => {
    const d = starterDraft('lab')
    expect(toMap(paint(d, 0, 0, 'floor'))).toEqual(toMap(d))
    expect(toMap(paint(d, 8, 3, 'floor'))).toEqual(toMap(d))
  })

  it('will not let Robby be painted over: he can only be moved', () => {
    const d = starterDraft('lab')
    expect(toMap(paint(d, 1, 3, 'wall'))).toEqual(toMap(d))
    expect(toMap(paint(d, 1, 3, 'battery'))).toEqual(toMap(d))
  })

  it('turns a conveyor on the spot, and leaves anything else alone', () => {
    let d = starterDraft('lab')
    d = paint(d, 4, 3, 'belt')
    expect(d.cells[3][4]).toBe('E')
    expect(rotate(d, 4, 3).cells[3][4]).toBe('S')
    expect(toMap(rotate(d, 2, 3))).toEqual(toMap(d))
  })

  it('throws a piece away when it is carried off the edge', () => {
    const d = starterDraft('lab')
    expect(assess(discard(d, [7, 3])).status).toBe('empty')
  })

  it('but never Robby', () => {
    expect(removable('R')).toBe(false)
    const d = starterDraft('lab')
    expect(toMap(discard(d, [1, 3]))).toEqual(toMap(d))
  })

  it('picks up a piece, and paints bare ground', () => {
    const d = draw('lab', ['#####', '#R.*#', '#####'])
    expect(grab(d, 1, 1)).toBe('R')
    expect(grab(d, 3, 1)).toBe('*')
    expect(grab(d, 2, 1)).toBeNull()
  })

  it('leaves floor behind when something is dragged away', () => {
    const d = draw('lab', ['#####', '#R.*#', '#####'])
    expect(toMap(move(d, [1, 1], [2, 1]))).toEqual(['#####', '#.R*#', '#####'])
  })
})

/**
 * The completeness check is the important one. `satisfied()` is true the moment
 * there are no objectives left, so an empty grid solves at par zero — hand one
 * straight to the solver and it reports a blank room as a fine level.
 */
describe('the verdict', () => {
  it('asks for what is missing rather than solving nothing', () => {
    const bare = assess({ theme: 'lab', cells: ['#####', '#...#', '#####'].map((r) => r.split('')) })
    expect(bare.status).toBe('empty')
    expect(bare.status === 'empty' && bare.needs).toEqual(['robot', 'battery'])
  })

  it('does not call a room with no battery solved', () => {
    const d = draw('lab', ['#####', '#R..#', '#####'])
    expect(assess(d).status).toBe('empty')
  })

  it('says so when the battery cannot be got to', () => {
    const d = draw('lab', ['#####', '#R#*#', '#####'])
    expect(assess(d).status).toBe('unreachable')
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
})

describe('the tray an author chooses', () => {
  const room = ['#######', '#R...*#', '#######']
  const draw2 = (tray?: Record<string, number>) => ({
    theme: 'lab' as const, tray, cells: room.map((r) => r.split('')),
  })

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
