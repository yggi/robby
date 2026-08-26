import type { Dir } from '../engine/types'

/**
 * One colour per direction, used everywhere that direction appears: the tray
 * token, the filled slot, and the planning vector on the board. A pre-reader
 * can match a colour on the map to a colour under their thumb without ever
 * decoding the arrow.
 *
 * Left is red, which used to be the blamed-slot colour. The blame marker is now
 * a pulsing red ring around the slot rather than a red fill, so a wrong slot and
 * a left-arrow token can never be confused for one another.
 */
export const DIR_COLOR: Record<Dir, string> = {
  up: '#2f8dff',    // blue
  right: '#3fcf5f', // green
  down: '#ffd12e',  // yellow
  left: '#ff4646',  // red
}

/** Rotation of a planning vector, in CSS degrees. */
export const DIR_ANGLE: Record<Dir, number> = { right: 0, down: 90, left: 180, up: 270 }
