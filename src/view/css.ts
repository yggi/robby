import { CELL_KINDS, ITEM_KINDS, type CellKind, type ItemKind } from '../engine/types'

/**
 * The one road from a name the engine owns to a class name in the DOM.
 *
 * **Name collisions are this codebase's recurring failure mode** — six of them
 * before this file existed, and they all had the same shape: a board kind
 * becomes an element class, so `<div class="item cog">` means a bare `.cog {}`
 * written anywhere in eight stylesheets lands on the board whether it was meant
 * to or not. A loading spinner called `.cog` turned the cog *part* into a 22px
 * spinning disc; `.exit` matched the floor tile under the rocket rather than the
 * rocket; `.tray`, `.grid`, `.screen.play` and `@keyframes roll` each cost an
 * afternoon. The full list is `doc/design/code/conventions.md`.
 *
 * Two guards were added and both caught real regressions, but a guard fires
 * *after* the mistake. This is the fix: kinds and marks reach the DOM only
 * through these functions, so they arrive namespaced, and a hand-written
 * component class can no longer collide with one by construction. The guards
 * stay on as a net.
 *
 * → `doc/META.md` § Design, "End a category; do not police it"
 */

/** A cell or item kind, as it appears on the board: `belt` → `k-belt`. */
export const kindCls = (kind: CellKind | ItemKind) => `k-${kind}`

/**
 * The minimap's marks: `w`all, `p`ath, `s`tart, `r`ocket, `b` for something to
 * pick up, `m` for machinery. Single letters, which is as collision-prone as a
 * name gets — `.b {}` is a plausible thing for anybody to write.
 */
export const MARKS = ['w', 'p', 's', 'r', 'b', 'm'] as const

export type Mark = (typeof MARKS)[number]

/** A minimap mark, as it appears in the DOM: `w` → `m-w`. */
export const markCls = (mark: Mark) => `m-${mark}`

/**
 * Every class name the two functions above can produce. Read by the guard that
 * checks no stylesheet rule names a prefixed class which has stopped existing.
 */
export const PREFIXED_CLASSES = [
  ...CELL_KINDS.map(kindCls),
  ...ITEM_KINDS.map(kindCls),
  ...MARKS.map(markCls),
]
