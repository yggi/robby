import { describe, expect, it } from 'vitest'
import { afterCamera, CAMERA_MS, DUR, holdMs, walkMs } from './game.svelte'
import { type FrameEvent } from '../engine/types'

const EVENTS = Object.keys(DUR) as FrameEvent[]

/**
 * `DUR` is how long a frame is *held*; `walkMs` is how long the robot takes to
 * cross the tile. They were one number, and it cost two bugs at once.
 */
describe('the walk and the hold are different clocks', () => {
  it('checks every event there is', () => {
    expect(EVENTS.length).toBe(10)
  })

  /**
   * The one that matters. A CSS transition that ends at the very instant it is
   * retriggered is a race, and on a straight run — four tiles bought by one
   * instruction, no pause between them — it is re-run every frame. Whichever
   * side wins comes down to timer jitter; when the transition loses it restarts
   * from where it began, which is drawn a tile back and then snapped forward.
   */
  it('the walk always finishes before the frame does — never a race', () => {
    for (const e of EVENTS) {
      expect(walkMs(e), `${e} at rest`).toBeLessThan(holdMs(e))
      expect(walkMs(e, true), `${e} with reduced motion`).toBeLessThan(holdMs(e, true))
    }
  })

  it('and never walks slower than a walk, whatever the frame is held for', () => {
    for (const e of EVENTS) expect(walkMs(e)).toBeLessThanOrEqual(340)
  })

  it('so a held frame is time spent standing still, not creeping', () => {
    for (const e of ['pickup', 'denied', 'gate'] as const)
      expect(DUR[e] - walkMs(e)).toBeGreaterThan(100)
    expect(DUR.pickup - walkMs('pickup')).toBeGreaterThan(700) // a beat worth watching
  })

  it('a belt still whisks him along faster than he walks', () => {
    expect(walkMs('carry')).toBeLessThan(walkMs('step'))
  })

  /**
   * Reduced motion holds every frame for 240ms while the walk stayed at its full
   * length — so there the transition was not racing the retrigger, it was losing
   * to it every single time.
   */
  it('and reduced motion shortens the walk with the hold, not just the hold', () => {
    expect(walkMs('step', true)).toBeLessThan(walkMs('step'))
    expect(walkMs('step', true)).toBeLessThan(REDUCED)
  })
})
const REDUCED = 240

/**
 * The camera is a 900ms CSS transition on `.board`, and a scale animation is at
 * its most expensive as it *settles* — the browser re-rasterises the scaled
 * content. The rocket's cue was scheduled at 900ms exactly, so every win on a
 * rocket room built three oscillators on the very frame the push-in came to
 * rest. The same mistake as the walk that ended when its own frame was
 * retriggered, one layer up.
 */
describe('nothing expensive lands on the frame the camera settles', () => {
  it('leaves a real gap after the camera, not a rounding one', () => {
    expect(afterCamera()).toBeGreaterThan(CAMERA_MS + 200)
  })

  it('and never schedules anything inside the camera move', () => {
    for (const gap of [0, 60, 260, 400]) expect(afterCamera(gap)).toBeGreaterThanOrEqual(CAMERA_MS)
  })
})
