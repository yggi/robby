import { at, cloneWorld, levelStart } from './parse'
import {
  DELTA,
  DIRS,
  OPPOSITE,
  type Dir,
  type Frame,
  type FrameEvent,
  type Item,
  type Level,
  type State,
  type Trace,
  type Vec2,
  type World,
} from './types'
import { OBJECTIVES } from './types'

const STEP_LIMIT = 400

const eq = (a: Vec2, b: Vec2) => a.x === b.x && a.y === b.y
const add = (a: Vec2, d: Dir) => ({ x: a.x + DELTA[d].x, y: a.y + DELTA[d].y })

/** Can the robot stand here? */
export function passable(world: World, p: Vec2): boolean {
  const c = at(world, p)
  if (c.kind === 'wall' || c.kind === 'blocked') return false
  if (c.kind === 'gate') return !!c.open
  if (c.kind === 'fragile') return !c.collapsed
  return true
}

/** Directions the robot may leave `p` by, honouring one-ways. */
/**
 * A belt cannot be walked onto against its flow. This is the whole one-way part
 * of the mechanic, and it lives here so that every consumer — the decision rule,
 * the reachability check and the solver — gets it for free.
 */
export function canEnter(world: World, p: Vec2, heading: Dir): boolean {
  if (!passable(world, p)) return false
  const c = at(world, p)
  return !(c.kind === 'belt' && c.dir === OPPOSITE[heading])
}

/** Which ways the robot may leave `p`. */
export function exitDirs(world: World, p: Vec2): Dir[] {
  const c = at(world, p)
  if (c.kind === 'oneway' && c.only) return [c.only]
  // stepping backwards off a belt would mean travelling against it
  if (c.kind === 'belt' && c.dir) return DIRS.filter((d) => d !== OPPOSITE[c.dir!])
  return DIRS
}

export function openDirs(world: World, p: Vec2): Dir[] {
  return exitDirs(world, p).filter((d) => canEnter(world, add(p, d), d))
}

/**
 * The core rule: the robot runs straight until it *can* or *must* change.
 * It consumes an instruction unless carrying on straight is the only option.
 */
export function isDecision(world: World, p: Vec2, dir: Dir | null): boolean {
  if (dir === null) return true // start tile always asks
  const opps = openDirs(world, p).filter((d) => d !== OPPOSITE[dir])
  return !(opps.length === 1 && opps[0] === dir)
}

/** Auto-triggers, fired on arrival. Returns the tiles that changed. */
function onEnter(state: State, p: Vec2): { changed: Vec2[]; kind: string[] } {
  const changed: Vec2[] = []
  const kind: string[] = []

  // pickups
  for (let i = state.items.length - 1; i >= 0; i--) {
    const it = state.items[i]
    if (eq(it.at, p)) {
      state.items.splice(i, 1)
      state.held.push(it.kind)
      changed.push(p)
      kind.push('pickup')
      if (it.kind === 'key') openAllGates(state, changed)
    }
  }

  const c = at(state.world, p)
  if (c.kind === 'plate') {
    for (let i = 0; i < state.world.cells.length; i++) {
      const g = state.world.cells[i]
      if (g.kind === 'gate' && g.link === c.link && !g.open) {
        g.open = true
        changed.push({ x: i % state.world.w, y: Math.floor(i / state.world.w) })
        kind.push('gate')
      }
    }
  }
  return { changed, kind }
}

function openAllGates(state: State, changed: Vec2[]) {
  state.world.cells.forEach((g, i) => {
    if (g.kind === 'gate' && !g.open) {
      g.open = true
      changed.push({ x: i % state.world.w, y: Math.floor(i / state.world.w) })
    }
  })
}

function satisfied(state: State, exit: Vec2 | null, goal: Level['goal']): boolean {
  // Collect finishes the instant the last objective leaves the floor, whatever
  // order they were picked up in.
  if (goal.type === 'collect') return !state.items.some((i) => OBJECTIVES.includes(i.kind))
  // The rocket checks the manifest on arrival. Standing on it without a full
  // battery does nothing at all — the robot simply drives across the pad.
  if (!exit || !eq(state.pos, exit)) return false
  return goal.requires.every((need) => state.held.includes(need))
}

/**
 * Flood fill: are the remaining objectives still reachable?
 * Ignores one-ways and token budget deliberately — this is the "obviously
 * doomed" check that drives the stranded animation, not a solver.
 */
function reachable(state: State, exit: Vec2 | null, goal: Level['goal']): boolean {
  const targets: Vec2[] = state.items
    .filter((i) => OBJECTIVES.includes(i.kind))
    .map((i) => i.at)
  if (goal.type === 'exit' && exit) targets.push(exit)
  if (targets.length === 0) return true

  // Flood to a fixpoint: reaching a plate or key opens gates, which opens more
  // floor, which may reach more plates. Optimistic on purpose — this only has
  // to catch the obviously doomed, never to second-guess the player.
  const scratch = cloneWorld(state.world)
  const idx = (p: Vec2) => p.y * scratch.w + p.x
  let seen = new Set<number>()

  for (;;) {
    seen = new Set<number>([idx(state.pos)])
    const q: Vec2[] = [state.pos]
    while (q.length) {
      const p = q.shift()!
      for (const d of openDirs(scratch, p)) {
        const n = add(p, d)
        if (seen.has(idx(n))) continue
        seen.add(idx(n))
        q.push(n)
      }
    }

    let opened = false
    const unlock = (link?: number) => {
      for (const g of scratch.cells)
        if (g.kind === 'gate' && !g.open && (link === undefined || g.link === link)) {
          g.open = true
          opened = true
        }
    }
    for (const i of seen) {
      const c = scratch.cells[i]
      if (c.kind === 'plate') unlock(c.link)
    }
    for (const it of state.items)
      if (it.kind === 'key' && seen.has(idx(it.at))) unlock()

    if (!opened) break
  }

  return targets.every((t) => seen.has(idx(t)))
}

const snapshot = (s: State): State => ({
  pos: { ...s.pos },
  dir: s.dir,
  world: cloneWorld(s.world),
  items: s.items.map((i) => ({ ...i })),
  held: [...s.held],
  done: s.done,
})

export function simulate(level: Level, program: Dir[]): Trace {
  const { world, start, exit, items } = levelStart(level)
  const state: State = {
    pos: { ...start },
    dir: null,
    world,
    items,
    held: [],
    done: false,
  }

  const frames: Frame[] = []
  let ptr = 0
  let cmdIndex: number | null = null

  const push = (
    from: Vec2,
    to: Vec2,
    event: Frame['event'],
    changed: Vec2[] = [],
    carried = false,
  ) =>
    frames.push({
      carried,
      from: { ...from },
      to: { ...to },
      dir: state.dir,
      cmdIndex,
      event,
      changed,
      state: snapshot(state),
    })

  // triggers on the start tile fire before anything else
  const first = onEnter(state, state.pos)
  if (first.changed.length) push(state.pos, state.pos, 'pickup', first.changed)

  if (satisfied(state, exit, level.goal)) {
    state.done = true
    push(state.pos, state.pos, 'win')
    return { frames, outcome: 'win', blame: null, consumed: 0 }
  }

  for (let steps = 0; steps < STEP_LIMIT; steps++) {
    const here = at(state.world, state.pos)
    const belt = here.kind === 'belt' ? here.dir ?? null : null
    // A belt carries him on for nothing. Only when it cannot — a wall, or a
    // belt facing back — does he stand there and the ordinary rules resume.
    const carried = belt !== null && canEnter(state.world, add(state.pos, belt), belt)

    if (carried) {
      state.dir = belt
    } else {
      if (isDecision(state.world, state.pos, state.dir)) {
        if (ptr >= program.length) {
          push(state.pos, state.pos, 'shrug')
          return { frames, outcome: 'shrug', blame: null, consumed: ptr }
        }
        const cmd = program[ptr]
        cmdIndex = ptr
        ptr++
        if (!openDirs(state.world, state.pos).includes(cmd)) {
          state.dir = cmd
          push(state.pos, state.pos, 'bonk')
          return { frames, outcome: 'bonk', blame: cmdIndex, consumed: ptr }
        }
        state.dir = cmd
      }
    }

    const from = { ...state.pos }
    const to = add(from, state.dir!)
    state.pos = to

    const changed: Vec2[] = []
    const leaving = at(state.world, from)
    if (leaving.kind === 'fragile' && !leaving.collapsed) {
      leaving.collapsed = true
      changed.push(from)
    }
    const trig = onEnter(state, to)
    changed.push(...trig.changed)
    const event: FrameEvent = trig.kind.includes('pickup')
      ? 'pickup'
      : trig.kind.includes('gate')
        ? 'gate'
        : changed.length
          ? 'collapse'
          : carried
            ? 'carry'
            : 'step'
    push(from, to, event, changed, carried)

    if (satisfied(state, exit, level.goal)) {
      state.done = true
      push(to, to, 'win')
      return { frames, outcome: 'win', blame: null, consumed: ptr }
    }
    if (!reachable(state, exit, level.goal)) {
      push(to, to, 'stranded')
      return { frames, outcome: 'stranded', blame: null, consumed: ptr }
    }
  }

  return { frames, outcome: 'looping', blame: null, consumed: ptr }
}

/** The world before any instruction runs — what build mode renders. */
export function initialState(level: Level): State {
  const { world, start, items } = levelStart(level)
  const s: State = { pos: { ...start }, dir: null, world, items, held: [], done: false }
  onEnter(s, s.pos)
  return s
}
