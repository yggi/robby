/**
 * Customisation parts. None of these touch the rules — they are entirely for
 * the pleasure of spending bits on them.
 *
 * Each part is a fragment of SVG in its own sprite's coordinate system, so it
 * drops straight into the slot it belongs to and inherits that slot's existing
 * animation: an antenna still sways, a tail still flicks.
 */

export type SlotId = 'antenna' | 'tail' | 'tip'
export type Kit = Record<SlotId, string>

export interface Part {
  id: string
  name: string
  /** in bits; 0 means it came with the robot */
  price: number
  art: string
}

export interface Slot {
  id: SlotId
  label: string
  owner: 'funke' | 'robby' | 'rocket'
  /** the window onto the sprite that shows this slot off in the parts bin */
  thumb: string
  parts: Part[]
}

/* ── Robby's antenna, in the 100x100 robot ───────────────────────────────── */

const antStalk = `
  <path d="M50 30 L50 13" stroke="#2b8e8a" stroke-width="5" stroke-linecap="round" fill="none"/>
  <circle class="bulb" cx="50" cy="9" r="6.5"/>`

const antDish = `
  <path d="M50 30 L50 18" stroke="#2b8e8a" stroke-width="5" stroke-linecap="round" fill="none"/>
  <path d="M34 14 a16 9 0 0 1 32 0 a16 9 0 0 1-32 0Z" fill="#cfd8e0" transform="rotate(-18 50 14)"/>
  <path d="M36 14 a14 7.5 0 0 0 28 0Z" fill="#8e9bab" transform="rotate(-18 50 14)"/>
  <circle class="bulb" cx="50" cy="12" r="3.6"/>`

const antProp = `
  <path d="M50 30 L50 14" stroke="#2b8e8a" stroke-width="5" stroke-linecap="round" fill="none"/>
  <g class="spinner">
    <ellipse cx="36" cy="11" rx="14" ry="4.5" fill="#d9503f"/>
    <ellipse cx="64" cy="11" rx="14" ry="4.5" fill="#e8724f"/>
  </g>
  <circle class="bulb" cx="50" cy="11" r="4.4"/>`

const antFlag = `
  <path d="M50 30 L50 6" stroke="#8e9bab" stroke-width="4" stroke-linecap="round" fill="none"/>
  <path d="M52 7 L74 13 L52 19 Z" fill="#ffc93c"/>
  <circle class="bulb" cx="50" cy="5" r="4"/>`

/* ── Funke's tail, in the 80x80 cat ──────────────────────────────────────── */

const tailCable = `
  <path d="M20 60 C4 58 3 38 15 33" stroke="#2b8e8a" stroke-width="7"
        fill="none" stroke-linecap="round"/>
  <circle cx="15" cy="33" r="4.5" class="tailtip"/>`

const tailBrush = `
  <path d="M22 60 C6 56 2 36 14 28" stroke="#2b8e8a" stroke-width="9"
        fill="none" stroke-linecap="round"/>
  <path d="M14 30 l-9 -7 M14 28 l1 -11 M15 30 l9 -6" stroke="#3fcf5f"
        stroke-width="5" stroke-linecap="round" fill="none"/>
  <circle cx="14" cy="27" r="5.5" class="tailtip"/>`

const tailSpring = `
  <path d="M21 60 q-9 -3 -6 -8 q3 -5 -5 -8 q-8 -3 -3 -9 q5 -6 -2 -9"
        stroke="#b0a294" stroke-width="6" fill="none" stroke-linecap="round"/>
  <circle cx="6" cy="27" r="5" class="tailtip"/>`

const tailRod = `
  <path d="M21 60 L6 26" stroke="#8e9bab" stroke-width="5"
        fill="none" stroke-linecap="round"/>
  <circle cx="6" cy="24" r="3.4" class="tailtip"/>
  <circle cx="12" cy="38" r="2.6" class="tailtip"/>`

/* ── the rocket's nose, in the 60x112 rocket ─────────────────────────────── */

const tipCap = `
  <path d="M30 3 C36 10 39 16 41 22 L19 22 C21 16 24 10 30 3 Z" fill="#d1503a"/>`

const tipSpike = `
  <path d="M30 -12 L36 22 L24 22 Z" fill="#cfd8e0"/>
  <path d="M30 -12 L36 22 L30 22 Z" fill="#9aa8b5"/>`

const tipBeacon = `
  <path d="M30 6 C35 12 38 17 40 22 L20 22 C22 17 25 12 30 6 Z" fill="#8e9bab"/>
  <circle cx="30" cy="3" r="7" fill="#ffc93c"/>
  <circle cx="30" cy="3" r="3" fill="#fff3d6"/>`

const tipStar = `
  <path d="M30 8 C35 13 38 17 40 22 L20 22 C22 17 25 13 30 8 Z" fill="#7a4fc0"/>
  <path d="M30 -10 L33.6 -1 L43 -1 L35.4 4.6 L38.4 14 L30 8.4 L21.6 14 L24.6 4.6
           L17 -1 L26.4 -1 Z" fill="#ffd12e"/>`

export const SLOTS: Slot[] = [
  {
    id: 'tail',
    label: 'Tail',
    owner: 'funke',
    thumb: '-2 18 36 50',
    parts: [
      { id: 'tail-cable', name: 'Cable', price: 0, art: tailCable },
      { id: 'tail-brush', name: 'Brush', price: 3, art: tailBrush },
      { id: 'tail-spring', name: 'Spring', price: 8, art: tailSpring },
      { id: 'tail-rod', name: 'Aerial', price: 14, art: tailRod },
    ],
  },
  {
    id: 'antenna',
    label: 'Antenna',
    owner: 'robby',
    thumb: '26 -6 48 46',
    parts: [
      { id: 'ant-stalk', name: 'Stalk', price: 0, art: antStalk },
      { id: 'ant-dish', name: 'Dish', price: 4, art: antDish },
      { id: 'ant-flag', name: 'Pennant', price: 10, art: antFlag },
      { id: 'ant-prop', name: 'Rotor', price: 16, art: antProp },
    ],
  },
  {
    id: 'tip',
    label: 'Nose',
    owner: 'rocket',
    thumb: '10 -16 40 48',
    parts: [
      { id: 'tip-cap', name: 'Cap', price: 0, art: tipCap },
      { id: 'tip-spike', name: 'Spike', price: 5, art: tipSpike },
      { id: 'tip-beacon', name: 'Beacon', price: 12, art: tipBeacon },
      { id: 'tip-star', name: 'Star', price: 20, art: tipStar },
    ],
  },
]

export const DEFAULT_KIT: Kit = { antenna: 'ant-stalk', tail: 'tail-cable', tip: 'tip-cap' }

export const slotOf = (id: SlotId) => SLOTS.find((s) => s.id === id)!

export function partFor(slot: SlotId, kit: Kit): Part {
  const s = slotOf(slot)
  return s.parts.find((p) => p.id === kit[slot]) ?? s.parts[0]
}

/** Every part that costs nothing is yours from the start. */
export const FREE_PARTS = SLOTS.flatMap((s) => s.parts.filter((p) => !p.price).map((p) => p.id))
