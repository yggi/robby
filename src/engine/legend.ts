import {
  CELL_KINDS,
  ITEM_KINDS,
  type Cell,
  type CellKind,
  type Dir,
  type ItemKind,
} from './types'

/**
 * The map format, as a table rather than as prose plus five separate readings
 * of it.
 *
 * A room is text — that is why a built room saves as nothing but its map string,
 * why a room could travel as a URL, and why the shipped levels and the editor's
 * drafts are the same kind of object. The characters were being interpreted in
 * five places: an if-else ladder here, a brush table in the editor, a parts list
 * in the generator, a colour ladder in the minimap, and raw `ch === '*'` tests
 * in the editor's markup. Adding a piece meant finding all five.
 *
 * Now there is one list, and both directions come off it.
 */
export interface Glyph {
  /** the character as it appears in a map row */
  ch: string
  /** what the tile itself is */
  cell: CellKind
  /** an item lying on the floor here */
  item?: ItemKind
  /** the robot starts here */
  start?: boolean
  /** which way a belt runs */
  dir?: Dir
  /** the only way a one-way may be left */
  only?: Dir
  /** which gate a plate opens, and which plate opens a gate */
  link?: number
}

const PLAIN: Glyph[] = [
  { ch: '#', cell: 'wall' },
  { ch: '.', cell: 'floor' },
  { ch: 'R', cell: 'floor', start: true },
  { ch: '=', cell: 'blocked' },
  { ch: '~', cell: 'fragile' },
  { ch: '@', cell: 'exit' },

  { ch: '*', cell: 'floor', item: 'battery' },
  { ch: 'k', cell: 'floor', item: 'key' },
  { ch: 'c', cell: 'floor', item: 'cog' },
  { ch: 's', cell: 'floor', item: 'coil' },
  { ch: 'x', cell: 'floor', item: 'core' },

  { ch: 'N', cell: 'belt', dir: 'up' },
  { ch: 'E', cell: 'belt', dir: 'right' },
  { ch: 'S', cell: 'belt', dir: 'down' },
  { ch: 'W', cell: 'belt', dir: 'left' },

  { ch: '^', cell: 'oneway', only: 'up' },
  { ch: '>', cell: 'oneway', only: 'right' },
  { ch: 'v', cell: 'oneway', only: 'down' },
  { ch: '<', cell: 'oneway', only: 'left' },
]

/**
 * Gates are digits and their plates are the matching letter: `1`/`A`, `2`/`B`,
 * and so on. Generated rather than typed out eighteen times, so a pair cannot
 * be mismatched by a slip of the finger.
 *
 * **There is no plate `E`, and therefore no plate for gate 5.** `E` was spent
 * on the east-running conveyor first, and the old parser read the belt table
 * before the letter range, so `E` in a map has always been a conveyor — the
 * legend's own comment said `A-I` and meant eight of the nine. Left as it is
 * on purpose: the characters are the save format, and moving one would silently
 * change every room anybody has already built. `LINKS` below is what makes the
 * gap visible instead of accidental, and the duplicate-character assertion in
 * `legend.test.ts` is what stops a future entry re-taking `E` by mistake.
 */
export const LINKS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const plateChar = (link: number) => String.fromCharCode(64 + link)
const spokenFor = new Set(PLAIN.map((g) => g.ch))

const LINKED: Glyph[] = LINKS.flatMap((link) => {
  const glyphs: Glyph[] = [{ ch: String(link), cell: 'gate', link }]
  if (!spokenFor.has(plateChar(link))) glyphs.push({ ch: plateChar(link), cell: 'plate', link })
  return glyphs
})

export const LEGEND: Glyph[] = [...PLAIN, ...LINKED]

const BY_CHAR = new Map(LEGEND.map((g) => [g.ch, g]))

/** What a map character means, or nothing — an unknown character is bare floor. */
export const glyphFor = (ch: string): Glyph | undefined => BY_CHAR.get(ch)

/**
 * The runtime cell a glyph describes, with the mutable state a run will change
 * set to its starting value. `open` and `collapsed` are the only two, and this
 * is the one place they are initialised.
 */
export function cellOf(g: Glyph): Cell {
  const cell: Cell = { kind: g.cell }
  if (g.dir) cell.dir = g.dir
  if (g.only) cell.only = g.only
  if (g.link !== undefined) cell.link = g.link
  if (g.cell === 'gate') cell.open = false
  if (g.cell === 'fragile') cell.collapsed = false
  return cell
}

/**
 * The character for a tile — the inverse the parser never had, and the reason
 * the editor's palette can be a list of tiles rather than a second copy of the
 * table above.
 *
 * The match is exact: a field left out of `want` must be absent from the glyph
 * too, so `charFor({ cell: 'floor' })` is `.` rather than whichever of `R`, `*`
 * or `k` happened to be listed first.
 */
export function charFor(want: Partial<Glyph>): string {
  const g = LEGEND.find(
    (g) =>
      g.cell === (want.cell ?? 'floor') &&
      (g.item ?? null) === (want.item ?? null) &&
      (g.dir ?? null) === (want.dir ?? null) &&
      (g.only ?? null) === (want.only ?? null) &&
      (g.link ?? null) === (want.link ?? null) &&
      !!g.start === !!want.start,
  )
  if (!g) throw new Error(`nothing in the legend writes ${JSON.stringify(want)}`)
  return g.ch
}

/** Every cell kind that has a character, in legend order. */
export const WRITABLE_CELLS = CELL_KINDS.filter((k) => LEGEND.some((g) => g.cell === k))
/** Every item kind that has a character, in legend order. */
export const WRITABLE_ITEMS = ITEM_KINDS.filter((k) => LEGEND.some((g) => g.item === k))
