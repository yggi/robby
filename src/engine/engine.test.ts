import { describe, expect, it } from 'vitest'
import { allLevels, chapters, world1 } from './levels'
import { parseMap } from './parse'
import { isDecision, openDirs, simulate } from './simulate'
import { solve, withinTray } from './solve'
import type { Dir, Level } from './types'

const lvl = (map: string[], extra: Partial<Level> = {}): Level => ({
  id: 'test',
  theme: 'garden',
  map,
  goal: { type: 'collect' },
  tray: { up: 9, down: 9, left: 9, right: 9 },
  par: [],
  ...extra,
})

describe('the movement rule', () => {
  it('asks on the start tile, because the robot has no heading yet', () => {
    const { world, start } = parseMap(['####', '#R.#', '####'])
    expect(isDecision(world, start, null)).toBe(true)
  })

  it('does not ask mid-corridor', () => {
    const { world } = parseMap(['######', '#R...#', '######'])
    expect(isDecision(world, { x: 2, y: 1 }, 'right')).toBe(false)
  })

  it('asks at a forced corner', () => {
    const { world } = parseMap(['####', '#R.#', '##.#', '####'])
    expect(isDecision(world, { x: 2, y: 1 }, 'right')).toBe(true)
  })

  it('asks at a junction', () => {
    const { world } = parseMap(['#####', '#R..#', '##.##', '#####'])
    expect(isDecision(world, { x: 2, y: 1 }, 'right')).toBe(true)
  })

  it('asks at a dead end, where only reverse is legal', () => {
    const { world } = parseMap(['#####', '#R..#', '#####'])
    expect(isDecision(world, { x: 3, y: 1 }, 'right')).toBe(true)
    expect(openDirs(world, { x: 3, y: 1 })).toEqual(['left'])
  })

  it('charges a token for a side opening even when going straight', () => {
    const { world } = parseMap(['######', '#R...#', '###.##', '######'])
    expect(isDecision(world, { x: 3, y: 1 }, 'right')).toBe(true)
  })

  it('degenerates to one arrow per tile on an open grid', () => {
    const open = lvl(['#####', '#R..#', '#...#', '#..*#', '#####'])
    const t = simulate(open, ['right', 'right', 'down', 'down'])
    // every tile is a junction, so every step consumed its own token
    const steps = t.frames.filter((f) => f.event === 'step' || f.event === 'pickup')
    expect(new Set(steps.map((f) => f.cmdIndex)).size).toBe(steps.length)
  })
})

describe('one token buys a whole run', () => {
  it('keeps the same slot lit across a long corridor', () => {
    const t = simulate(world1[0], ['right'])
    expect(t.outcome).toBe('win')
    const moved = t.frames.filter((f) => f.from.x !== f.to.x)
    expect(moved).toHaveLength(5)
    expect(moved.every((f) => f.cmdIndex === 0)).toBe(true)
  })
})

describe('failure modes are distinct and diagnostic', () => {
  it('bonks and blames the offending slot', () => {
    const t = simulate(world1[1], ['right', 'up'])
    expect(t.outcome).toBe('bonk')
    expect(t.blame).toBe(1)
  })

  it('shrugs when the program runs out at a decision', () => {
    const t = simulate(world1[1], ['right'])
    expect(t.outcome).toBe('shrug')
    expect(t.blame).toBeNull()
  })

  it('shrugs on an empty program rather than doing nothing', () => {
    expect(simulate(world1[0], []).outcome).toBe('shrug')
  })

  it('a wrong turn costs tokens but is survivable', () => {
    // Pantry: turn down the decoy stub, reverse out of it, carry on
    const t = simulate(world1[3], ['right', 'down', 'up', 'right'])
    expect(t.outcome).toBe('win')
  })

  it('reports stranded when a collapse cuts off the objective', () => {
    // crossing the fragile tile cuts off the only route to the battery
    const trap = lvl(['#####', '#R~.#', '#.###', '#*###', '#####'])
    const t = simulate(trap, ['right'])
    expect(t.outcome).toBe('stranded')
  })
})

describe('triggers', () => {
  it('picks up automatically, with no separate command', () => {
    const t = simulate(world1[0], ['right'])
    expect(t.frames.some((f) => f.event === 'pickup')).toBe(true)
  })

  it('opens the linked gate when the plate is entered', () => {
    const t = simulate(
      allLevels.find((l) => l.id === 't-6')!,
      ['right', 'right', 'left', 'down'],
    )
    expect(t.outcome).toBe('win')
    expect(t.frames.some((f) => f.event === 'gate')).toBe(true)
  })

  it('a key opens every gate on contact', () => {
    const keyed = lvl(['######', '#Rk1*#', '######'])
    expect(simulate(keyed, ['right']).outcome).toBe('win')
  })

  it('a closed gate is a wall', () => {
    const shut = lvl(['######', '#R.1*#', '######'])
    expect(simulate(shut, ['right']).outcome).not.toBe('win')
  })

  it('one-way tiles restrict the exit', () => {
    const ow = lvl(['#####', '#R>.#', '#####'])
    const { world } = parseMap(ow.map)
    expect(openDirs(world, { x: 2, y: 1 })).toEqual(['right'])
  })

  it('the fragile floor is gone once the robot leaves it', () => {
    const t = simulate(allLevels.find((l) => l.id === 't-9')!, ['right', 'down', 'left'])
    expect(t.outcome).toBe('win')
    expect(t.frames.some((f) => f.event === 'collapse')).toBe(true)
  })
})

describe('the Scrapyard runs on machinery, not instructions', () => {
  const yard = () => chapters.find((c) => c.id === 'scrap')!

  it('never asks for a left turn, in any room', () => {
    for (const l of yard().levels) expect(l.par).not.toContain('left')
  })

  it('does not even offer one in the rooms that are about it', () => {
    for (const id of ['3-1', '3-2', '3-4', '3-7', '3-8']) {
      const l = yard().levels.find((x) => x.id === id)!
      expect({ id, left: l.tray.left }).toEqual({ id, left: undefined })
    }
  })

  it('sends him back to where he started, three times over', () => {
    const line = yard().levels.find((l) => l.id === '3-8')!
    const { start } = parseMap(line.map)
    const t = simulate(line, line.par)
    expect(t.outcome).toBe('win')
    // he is set down on the starting tile once per part he fetches
    const homecomings = t.frames.filter(
      (f, i) => i > 0 && f.to.x === start.x && f.to.y === start.y,
    )
    expect(homecomings).toHaveLength(3)
    expect(homecomings.every((f) => f.carried)).toBe(true)
  })

  it('will not launch early, and posts him round again if he tries', () => {
    const line = yard().levels.find((l) => l.id === '3-8')!
    // straight down the spine and onto the delivery belt with nothing aboard
    const t = simulate(line, ['down', 'down', 'down', 'down'])
    expect(t.outcome).not.toBe('win')
    expect(t.frames.some((f) => f.event === 'win')).toBe(false)
  })
})

describe('conveyors', () => {
  const belt = () => allLevels.find((l) => l.id === 't-7')!

  it('carries him along for nothing', () => {
    const t = simulate(belt(), belt().par)
    expect(t.outcome).toBe('win')
    const ride = t.frames.filter((f) => f.carried)
    expect(ride).toHaveLength(5)
    // the whole ride is bought by the single instruction that stepped him on
    expect(new Set(ride.map((f) => f.cmdIndex)).size).toBe(1)
  })

  it('never asks for an instruction mid-ride', () => {
    const t = simulate(belt(), belt().par)
    const ride = t.frames.filter((f) => f.carried)
    expect(ride.every((f) => f.event === 'carry' || f.event === 'pickup')).toBe(true)
  })

  it('refuses to be walked onto against its flow', () => {
    // he rides east, then tries to walk back west onto the same belt
    const t = simulate(belt(), ['down', 'right', 'left'])
    expect(t.outcome).toBe('bonk')
    expect(t.blame).toBe(2)
  })

  it('can still be left sideways', () => {
    const { world } = parseMap(belt().map)
    expect(openDirs(world, { x: 7, y: 3 }).sort()).toEqual(['down', 'up'])
  })

  it('is one-way for the reachability check too', () => {
    const { world } = parseMap(belt().map)
    // from the far end, the belt tile behind is not an option
    expect(openDirs(world, { x: 7, y: 3 })).not.toContain('left')
    // but stepping on from the near end is
    expect(openDirs(world, { x: 1, y: 3 })).toContain('right')
  })
})

describe('the rocket checks its manifest', () => {
  const rocket = () => allLevels.find((l) => l.id === 't-9')!

  it('does not launch for a robot that reached it empty-handed', () => {
    // straight down to the pad, no battery aboard — the robot drives across it
    const t = simulate(rocket(), ['down'])
    expect(t.outcome).not.toBe('win')
    expect(t.frames.some((f) => f.event === 'win')).toBe(false)
  })

  it('is not satisfied by the pickup alone', () => {
    expect(simulate(rocket(), ['right']).outcome).not.toBe('win')
  })

  it('launches once the battery is aboard', () => {
    expect(simulate(rocket(), ['right', 'down', 'left']).outcome).toBe('win')
  })

  it('states its requirements as a list, so more can be added later', () => {
    const goal = rocket().goal
    expect(goal.type).toBe('exit')
    expect(goal.type === 'exit' && goal.requires).toEqual(['battery'])
  })

  /**
   * Arriving short is not a failure and never was — he drives across the pad,
   * and several shipped routes depend on it. But it is *something*, and until
   * the trace said so the view had to guess from where he was standing, on a
   * frame 380ms long that cut the rocket's shudder off in the middle of it.
   */
  it('says so in the frame when he arrives without the manifest', () => {
    const t = simulate(rocket(), ['down'])
    const pad = t.frames.filter((f) => f.event === 'denied')
    expect(pad.length).toBe(1)
    expect(pad[0].state.held).toEqual([])
  })

  it('and does not, once he is carrying what it asked for', () => {
    const t = simulate(rocket(), ['right', 'down', 'left'])
    expect(t.frames.some((f) => f.event === 'denied')).toBe(false)
    expect(t.outcome).toBe('win')
  })

  /**
   * The beat is a frame label, not a rule. Nothing about which programs win may
   * move — this asserts it on the run that visits the pad twice.
   */
  it('is a beat and not a rule: the same programs still win', () => {
    expect(simulate(rocket(), ['down']).outcome).not.toBe('win')
    expect(simulate(rocket(), ['right', 'down', 'left']).consumed).toBe(3)
  })
})

describe('determinism', () => {
  it('the same program always yields the same trace', () => {
    const p: Dir[] = ['right', 'down', 'right', 'up']
    expect(JSON.stringify(simulate(world1[4], p))).toBe(
      JSON.stringify(simulate(world1[4], p)),
    )
  })

  it('simulating does not mutate the level', () => {
    const before = JSON.stringify(world1[3])
    simulate(world1[3], ['right', 'down'])
    expect(JSON.stringify(world1[3])).toBe(before)
  })
})

// This is the suite that stops a broken level ever shipping.
describe.each(allLevels)('level $id', (level) => {
  it('is won by its stored par', () => {
    expect(simulate(level, level.par).outcome).toBe('win')
  })

  it('has a par that fits in its own tray', () => {
    expect(withinTray(level, level.par)).toBe(true)
  })

  it('has no shorter solution than par', () => {
    const best = solve(level)
    expect(best).not.toBeNull()
    expect(best!.length).toBe(level.par.length)
  })

  it('never strands the robot along the intended route', () => {
    for (let i = 1; i < level.par.length; i++) {
      expect(simulate(level, level.par.slice(0, i)).outcome).not.toBe('stranded')
    }
  })
})

describe('the Lab teaches one thing at a time', () => {
  it('starts at one token and never jumps by more than two', () => {
    const lens = world1.map((l) => l.par.length)
    expect(lens[0]).toBe(1)
    for (let i = 1; i < lens.length; i++)
      expect(lens[i] - lens[i - 1]).toBeLessThanOrEqual(2)
  })

  it('gives every level a theme, which must not affect the rules', () => {
    expect(allLevels.every((l) => !!l.theme)).toBe(true)
  })

  it('names every room, so the level select has something to show', () => {
    expect(allLevels.every((l) => !!l.room || l.id.startsWith('lab-1'))).toBe(true)
  })

  it('ends the Lab at the rocket', () => {
    const last = chapters[0].levels.at(-1)!
    expect(last.goal.type).toBe('exit')
    expect(chapters[0].levels.slice(0, -1).every((l) => l.goal.type === 'collect')).toBe(true)
  })

  it('keeps every level id unique across chapters', () => {
    expect(new Set(allLevels.map((l) => l.id)).size).toBe(allLevels.length)
  })

  it('offers exactly one usable direction on the very first level', () => {
    expect(Object.keys(world1[0].tray)).toEqual(['right'])
  })
})

// The room sets live in the view, but they are keyed by level id and hold raw
// coordinates, so a renamed room or a redrawn map would silently misplace them.
describe('every room of the Lab is furnished on purpose', async () => {
  const { ROOM_SET } = await import('../view/props')

  it('furnishes each room', () => {
    for (const l of chapters[0].levels) expect(ROOM_SET[l.id]?.length).toBeGreaterThan(0)
  })

  it('keeps each room to a handful of objects', () => {
    for (const l of chapters[0].levels) expect(ROOM_SET[l.id].length).toBeLessThanOrEqual(4)
  })

  it('never places anything on the path', () => {
    for (const l of chapters[0].levels) {
      const { world } = parseMap(l.map)
      for (const p of ROOM_SET[l.id]) {
        const cell = world.cells[p.y * world.w + p.x]
        expect(
          { room: l.id, prop: p.prop, at: `${p.x},${p.y}`, kind: cell?.kind },
        ).toEqual({ room: l.id, prop: p.prop, at: `${p.x},${p.y}`, kind: 'wall' })
      }
    }
  })

  it('places everything inside the map', () => {
    for (const l of chapters[0].levels) {
      const { world } = parseMap(l.map)
      for (const p of ROOM_SET[l.id]) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThan(world.w)
        expect(p.y).toBeLessThan(world.h)
      }
    }
  })

  it("keeps Funke's basket in the Sleep Bay and nowhere else", () => {
    const rooms = Object.entries(ROOM_SET)
      .filter(([, set]) => set.some((p) => p.prop === 'catbed'))
      .map(([id]) => id)
    expect(rooms).toEqual(['lab-5'])
  })

  it('puts the charger where Robby wakes up', () => {
    const { start } = parseMap(chapters[0].levels[0].map)
    const charger = ROOM_SET['lab-1'].find((p) => p.prop === 'charger')!
    expect(Math.abs(charger.x - start.x) + Math.abs(charger.y - start.y)).toBe(1)
  })

  it('does not furnish rooms outside the Lab', () => {
    const labIds = new Set(chapters[0].levels.map((l) => l.id))
    expect(Object.keys(ROOM_SET).every((id) => labIds.has(id))).toBe(true)
  })
})

describe('the Cheese Moon is about the order, not the route', () => {
  const moon = () => chapters.find((c) => c.id === 'moon')!
  const last = () => moon().levels.at(-1)!

  it('strands him if he takes the spans before the errand', () => {
    // straight down the first bridge with nothing fetched from the top shore
    const t = simulate(last(), ['down', 'right', 'down'])
    expect(t.outcome).toBe('stranded')
  })

  it('and lets him through in the one order that works', () => {
    expect(simulate(last(), last().par).outcome).toBe('win')
  })

  it('lands him on the pad short, so the last part is a walk', () => {
    const t = simulate(last(), last().par)
    const exit = { x: 7, y: 5 }
    const visits = t.frames.filter((f) => f.to.x === exit.x && f.to.y === exit.y)
    // once arriving without the core, and once more to leave
    expect(visits.length).toBeGreaterThan(1)
  })

  it('builds every room out of spans', () => {
    for (const l of moon().levels) expect(l.map.join('')).toContain('~')
  })
})
