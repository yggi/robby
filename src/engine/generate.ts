import { solve } from './solve'
import type { Dir, Level } from './types'

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

const DELTAS: [Dir, number, number][] = [
  ['up', 0, -1],
  ['right', 1, 0],
  ['down', 0, 1],
  ['left', -1, 0],
]

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

type Cell = { x: number; y: number }
const key = (c: Cell) => `${c.x},${c.y}`

/**
 * Grow a corridor one tile at a time. A candidate is only allowed if it touches
 * exactly one tile already laid — itself excepted — which is what keeps the
 * corridor one tile wide and stops it ever closing a loop.
 */
export function walk(spec: GenSpec, r: () => number): Cell[] {
  const start: Cell = { x: (r() * spec.w) | 0, y: (r() * spec.h) | 0 }
  const taken = new Set([key(start)])
  const path = [start]
  const want = spec.length[0] + ((r() * (spec.length[1] - spec.length[0] + 1)) | 0)

  while (path.length < want) {
    const here = path[path.length - 1]
    const options = DELTAS.map(([, dx, dy]) => ({ x: here.x + dx, y: here.y + dy })).filter(
      (c) =>
        c.x >= 0 &&
        c.y >= 0 &&
        c.x < spec.w &&
        c.y < spec.h &&
        !taken.has(key(c)) &&
        DELTAS.filter(([, dx, dy]) => taken.has(key({ x: c.x + dx, y: c.y + dy }))).length === 1,
    )
    if (!options.length) break
    const next = options[(r() * options.length) | 0]
    taken.add(key(next))
    path.push(next)
  }
  return path
}

/**
 * Hang dead ends off the straight stretches. Each one turns a tile the robot
 * would have walked through into a tile where he has to be told to carry on —
 * which is the whole lesson of a junction, and costs exactly one more token.
 */
function addStubs(path: Cell[], spec: GenSpec, r: () => number): Cell[] {
  const taken = new Set(path.map(key))
  const stubs: Cell[] = []
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
    if (used.has(key(from))) continue
    used.add(key(from))
    const dirs = [...DELTAS].sort(() => r() - 0.5)
    for (const [, dx, dy] of dirs) {
      const cells: Cell[] = []
      let c = from
      for (let step = 0; step < 2; step++) {
        c = { x: c.x + dx, y: c.y + dy }
        const touching = DELTAS.filter(([, ax, ay]) =>
          taken.has(key({ x: c.x + ax, y: c.y + ay })),
        ).length
        if (c.x < 0 || c.y < 0 || c.x >= spec.w || c.y >= spec.h) break
        if (taken.has(key(c)) || touching !== 1) break
        cells.push(c)
        taken.add(key(c))
      }
      if (cells.length >= 2) {
        stubs.push(...cells)
        break
      }
      for (const cell of cells) taken.delete(key(cell))
    }
  }
  return stubs
}

/**
 * Cropped to what the corridor actually uses, plus its wall. A walk rarely
 * fills the grid it was drawn in, and an uncropped room is mostly empty
 * space — which reads as a mistake on the level-select minimap.
 */
export function toMap(
  spec: GenSpec,
  path: Cell[],
  stubs: Cell[],
  marks: Map<string, string> = new Map(),
): string[] {
  const all = [...path, ...stubs]
  const x0 = Math.min(...all.map((c) => c.x))
  const y0 = Math.min(...all.map((c) => c.y))
  const w = Math.max(...all.map((c) => c.x)) - x0 + 3
  const h = Math.max(...all.map((c) => c.y)) - y0 + 3

  const rows: string[][] = Array.from({ length: h }, () => Array.from({ length: w }, () => '#'))
  const put = (c: Cell, ch: string) => (rows[c.y - y0 + 1][c.x - x0 + 1] = ch)
  for (const c of all) put(c, '.')
  if (marks.size) {
    for (const c of all) {
      const m = marks.get(key(c))
      if (m) put(c, m)
    }
  } else {
    put(path[path.length - 1], '*')
  }
  put(path[0], 'R')
  return rows.map((r) => r.join(''))
}

/** A forgiving tray: the answer, plus a spare of everything, so a wrong turn
    can always be walked back out of. */
function trayFor(par: Dir[]): Level['tray'] {
  const tray: Level['tray'] = {}
  for (const [d] of DELTAS) {
    const used = par.filter((p) => p === d).length
    tray[d] = used + 1
  }
  return tray
}

/** One attempt. Returns null when the candidate is not worth playing. */

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
  const depth = spec.par[1] + 1
  const base = (m: string[]): Level => ({
    id,
    theme,
    room: 'Practice',
    map: m,
    goal: { type: 'collect' },
    tray: { up: 9, right: 9, down: 9, left: 9 },
    par: [],
  })

  const level = base(map)
  const par = solve(level, depth)
  if (!par) return null
  if (par.length < spec.par[0] || par.length > spec.par[1]) return null

  // The world's mechanic has to earn its place. Note the test is *difference*,
  // not "shorter": removing World 1's decoys shortens par, while opening World
  // 2's blocked passage lengthens it, and both mean the mechanic was doing work.
  if (!mechanicMatters(par, solve(base(plainMap), depth))) return null

  return { ...level, par, tray: trayFor(par) }
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
    toMap(spec, path, stubs),
    toMap(spec, path, []),
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

const PART_CHARS = ['c', 's', 'x']

/** Grow a side passage off any tile already laid, under the same rule as the
    trunk: touch exactly one existing tile, so the result stays a tree. */
export function branch(from: Cell, spec: GenSpec, taken: Set<string>, r: () => number, want: number): Cell[] {
  const out: Cell[] = []
  let here = from
  for (let i = 0; i < want; i++) {
    const options = DELTAS.map(([, dx, dy]) => ({ x: here.x + dx, y: here.y + dy })).filter(
      (c) =>
        c.x >= 0 && c.y >= 0 && c.x < spec.w && c.y < spec.h &&
        !taken.has(key(c)) &&
        DELTAS.filter(([, dx, dy]) => taken.has(key({ x: c.x + dx, y: c.y + dy }))).length === 1,
    )
    if (!options.length) break
    here = options[(r() * options.length) | 0]
    taken.add(key(here))
    out.push(here)
  }
  return out
}

export function attemptForest(seed: number, spec: GenSpec = FOREST_SPEC): Level | null {
  const r = rng(seed)
  const trunk = walk(spec, r)
  if (trunk.length < spec.length[0]) return null

  const taken = new Set(trunk.map(key))
  const arms: Cell[][] = []
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
  holders.forEach((arm, i) => marks.set(key(arm[arm.length - 1]), PART_CHARS[i % 3]))

  // whatever arm is left over gets grown over at its mouth: a passage you can
  // see the length of and cannot take
  const decoy = shuffled[holders.length]
  marks.set(key(decoy[0]), '=')

  // World 2's mechanic is the passage grown over, so the plain room has it clear
  const opened = new Map(marks)
  opened.delete(key(decoy[0]))
  return judge(
    spec,
    `forest-gen-${seed}`,
    'forest',
    toMap(spec, trunk, arms.flat(), marks),
    toMap(spec, trunk, arms.flat(), opened),
  )
}

export type ChapterId = 'lab' | 'forest'

/**
 * Seeds known to produce a room, checked on every run by the generator tests.
 *
 * The roller runs on the main thread the instant a child taps the tile, so it
 * cannot be allowed to think for as long as it likes, and it cannot be allowed
 * to come back empty either: `openPractice` would then fall through to whatever
 * curated room the index happened to be pointing at, wearing a Practice title.
 * A guaranteed answer is worth more here than a perfectly fresh one.
 */
export const FALLBACK_SEEDS: Record<ChapterId, number[]> = {
  lab: [104729, 15485863, 32452843, 49979687, 67867979, 86028121],
  forest: [209458, 22801763, 41263207, 58256191, 79451287, 93951539],
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
  const roll = chapter === 'forest' ? attemptForest : attempt
  const deadline = Date.now() + ms

  for (let i = 0; i < attempts; i++) {
    // checked before starting rather than after finishing: the budget bounds
    // how long we go on trying, and a candidate already in flight cannot be
    // interrupted, so the last one is always paid for in full
    if (i && Date.now() > deadline) break
    const level = roll((seed + i * 0x9e3779b1) >>> 0)
    if (level) return level
  }
  // A list rather than one seed: World 2 spends its budget on about a fifth of
  // rolls, and a single fallback meant one room in five was the same room.
  const list = FALLBACK_SEEDS[chapter]
  return fallbackRoom(chapter, list[seed % list.length])
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
  const roll = chapter === 'forest' ? attemptForest : attempt
  for (let i = 0; i < attempts; i++) {
    const level = roll((seed + i * 0x9e3779b1) >>> 0)
    if (level) return level
  }
  throw new Error(`no room from fallback seed ${seed} for ${chapter}`)
}
