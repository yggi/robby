import { describe, expect, it } from 'vitest'
import { DUR, walkMs } from './game.svelte'
import { FrameEvent } from '../engine/types'

/**
 * `DUR` is how long a frame is *held*; `walkMs` is how long the robot takes to
 * cross the tile. They were one number, so a frame held for something to be
 * watched spent that time on the movement instead — he crawled into the battery
 * over 1150ms with a long easing tail and never stood still on it, then snapped
 * into the next move. In the Lab finale the next move doubles back the way he
 * came, which is what made it read as a lurch backwards.
 */
describe('the walk and the hold are different clocks', () => {
  it('never walks slower than a walk, whatever the frame is held for', () => {
    const events = Object.keys(DUR) as FrameEvent[]
    expect(events.length).toBe(10)
    for (const e of events) expect(walkMs(e)).toBeLessThanOrEqual(380)
  })

  it('so a held frame is time spent standing still, not creeping', () => {
    // the three that are held for something to be watched
    for (const e of ['pickup', 'denied', 'gate'] as const) {
      expect(DUR[e]).toBeGreaterThan(walkMs(e))
      expect(walkMs(e)).toBe(380)
    }
    expect(DUR.pickup - walkMs('pickup')).toBeGreaterThan(700) // a beat worth watching
  })

  it('and a belt still whisks him along faster than he walks', () => {
    expect(walkMs('carry')).toBe(210)
    expect(walkMs('carry')).toBeLessThan(walkMs('step'))
  })

  it('an ordinary step is held exactly as long as it takes', () => {
    expect(walkMs('step')).toBe(DUR.step)
  })
})
