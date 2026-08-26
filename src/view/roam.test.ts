import { describe, expect, it } from 'vitest'
import { parseMap } from '../engine/parse'
import { neighbours, posKey, type Vec2, type World } from '../engine/types'
import { REACH, nextStroll, routesFrom } from './roam'

/**
 * Funke's wandering, which had never been tested. It is worth testing for one
 * reason: she padded through shut gates and bridges that had already fallen
 * for the whole life of the feature, because her passability check was a
 * shorter hand-written copy of the engine's. Nothing failed when that was true.
 */

const room = (rows: string[]) => parseMap(rows)

/** Every tile a route touches, including the tile it ends on. */
const tiles = (routes: Map<string, Vec2[]>) => [...routes.values()].flat()

const adjacent = (a: Vec2, b: Vec2) => neighbours(a).some((n) => n.x === b.x && n.y === b.y)

describe('where Funke can get to', () => {
  it('reaches the open floor around her', () => {
    const { world, start } = room(['#####', '#...#', '#.R.#', '#...#', '#####'])
    const routes = routesFrom(world, start)
    // the eight tiles around her, plus the one she is standing on
    expect(routes.size).toBe(9)
  })

  it('never crosses a wall', () => {
    // two rooms, joined by nothing
    const { world, start } = room(['#####', '#R#.#', '#.#.#', '#####'])
    const routes = routesFrom(world, start)
    expect([...routes.keys()].sort()).toEqual(['1,1', '1,2'])
  })

  it('never crosses a way that is shut for good', () => {
    const { world, start } = room(['#####', '#R=.#', '#####'])
    const routes = routesFrom(world, start)
    expect(routes.has('2,1')).toBe(false) // the blocked tile itself
    expect(routes.has('3,1')).toBe(false) // and anything behind it
  })

  it('never crosses a shut gate, and does once it is open', () => {
    const { world, start } = room(['#####', '#R1.#', '#####'])
    const shut = routesFrom(world, start)
    expect(shut.has('3,1')).toBe(false)

    const open: World = {
      ...world,
      cells: world.cells.map((c) => (c.kind === 'gate' ? { ...c, open: true } : c)),
    }
    expect(routesFrom(open, start).has('3,1')).toBe(true)
  })

  it('never crosses a bridge that has already fallen', () => {
    const { world, start } = room(['#####', '#R~.#', '#####'])
    expect(routesFrom(world, start).has('3,1')).toBe(true)

    const fallen: World = {
      ...world,
      cells: world.cells.map((c) => (c.kind === 'fragile' ? { ...c, collapsed: true } : c)),
    }
    const routes = routesFrom(fallen, start)
    expect(routes.has('2,1')).toBe(false)
    expect(routes.has('3,1')).toBe(false)
  })

  it('does not wander off across the room', () => {
    const wide = ['#'.repeat(20), '#R' + '.'.repeat(17) + '#', '#'.repeat(20)]
    const { world, start } = room(wide)
    const routes = routesFrom(world, start)
    // REACH tiles out, and no further
    expect(routes.size).toBe(REACH + 1)
    expect(Math.max(...tiles(routes).map((p) => p.x))).toBe(start.x + REACH)
  })

  it('holds every route as a walk of single steps', () => {
    const { world, start } = room(['#####', '#...#', '#.R.#', '#...#', '#####'])
    for (const route of routesFrom(world, start).values()) {
      let prev = start
      for (const step of route) {
        expect(adjacent(prev, step)).toBe(true)
        prev = step
      }
    }
  })
})

describe('where Funke goes next', () => {
  const open = room(['#####', '#...#', '#.R.#', '#...#', '#####'])
  const routes = routesFrom(open.world, open.start)

  it('every step of the walk is a neighbour of the last', () => {
    // from a tile that is not Robby's, so the walk has to re-root through him
    const here = { x: 1, y: 1 }
    for (let i = 0; i < routes.size; i++) {
      const walk = nextStroll(routes, here, open.start, [], () => i)
      expect(walk).not.toBeNull()
      let prev = here
      for (const step of walk!) {
        expect(adjacent(prev, step)).toBe(true)
        prev = step
      }
    }
  })

  it('does not send her back where she has just been', () => {
    const everywhere = [...routes.keys()]
    const here = open.start
    // everything but one corner is off-limits
    const lately = everywhere.filter((k) => k !== '3,3' && k !== posKey(here))
    const walk = nextStroll(routes, here, open.start, lately, () => 0)
    expect(walk).not.toBeNull()
    expect(posKey(walk!.at(-1)!)).toBe('3,3')
  })

  it('would rather pace than freeze when everywhere is stale', () => {
    const walk = nextStroll(routes, open.start, open.start, [...routes.keys()], () => 0)
    expect(walk).not.toBeNull()
    expect(walk!.length).toBeGreaterThan(0)
  })

  it('has nowhere to go in a room of one tile', () => {
    const { world, start } = room(['###', '#R#', '###'])
    expect(nextStroll(routesFrom(world, start), start, start, [])).toBeNull()
  })
})
