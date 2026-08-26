import { neighbours } from '../engine/types'
/**
 * The things in Robby's rooms.
 *
 * Every one of these is placed by hand at a named coordinate. An earlier
 * version scattered them with a hash across any wall beside the path, which
 * filled each room with plausible-looking junk that meant nothing. A handful
 * of deliberate objects says far more: the charger he wakes up on, the berth
 * he sleeps in with Funke's basket beside it, the fuel drums by the pad.
 */

const crate = `
<g><rect class="p-wood" x="18" y="40" width="64" height="50" rx="5"/>
<rect class="p-wood2" x="18" y="40" width="64" height="9" rx="4"/>
<path class="p-wood2" d="M22 52 L78 84 M78 52 L22 84" stroke-width="6" stroke="currentColor" fill="none"/></g>`

const drum = `
<g><rect class="p-metal" x="26" y="26" width="48" height="66" rx="12"/>
<ellipse class="p-metal2" cx="50" cy="28" rx="24" ry="7"/>
<rect class="p-accent" x="26" y="46" width="48" height="8"/>
<rect class="p-accent" x="26" y="70" width="48" height="8"/></g>`

const toolbox = `
<g><rect class="p-accent" x="16" y="50" width="68" height="40" rx="6"/>
<rect class="p-dark" x="16" y="62" width="68" height="6"/>
<path class="p-metal2" d="M36 50 v-10 a14 8 0 0 1 28 0 v10" fill="none" stroke="currentColor" stroke-width="6"/></g>`

const shelf = `
<g><rect class="p-wood2" x="14" y="18" width="72" height="74" rx="4"/>
<rect class="p-wood" x="20" y="24" width="60" height="24"/>
<rect class="p-wood" x="20" y="56" width="60" height="24"/>
<rect class="p-glass" x="26" y="28" width="12" height="18" rx="3"/>
<rect class="p-teal" x="44" y="30" width="12" height="16" rx="3"/>
<rect class="p-accent" x="62" y="26" width="11" height="20" rx="3"/>
<rect class="p-metal" x="28" y="62" width="16" height="16" rx="3"/>
<rect class="p-glass" x="52" y="60" width="13" height="18" rx="3"/></g>`

const tyres = `
<g><ellipse class="p-dark" cx="50" cy="80" rx="32" ry="12"/>
<ellipse class="p-metal2" cx="50" cy="76" rx="15" ry="5"/>
<ellipse class="p-dark" cx="50" cy="62" rx="30" ry="11"/>
<ellipse class="p-metal2" cx="50" cy="58" rx="14" ry="5"/>
<ellipse class="p-dark" cx="50" cy="45" rx="27" ry="10"/>
<ellipse class="p-metal2" cx="50" cy="42" rx="12" ry="4"/></g>`

const plant = `
<g><path class="p-leaf" d="M50 56 C30 50 22 30 30 18 C44 20 52 38 50 56Z"/>
<path class="p-leaf2" d="M50 56 C70 48 78 28 70 16 C56 20 48 38 50 56Z"/>
<path class="p-leaf" d="M50 58 C50 42 56 30 62 26 C64 40 58 52 50 58Z"/>
<path class="p-wood" d="M30 58 h40 l-6 34 h-28 Z"/>
<rect class="p-wood2" x="28" y="54" width="44" height="9" rx="3"/></g>`

const spare = `
<g><rect class="p-shell" x="24" y="40" width="52" height="42" rx="14"/>
<rect class="p-dark" x="32" y="48" width="36" height="18" rx="9"/>
<circle class="p-off" cx="43" cy="57" r="4"/><circle class="p-off" cx="57" cy="57" r="4"/>
<path class="p-teal" d="M50 40 v-12" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round"/>
<circle class="p-teal" cx="50" cy="25" r="5"/>
<rect class="p-metal2" x="24" y="76" width="52" height="8" rx="4"/></g>`

const books = `
<g><rect class="p-accent" x="22" y="46" width="13" height="46" rx="2"/>
<rect class="p-teal" x="37" y="52" width="12" height="40" rx="2"/>
<rect class="p-wood" x="51" y="42" width="14" height="50" rx="2"/>
<rect class="p-glass" x="67" y="56" width="11" height="36" rx="2"/>
<rect class="p-metal2" x="20" y="88" width="62" height="6" rx="3"/></g>`

/** Funke's basket. It lives in the Sleep Bay and nowhere else. */
const catbed = `
<g><ellipse class="p-wood" cx="50" cy="74" rx="34" ry="18"/>
<ellipse class="p-teal" cx="50" cy="72" rx="25" ry="12"/>
<path class="p-wood2" d="M16 74 a34 18 0 0 0 68 0 v6 a34 18 0 0 1-68 0Z"/>
<circle class="p-off" cx="41" cy="70" r="3"/><circle class="p-off" cx="59" cy="70" r="3"/></g>`

/** Where Robby sleeps it off. */
const charger = `
<g><rect class="p-metal2" x="18" y="80" width="64" height="12" rx="5"/>
<rect class="p-metal" x="26" y="34" width="48" height="48" rx="8"/>
<rect class="p-dark" x="34" y="42" width="32" height="24" rx="4"/>
<path class="p-bolt" d="M53 44 L41 60 h8 l-3 12 14-18 h-9 Z"/>
<rect class="p-teal" x="34" y="70" width="32" height="6" rx="3"/></g>`

const cable = `
<g><circle cx="50" cy="60" r="26" fill="none" class="p-cable" stroke="currentColor" stroke-width="9"/>
<circle cx="50" cy="60" r="14" fill="none" class="p-cable" stroke="currentColor" stroke-width="8"/>
<path class="p-cable" d="M74 48 q12 -10 6 -22" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
<rect class="p-metal2" x="72" y="16" width="14" height="12" rx="3"/></g>`

const bed = `
<g><rect class="p-wood2" x="10" y="52" width="80" height="34" rx="6"/>
<rect class="p-shell" x="14" y="44" width="30" height="20" rx="8"/>
<rect class="p-teal" x="40" y="56" width="48" height="24" rx="6"/>
<rect class="p-wood" x="10" y="82" width="8" height="12" rx="3"/>
<rect class="p-wood" x="82" y="82" width="8" height="12" rx="3"/></g>`

const boxes = `
<g><rect class="p-wood" x="14" y="56" width="40" height="36" rx="3"/>
<rect class="p-wood2" x="14" y="56" width="40" height="6"/>
<rect class="p-wood" x="52" y="44" width="34" height="48" rx="3"/>
<rect class="p-wood2" x="52" y="44" width="34" height="6"/>
<path class="p-wood2" d="M30 56 v36 M66 44 v48" stroke="currentColor" stroke-width="4" fill="none"/></g>`

const console_ = `
<g><rect class="p-metal2" x="12" y="70" width="76" height="22" rx="4"/>
<rect class="p-metal" x="18" y="30" width="64" height="42" rx="6"/>
<rect class="p-dark" x="24" y="36" width="52" height="24" rx="3"/>
<rect class="p-screen" x="28" y="40" width="20" height="5" rx="2"/>
<rect class="p-screen" x="28" y="49" width="30" height="5" rx="2"/>
<circle class="p-accent" cx="66" cy="65" r="4"/><circle class="p-teal" cx="76" cy="65" r="4"/></g>`

const PROP_SVG = {
  crate, drum, toolbox, shelf, tyres, plant, spare, books,
  catbed, charger, cable, bed, boxes, console: console_,
}
export type PropName = keyof typeof PROP_SVG

export interface Placed {
  prop: PropName
  x: number
  y: number
  flip?: boolean
}

/**
 * Every room's furniture, placed on purpose. Coordinates are wall cells, so
 * nothing ever sits on the path. Two or three per room: enough to say where
 * you are, few enough that a child can take it in at a glance.
 */
export const ROOM_SET: Record<string, Placed[]> = {
  // He wakes up on the charger, so it stands right over the start tile.
  'lab-1': [
    { prop: 'charger', x: 1, y: 0 },
    { prop: 'cable', x: 3, y: 2 },
    { prop: 'plant', x: 7, y: 1 },
  ],
  // A hallway: things you pass, nothing you stop for.
  'lab-2': [
    { prop: 'plant', x: 1, y: 2 },
    { prop: 'books', x: 3, y: 0 },
    { prop: 'cable', x: 6, y: 2, flip: true },
  ],
  // Where he builds. The spare head watches from the bench.
  'lab-3': [
    { prop: 'toolbox', x: 2, y: 0 },
    { prop: 'shelf', x: 5, y: 1 },
    { prop: 'spare', x: 2, y: 3, flip: true },
  ],
  // Stacked high on both sides — which is why there is only one way through.
  'lab-4': [
    { prop: 'shelf', x: 2, y: 0 },
    { prop: 'crate', x: 2, y: 2 },
    { prop: 'shelf', x: 6, y: 2, flip: true },
  ],
  // His berth, and Funke's basket at the foot of it.
  'lab-5': [
    { prop: 'bed', x: 2, y: 2 },
    { prop: 'catbed', x: 6, y: 2, flip: true },
    { prop: 'plant', x: 7, y: 1 },
  ],
  'lab-6': [
    { prop: 'tyres', x: 1, y: 2 },
    { prop: 'drum', x: 5, y: 0 },
    { prop: 'toolbox', x: 1, y: 3, flip: true },
  ],
  // The attic, full of the robots he used to be.
  'lab-7': [
    { prop: 'boxes', x: 1, y: 2 },
    { prop: 'spare', x: 7, y: 2 },
    { prop: 'crate', x: 2, y: 5, flip: true },
    { prop: 'boxes', x: 7, y: 4 },
  ],
  // Fuel by the pad, and the desk he launches from.
  'lab-8': [
    { prop: 'console', x: 2, y: 2 },
    { prop: 'drum', x: 7, y: 4 },
    { prop: 'cable', x: 1, y: 3, flip: true },
  ],
}

/** Stable per-tile hash, so a generated room is furnished the same every visit. */
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Generated rooms have nobody to place their furniture by hand, so it is
 * scattered from the seed instead — sparsely, and only against walls that touch
 * the corridor. Authored rooms keep their authored props: the Sleep Bay's berth
 * means something, and a hash would never put it there.
 */
export function scatterProps(
  levelId: string,
  isWall: (x: number, y: number) => boolean,
  w: number,
  h: number,
): Placed[] {
  const palette: PropName[] = ['crate', 'boxes', 'shelf', 'toolbox', 'plant', 'books', 'drum']
  const out: Placed[] = []
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!isWall(x, y)) continue
      const beside = neighbours({ x, y }).some((n) => !isWall(n.x, n.y))
      if (!beside) continue
      const n = hash(`${levelId}:${x}:${y}`)
      if (n % 100 < 68) continue
      out.push({ prop: palette[n % palette.length], x, y, flip: (n >> 8) % 2 === 1 })
    }
  return out
}

export function propsFor(
  levelId: string,
  fallback: Placed[] = [],
): (Placed & { svg: string; key: string })[] {
  return (ROOM_SET[levelId] ?? fallback).map((p, i) => ({
    ...p,
    key: `${p.prop}${i}`,
    svg: `<svg class="prop" viewBox="0 0 100 100" aria-hidden="true"${
      p.flip ? ' style="transform:scaleX(-1);transform-origin:50px 50px"' : ''
    }>${PROP_SVG[p.prop]}</svg>`,
  }))
}
