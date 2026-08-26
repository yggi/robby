export type Dir = 'up' | 'down' | 'left' | 'right'

export const DIRS: Dir[] = ['up', 'right', 'down', 'left']

export const DELTA: Record<Dir, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const OPPOSITE: Record<Dir, Dir> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

export interface Vec2 {
  x: number
  y: number
}

/**
 * The three things everybody wants from `DELTA`, so that nobody writes out
 * `[[1,0],[-1,0],[0,1],[0,-1]]` again. Five copies of that array and a second
 * `[Dir, dx, dy]` table in the generator is what these replace; the array
 * literals were all subtly ordered differently, which made them impossible to
 * compare by eye.
 */
export const step = (p: Vec2, d: Dir): Vec2 => ({ x: p.x + DELTA[d].x, y: p.y + DELTA[d].y })
/** The four tiles a robot could walk to from `p`. */
export const neighbours = (p: Vec2): Vec2[] => DIRS.map((d) => step(p, d))
/**
 * All eight tiles touching `p`, diagonals included — what a cat may bolt to,
 * and (called on the origin) the eight directions something may scamper off in.
 */
export const around = (p: Vec2): Vec2[] => [
  ...neighbours(p),
  { x: p.x - 1, y: p.y - 1 },
  { x: p.x + 1, y: p.y - 1 },
  { x: p.x - 1, y: p.y + 1 },
  { x: p.x + 1, y: p.y + 1 },
]
/** The one spelling of a position used as a Set/Map key. */
export const posKey = (p: Vec2) => `${p.x},${p.y}`

/**
 * How many of each direction a program spends. The tray, the solver's budget
 * check and the editor's minus button are all this histogram; it used to be
 * written out as `par.filter((p) => p === d).length` in five places.
 */
export function spend(program: Dir[]): Record<Dir, number> {
  const used: Record<Dir, number> = { up: 0, right: 0, down: 0, left: 0 }
  for (const d of program) used[d]++
  return used
}

/**
 * Every kind of tile, as a `const` array with the union derived from it — the
 * same shape as `THEMES` below, and for the same reason. A kind that exists
 * only as a member of a union cannot be enumerated at runtime, so nothing can
 * check that it has a map character, a palette or a room to appear in. Written
 * this way, `legend.ts` can assert that every one of them is reachable.
 */
export const CELL_KINDS = [
  'wall',
  'floor',
  /** the rocket pad — only lets the robot leave if it is carrying enough */
  'exit',
  /** a way through that is shut for good: rubble, vines, a fallen trunk */
  'blocked',
  /**
   * A conveyor. Stepping on costs one instruction; the ride is free. It carries
   * the robot along `dir` until the next tile is not enterable, at which point
   * he is simply standing there. It cannot be walked onto against its flow.
   */
  'belt',
  /** blocks until opened */
  'gate',
  /** trigger: opens linked gate */
  'plate',
  /** may only be exited in `only` */
  'oneway',
  /** becomes wall once the robot leaves it */
  'fragile',
] as const

export type CellKind = (typeof CELL_KINDS)[number]

export interface Cell {
  kind: CellKind
  /** gate / plate link id */
  link?: number
  /** oneway exit direction */
  only?: Dir
  /** which way a belt runs */
  dir?: Dir
  /** runtime: gate opened, fragile collapsed */
  open?: boolean
  collapsed?: boolean
}

export const ITEM_KINDS = ['battery', 'key', 'cog', 'coil', 'core'] as const

export type ItemKind = (typeof ITEM_KINDS)[number]

/**
 * What the level is actually asking for. A key is a tool, not an objective —
 * picking one up never finishes anything.
 */
export const OBJECTIVES: ItemKind[] = ['battery', 'cog', 'coil', 'core']

export interface Item {
  id: string
  kind: ItemKind
  at: Vec2
}

/** What finishing the level requires. */
export type Goal =
  /** grab every objective in the room, in whatever order suits you */
  | { type: 'collect' }
  /**
   * Reach the rocket carrying everything it needs. `requires` is the manifest:
   * today that is just a charged battery, but it is a list precisely so a
   * later level can demand a repair part or a key alongside it.
   */
  | { type: 'exit'; requires: ItemKind[] }

/**
 * The one list of themes. The union is derived from it rather than written
 * beside it, so a new world cannot be half-added: `DECOR` is keyed by `Theme`
 * and will not compile without its backdrop, and the smoke suite checks the
 * stylesheet has a block for every entry here.
 */
export const THEMES = [
  'lab', 'forest', 'scrap', 'cheese',
  'house', 'garden', 'city', 'factory', 'ship',
] as const

export type Theme = (typeof THEMES)[number]

export interface Level {
  id: string
  /** decoration only — the engine never reads this */
  theme: Theme
  /** which room of the Lab this is, for the level select */
  room?: string
  /** ASCII rows, see LEGEND in parse.ts */
  map: string[]
  goal: Goal
  /** token budget per direction; absent direction = unavailable */
  tray: Partial<Record<Dir, number>>
  /** reference solution — asserted solvable & minimal in CI */
  par: Dir[]
}

export interface World {
  w: number
  h: number
  cells: Cell[] // row-major
}

/** A chapter of Robby and Funke's adventure. */
export interface Chapter {
  id: string
  name: string
  blurb: string
  theme: Theme
  levels: Level[]
}

export interface State {
  pos: Vec2
  /** null before the first instruction — the start tile always consumes one */
  dir: Dir | null
  world: World
  items: Item[] // remaining in the world
  held: ItemKind[]
  done: boolean
}

export type FrameEvent =
  | 'step' // moved one tile
  | 'carry' // moved one tile on a conveyor, at no cost
  | 'pickup'
  | 'gate' // a gate opened
  | 'collapse'
  | 'bonk' // instruction pointed at a wall
  | 'shrug' // decision tile, program exhausted
  | 'stranded' // objectives no longer reachable
  | 'win'

export interface Frame {
  /** true when the belt moved him rather than an instruction */
  carried?: boolean
  from: Vec2
  to: Vec2
  dir: Dir | null
  /** index into the program that authorised this frame */
  cmdIndex: number | null
  event: FrameEvent
  /** cells whose visual state changed this frame */
  changed: Vec2[]
  state: State
}

export type Outcome = 'win' | 'bonk' | 'shrug' | 'stranded' | 'looping'

export interface Trace {
  frames: Frame[]
  outcome: Outcome
  /** slot that caused a bonk, for the red highlight */
  blame: number | null
  /** how many tokens the program actually used */
  consumed: number
}
