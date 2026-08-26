import type { Dir } from '../engine/types'

let ctx: AudioContext | null = null
const ac = () => (ctx ??= new AudioContext())

/**
 * A short burst of filtered noise — servo whirr, relay clack, that sort of
 * thing. Tone alone sounded like a music box; the noise is what makes it read
 * as a machine.
 */
function noise(dur = 0.1, from = 1800, to = 400, vol = 0.12) {
  try {
    const a = ac()
    if (a.state === 'suspended') a.resume()
    const n = Math.floor(a.sampleRate * dur)
    const buf = a.createBuffer(1, n, a.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
    const src = a.createBufferSource()
    src.buffer = buf
    const f = a.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 1.4
    f.frequency.setValueAtTime(from, a.currentTime)
    f.frequency.exponentialRampToValueAtTime(to, a.currentTime + dur)
    const g = a.createGain()
    g.gain.setValueAtTime(vol, a.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur)
    src.connect(f).connect(g).connect(a.destination)
    src.start()
  } catch {
    /* audio is a nicety; never let it break the game */
  }
}

function blip(freq: number, dur = 0.12, type: OscillatorType = 'square', slide = 0, vol = 0.2) {
  try {
    const a = ac()
    if (a.state === 'suspended') a.resume()
    const o = a.createOscillator()
    const g = a.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, a.currentTime)
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, a.currentTime + dur)
    g.gain.setValueAtTime(0.0001, a.currentTime)
    g.gain.exponentialRampToValueAtTime(vol, a.currentTime + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur)
    o.connect(g).connect(a.destination)
    o.start()
    o.stop(a.currentTime + dur + 0.03)
  } catch {
    /* audio is a nicety; never let it break the game */
  }
}

type Note = { at: number; hz: number; dur: number; type?: OscillatorType; vol?: number; slide?: number }

/** Fire a little tune. Everything longer than one blip is built from this. */
function seq(notes: Note[]) {
  for (const n of notes)
    setTimeout(() => blip(n.hz, n.dur, n.type ?? 'triangle', n.slide ?? 0, n.vol ?? 0.18), n.at)
}

// C5 E5 G5 C6 D6 E6 G6
const C5 = 523, E5 = 659, G5 = 784, A5 = 880, C6 = 1047, D6 = 1175, E6 = 1319, G6 = 1568

/** Each direction gets its own pitch — pre-readers navigate by ear. */
const PITCH: Record<Dir, number> = { up: 784, right: 659, down: 523, left: 587 }

export const sfx = {
  // Square waves throughout: Robby is a machine, and machines beep.
  token: (d: Dir) => {
    blip(PITCH[d], 0.07, 'square', 0, 0.16)
    blip(PITCH[d] * 2, 0.04, 'square', 0, 0.05)
  },
  remove: () => blip(300, 0.07, 'square', 0.7, 0.13),
  press: () => {
    blip(220, 0.09, 'square', 2.6, 0.18)
    noise(0.09, 2600, 700, 0.1)
  },
  // servo tick, not a musical note
  step: () => noise(0.045, 2800, 900, 0.07),
  /** the belt: rubber and rollers, not footsteps */
  carry: () => noise(0.13, 320, 190, 0.07),
  pickup: () => {
    ;[0, 70, 140].forEach((t, i) =>
      setTimeout(() => blip(523 * (1 + i * 0.26), 0.09, 'square', 0, 0.15), t),
    )
    setTimeout(() => noise(0.16, 900, 3200, 0.08), 150)
  },
  gate: () => {
    blip(170, 0.3, 'square', 2.4, 0.14)
    noise(0.3, 400, 2200, 0.09)
  },
  collapse: () => {
    blip(150, 0.36, 'sawtooth', 0.35, 0.16)
    noise(0.36, 1600, 200, 0.13)
  },
  bonk: () => {
    blip(104, 0.28, 'square', 0.62, 0.22)
    noise(0.14, 1200, 180, 0.16)
  },
  // the two-tone "does not compute"
  shrug: () => {
    blip(440, 0.12, 'square', 1, 0.15)
    setTimeout(() => blip(330, 0.22, 'square', 0.86, 0.15), 150)
  },
  stranded: () => {
    blip(330, 0.16, 'square', 1, 0.14)
    setTimeout(() => blip(247, 0.4, 'square', 0.72, 0.14), 190)
  },
  /**
   * Robby's jingle. A rising run, a little skip, then a fat major chord with a
   * bass note under it — the four ascending beeps it replaced sounded like a
   * lift arriving rather than like somebody being pleased.
   */
  win: () => {
    seq([
      // the run up, all square — chiptune, not music box
      { at: 0, hz: C5, dur: 0.08, type: 'square', vol: 0.16 },
      { at: 80, hz: E5, dur: 0.08, type: 'square', vol: 0.16 },
      { at: 160, hz: G5, dur: 0.08, type: 'square', vol: 0.16 },
      { at: 240, hz: C6, dur: 0.14, type: 'square', vol: 0.17 },
      // a burst of data chatter, because he is a computer being pleased
      { at: 400, hz: A5, dur: 0.05, type: 'square', vol: 0.11 },
      { at: 455, hz: D6, dur: 0.05, type: 'square', vol: 0.11 },
      { at: 510, hz: A5, dur: 0.05, type: 'square', vol: 0.11 },
      { at: 565, hz: E6, dur: 0.05, type: 'square', vol: 0.11 },
      // the chord it lands on, with a fat square bass under it
      { at: 660, hz: C6, dur: 0.62, type: 'square', vol: 0.13 },
      { at: 660, hz: E6, dur: 0.62, type: 'square', vol: 0.1 },
      { at: 660, hz: G6, dur: 0.56, type: 'square', vol: 0.07 },
      { at: 660, hz: 131, dur: 0.7, type: 'square', vol: 0.09 },
      { at: 980, hz: G6, dur: 0.2, type: 'square', vol: 0.06, slide: 1.06 },
    ])
    setTimeout(() => noise(0.22, 600, 4200, 0.09), 640) // the servo spin-up
  },

  /** The rocket. Low rumble under a long rising whistle. */
  launch: () =>
    seq([
      { at: 0, hz: 70, dur: 1.5, type: 'sawtooth', vol: 0.13, slide: 1.7 },
      { at: 120, hz: 220, dur: 1.3, type: 'triangle', vol: 0.09, slide: 4.2 },
      { at: 900, hz: 660, dur: 0.9, type: 'sine', vol: 0.07, slide: 2.6 },
    ]),

  /** The rocket refusing to launch: two flat buzzes and a servo shutting off. */
  denied: () => {
    blip(196, 0.13, 'square', 0.94, 0.17)
    setTimeout(() => blip(165, 0.2, 'square', 0.88, 0.17), 160)
    setTimeout(() => noise(0.18, 900, 260, 0.09), 170)
  },

  /** Menus get their own soft voice, distinct from the in-game tray. */
  /** the scamper out of the room */
  dash: () => {
    noise(0.22, 700, 3400, 0.09)
    blip(300, 0.16, 'square', 3.4, 0.07)
  },

  select: () => { blip(587, 0.08, 'square', 1.34, 0.14); noise(0.06, 3000, 1200, 0.06) },
  back: () => blip(392, 0.09, 'square', 0.76, 0.12),
}
