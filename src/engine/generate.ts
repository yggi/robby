import { charFor } from './legend'
import { derive } from './level'
import {
  DIRS, neighbours, posKey, step,
  type Dir, type ItemKind, type Level, type Vec2,
} from './types'

/**
 * Practice rooms for the Lab.
 *
 * The shape is built, the quality is filtered. A self-avoiding walk guarantees
 * the one property World 1 is about — exactly one way through, no loops — which
 * no amount of filtering could reliably produce. Everything else is judged by
 * running the solver over the candidate and throwing it away if the answer is
 * dull, which is cheap: a room this size solves in well under a tenth of a
 * second.
 */

/** mulberry32: small, fast, and identical on every machine. */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface GenSpec {
  /** interior size, excluding the wall border */
  w: number
  h: number
  /** how long the corridor should be, in tiles */
  length: [number, number]
  /** how many dead-end decoys to hang off it */
  stubs: [number, number]
  /** acceptable range for the solved par */
  par: [number, number]
}

export const LAB_SPEC: GenSpec = {
  w: 7,
  h: 5,
  length: [9, 16],
  stubs: [1, 3],
  par: [3, 7],
}

/**
 * The load-bearing test: turn the room's mechanic off and solve it again. If the
 * answer is the same length, the mechanic was scenery.
 *
 * Which *way* the answer moves is not the point, and assuming it was cost me an
 * afternoon: taking World 1's decoys away makes par shorter, because each decoy
 * is a junction to be told about — but opening World 2's blocked passage makes
 * par *longer*, for exactly the same reason. Difference is the signal.
 */
function mechanicMatters(withIt: Dir[], without: Dir[] | null): boolean {
  return !without || without.length !== withIt.length
}

/** The tiles a generated room is drawn from, read off the legend. */
const WALL = charFor({ cell: 'wall' })
const FLOOR = charFor({ cell: 'floor' })
const ROBOT = charFor({ cell: 'floor', start: true })
const BATTERY = charFor({ cell: 'floor', item: 'battery' })
const BLOCKED = charFor({ cell: 'blocked' })

const inGrid = (spec: GenSpec, c: Vec2) =>
  c.x >= 0 && c.y >= 0 && c.x < spec.w && c.y < spec.h

/** How many already-laid tiles a candidate touches. */
const touching = (taken: Set<string>, c: Vec2) =>
  neighbours(c).filter((n) => taken.has(posKey(n))).length

/**
 * Where the corridor may go next from `here`: inside the grid, not already
 * laid, and touching exactly one laid tile. That last clause is the whole
 * reason the corridor stays one tile wide and never closes a loop, and it was
 * written out three times — once in `walk`, once in `branch`, once inline in
 * `addStubs` with the bounds check on the other side of it.
 */
function growable(spec: GenSpec, taken: Set<string>, here: Vec2): Vec2[] {
  return neighbours(here).filter(
    (c) => inGrid(spec, c) && !taken.has(posKey(c)) && touching(taken, c) === 1,
  )
}

/**
 * Grow a corridor one tile at a time. A candidate is only allowed if it touches
 * exactly one tile already laid — itself excepted — which is what keeps the
 * corridor one tile wide and stops it ever closing a loop.
 */
export function walk(spec: GenSpec, r: () => number): Vec2[] {
  const start: Vec2 = { x: (r() * spec.w) | 0, y: (r() * spec.h) | 0 }
  const taken = new Set([posKey(start)])
  const path = [start]
  const want = spec.length[0] + ((r() * (spec.length[1] - spec.length[0] + 1)) | 0)

  while (path.length < want) {
    const options = growable(spec, taken, path[path.length - 1])
    if (!options.length) break
    const next = options[(r() * options.length) | 0]
    taken.add(posKey(next))
    path.push(next)
  }
  return path
}

/**
 * Hang dead ends off the straight stretches. Each one turns a tile the robot
 * would have walked through into a tile where he has to be told to carry on —
 * which is the whole lesson of a junction, and costs exactly one more token.
 */
function addStubs(path: Vec2[], spec: GenSpec, r: () => number): Vec2[] {
  const taken = new Set(path.map(posKey))
  const stubs: Vec2[] = []
  const want = spec.stubs[0] + ((r() * (spec.stubs[1] - spec.stubs[0] + 1)) | 0)

  // straight stretches only: hanging a stub off a corner makes a three-way
  // junction, which is a different and much harder lesson
  const straights = path.slice(1, -1).filter((c, i) => {
    const a = path[i]
    const b = path[i + 2]
    return a.x === b.x || a.y === b.y
  })

  // one stub per tile: picking the same base twice builds a four-way junction,
  // which is three wrong answers at once rather than the single choice intended
  const used = new Set<string>()
  for (let n = 0; n < want && straights.length; n++) {
    const from = straights[(r() * straights.length) | 0]
    if (used.has(posKey(from))) continue
    used.add(posKey(from))
    const dirs = [...DIRS].sort(() => r() - 0.5)
    for (const d of dirs) {
      const cells: Vec2[] = []
      let c = from
      for (let hop = 0; hop < 2; hop++) {
        c = step(c, d)
        const touches = touching(taken, c)
        if (!inGrid(spec, c)) break
        if (taken.has(posKey(c)) || touches !== 1) break
        cells.push(c)
        taken.add(posKey(c))
      }
      if (cells.length >= 2) {
        stubs.push(...cells)
        break
      }
      for (const cell of cells) taken.delete(posKey(cell))
    }
  }
  return stubs
}

/**
 * Cropped to what the corridor actually uses, plus its wall. A walk rarely
 * fills the grid it was drawn in, and an uncropped room is mostly empty
 * space — which reads as a mistake on the level-select minimap.
 */
export function renderMap(
  spec: GenSpec,
  path: Vec2[],
  stubs: Vec2[],
  marks: Map<string, string> = new Map(),
): string[] {
  const all = [...path, ...stubs]
  const x0 = Math.min(...all.map((c) => c.x))
  const y0 = Math.min(...all.map((c) => c.y))
  const w = Math.max(...all.map((c) => c.x)) - x0 + 3
  const h = Math.max(...all.map((c) => c.y)) - y0 + 3

  const rows: string[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => WALL))
  const put = (c: Vec2, ch: string) => (rows[c.y - y0 + 1][c.x - x0 + 1] = ch)
  for (const c of all) put(c, FLOOR)
  if (marks.size) {
    for (const c of all) {
      const m = marks.get(posKey(c))
      if (m) put(c, m)
    }
  } else {
    put(path[path.length - 1], BATTERY)
  }
  put(path[0], ROBOT)
  return rows.map((r) => r.join(''))
}

/**
 * The shared verdict on a candidate, and the only place a room is accepted.
 *
 * Both worlds build a map their own way, then ask the same three questions:
 * is it solvable, is the answer the right length, and does the world's own
 * mechanic actually change that answer. Keeping the questions in one place is
 * what stops one world quietly drifting into shipping levels the other would
 * have rejected.
 */
function judge(
  spec: GenSpec,
  id: string,
  theme: Level['theme'],
  map: string[],
  /** the same room with the mechanic disabled: decoys removed, passages opened */
  plainMap: string[],
): Level | null {
  // Always the shortest par worth accepting, plus one. Searching deeper than
  // the band while rejecting everything above it is exponential waste.
  const depth = spec.par[1] + 1
  const o = { id, theme, room: 'Practice' }

  const level = derive(map, o, depth)
  if (!level) return null
  if (level.par.length < spec.par[0] || level.par.length > spec.par[1]) return null

  // The world's mechanic has to earn its place. Note the test is *difference*,
  // not "shorter": removing World 1's decoys shortens par, while opening World
  // 2's blocked passage lengthens it, and both mean the mechanic was doing work.
  if (!mechanicMatters(level.par, derive(plainMap, o, depth)?.par ?? null)) return null

  return level
}

export function attempt(seed: number, spec: GenSpec = LAB_SPEC): Level | null {
  const r = rng(seed)
  const path = walk(spec, r)
  if (path.length < spec.length[0]) return null

  const stubs = addStubs(path, spec, r)
  if (!stubs.length) return null

  // World 1's mechanic is the decoy stub, so the plain room is the bare corridor
  return judge(
    spec,
    `lab-gen-${seed}`,
    'lab',
    renderMap(spec, path, stubs),
    renderMap(spec, path, []),
  )
}

/**
 * Keep rolling until a room passes. The rejection rate is high by design —
 * candidates are nearly free and dull rooms are not worth playing — so the
 * budget is generous and the caller is told plainly when it ran out.
 */
export function generate(seed: number, spec: GenSpec = LAB_SPEC, budget = 60): Level | null {
  for (let i = 0; i < budget; i++) {
    const level = attempt((seed + i * 0x9e3779b1) >>> 0, spec)
    if (level) return level
  }
  return null
}


/* ══════════════════════════ World 2 ══════════════════════════
   Branching corridors, several things to fetch, and passages that are shut for
   good. Where World 1 wants exactly one way through, this wants several — so
   the generator grows a tree of side branches off a trunk and hangs the parts
   at the far ends of them. */

export const FOREST_SPEC: GenSpec = {
  // roomier than the Lab's, and with a shorter trunk: the non-touching rule that
  // keeps corridors one tile wide also makes side passages hard to fit, so the
  // trunk has to leave space for them rather than filling the grid
  w: 9,
  h: 7,
  length: [6, 10],
  stubs: [2, 4],
  par: [6, 11],
}

/** The three repair parts, in the order the arms hand them out. */
const PART_CHARS = ['cog', 'coil', 'core'].map((item) =>
  charFor({ cell: 'floor', item: item as ItemKind }),
)

/** Grow a side passage off any tile already laid, under the same rule as the
    trunk: touch exactly one existing tile, so the result stays a tree. */
export function branch(from: Vec2, spec: GenSpec, taken: Set<string>, r: () => number, want: number): Vec2[] {
  const out: Vec2[] = []
  let here = from
  for (let i = 0; i < want; i++) {
    const options = growable(spec, taken, here)
    if (!options.length) break
    here = options[(r() * options.length) | 0]
    taken.add(posKey(here))
    out.push(here)
  }
  return out
}

export function attemptForest(seed: number, spec: GenSpec = FOREST_SPEC): Level | null {
  const r = rng(seed)
  const trunk = walk(spec, r)
  if (trunk.length < spec.length[0]) return null

  const taken = new Set(trunk.map(posKey))
  const arms: Vec2[][] = []
  for (let i = 0; i < 5; i++) {
    // several bases are tried per arm: most tiles on a winding trunk have no
    // room beside them, and giving up after one is how the yield collapsed
    for (let t = 0; t < 6; t++) {
      const base = trunk[1 + ((r() * (trunk.length - 1)) | 0)]
      const arm = branch(base, spec, taken, r, 2 + ((r() * 3) | 0))
      if (arm.length >= 2) {
        arms.push(arm)
        break
      }
    }
  }
  // two parts need two arms to hang from, plus one spare arm to shut off
  if (arms.length < 3) return null

  const marks = new Map<string, string>()
  const shuffled = [...arms].sort(() => r() - 0.5)
  const parts = 2 + ((r() * 2) | 0)
  const holders = shuffled.slice(0, Math.min(parts, shuffled.length - 1))
  holders.forEach((arm, i) => marks.set(posKey(arm[arm.length - 1]), PART_CHARS[i % 3]))

  // whatever arm is left over gets grown over at its mouth: a passage you can
  // see the length of and cannot take
  const decoy = shuffled[holders.length]
  marks.set(posKey(decoy[0]), BLOCKED)

  // World 2's mechanic is the passage grown over, so the plain room has it clear
  const opened = new Map(marks)
  opened.delete(posKey(decoy[0]))
  return judge(
    spec,
    `forest-gen-${seed}`,
    'forest',
    renderMap(spec, trunk, arms.flat(), marks),
    renderMap(spec, trunk, arms.flat(), opened),
  )
}

/**
 * Which chapters have a generator behind them, and everything that goes with
 * one. This is the single statement of it: the type, the roller, the fallback
 * seeds and the level select's practice tile all come off this object.
 *
 * The list used to be written twice — here as a union, and again in the store
 * as `chapter.id === 'lab' || chapter.id === 'forest'` — with an unchecked cast
 * bridging them. Nothing but the level select's own `{#if}` kept a chapter with
 * no generator out of `FALLBACK_SEEDS`, where it would have read `undefined`
 * and thrown one line later.
 *
 * **The seeds are known to produce a room**, and are checked on every test run.
 * The roller runs on the main thread the instant a child taps the tile, so it
 * can neither think for as long as it likes nor come back empty: `openPractice`
 * would then fall through to whatever curated room the index happened to be
 * pointing at, wearing a Practice title. A guaranteed answer is worth more here
 * than a perfectly fresh one — and a list rather than one seed, because World 2
 * spends its budget on about a fifth of rolls and a single fallback meant one
 * room in five was the same room.
 */
export const GENERATORS = {
  lab: {
    roll: attempt,
    seeds: [104729, 15485863, 32452843, 49979687, 67867979, 86028121],
  },
  forest: {
    roll: attemptForest,
    seeds: [209458, 22801763, 41263207, 58256191, 79451287, 93951539],
  },
} as const

export type ChapterId = keyof typeof GENERATORS

/** Does this chapter offer an endless room? The level select's only question. */
export const canGenerate = (id: string): id is ChapterId => id in GENERATORS

export const FALLBACK_SEEDS: Record<ChapterId, readonly number[]> = {
  lab: GENERATORS.lab.seeds,
  forest: GENERATORS.forest.seeds,
}

export interface RollBudget {
  /** how many candidates to try */
  attempts?: number
  /** and how long to spend trying, whichever runs out first */
  ms?: number
}

/**
 * Roll practice rooms until one is worth playing, or until the budget is spent.
 * Never returns null: a spent budget falls back to a known-good seed.
 *
 * The time limit is the one that matters. A World 2 candidate costs about 19ms
 * to judge and only one in eleven survives, so an attempt count alone allows a
 * visible freeze on an unlucky roll.
 */
export function generateFor(chapter: ChapterId, seed: number, budget: RollBudget = {}): Level {
  // 250ms of trying, not 250ms total: one World 2 candidate can cost 200ms to
  // judge on its own, so the ceiling in practice is roughly double this
  const { attempts = 90, ms = 250 } = budget
  const { roll, seeds } = GENERATORS[chapter]
  const deadline = Date.now() + ms

  for (let i = 0; i < attempts; i++) {
    // checked before starting rather than after finishing: the budget bounds
    // how long we go on trying, and a candidate already in flight cannot be
    // interrupted, so the last one is always paid for in full
    if (i && Date.now() > deadline) break
    const level = roll((seed + i * 0x9e3779b1) >>> 0)
    if (level) return level
  }
  return fallbackRoom(chapter, seeds[seed % seeds.length])
}

/**
 * Fallback rooms are built once and kept. Rolling one costs as much as the
 * search that just gave up — which would double the wait at exactly the moment
 * there is none to spare.
 */
const spare = new Map<string, Level>()

function fallbackRoom(chapter: ChapterId, seed: number): Level {
  const k = `${chapter}:${seed}`
  let room = spare.get(k)
  if (!room) {
    room = rollUnbounded(chapter, seed)
    spare.set(k, room)
  }
  return room
}

/** Used only for the fallback seeds, which are verified in the test suite. */
export function rollUnbounded(chapter: ChapterId, seed: number, attempts = 200): Level {
  const { roll } = GENERATORS[chapter]
  for (let i = 0; i < attempts; i++) {
    const level = roll((seed + i * 0x9e3779b1) >>> 0)
    if (level) return level
  }
  throw new Error(`no room from fallback seed ${seed} for ${chapter}`)
}
