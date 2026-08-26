/**
 * Every burst the board throws: the bonk puff, the pickup ring, the rocket's
 * exhaust, and the full win celebration.
 *
 * Particles are throwaway DOM rather than a reactive list — they are born,
 * they animate, they remove themselves, and nothing ever reads them back.
 * Each function takes the board element to hang them on, so nothing here
 * needs to know what a `Game` is.
 *
 * Every class name they wear is written here and nowhere else, and every one is
 * namespaced `fx-`. That is not decoration: `.confetti` and `.star` were both
 * single-class rules declaring `animation`, `.star` — the sky decor, five
 * hundred lines further down the same stylesheet — came later, and so a third
 * of the confetti twinkled in place instead of falling, in the shipped build,
 * for months. → `doc/design/code/conventions.md`
 */

/**
 * A particle host, positioned on a tile if given one and stretched over the
 * whole board if not. The board's own `--c` sizes it, exactly as it sizes a
 * tile — see `doc/MEMORY.md` § Sizing.
 */
function spawn(host: HTMLElement, cls: string, x?: number, y?: number) {
  const el = document.createElement('div')
  el.className = cls
  if (x !== undefined) {
    el.style.setProperty('--x', String(x))
    el.style.setProperty('--y', String(y))
  } else el.style.cssText = 'inset:0;width:100%;height:100%;translate:0 0;'
  host.appendChild(el)
  return el
}

/**
 * A ring where the thing was.
 *
 * It threw eight sparks as well — `<span class="spark">`, each given a colour,
 * a direction and a delay. **No rule for `.spark` has ever existed**, in any
 * commit, so they were unstyled inline spans of no size: born, laid out to
 * nothing, and removed 900ms later, on every pickup in the game's life. Found
 * by the guard below, which now asserts that every class this file writes has
 * somewhere to land. The burst is worth having and worth designing rather than
 * guessing at — `doc/BOARD.md` [R-029].
 */
export function pickup(host: HTMLElement, x: number, y: number) {
  const el = spawn(host, 'fx', x, y)
  const ring = document.createElement('span')
  ring.className = 'fx-pickring'
  el.appendChild(ring)
  setTimeout(() => el.remove(), 900)
}

/** The burn: a rolling cloud out from under it, and the pad shaking. */
export function exhaust(host: HTMLElement, x: number, y: number) {
  host.classList.add('liftoff')
  setTimeout(() => host.classList.remove('liftoff'), 1300)
  const el = spawn(host, 'fx', x, y)
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('span')
    p.className = 'fx-plume'
    const size = 14 + Math.random() * 26
    const a = Math.PI + (Math.random() - 0.5) * Math.PI * 1.5
    p.style.width = p.style.height = `${size}px`
    p.style.setProperty('--dx', Math.cos(a) * (30 + Math.random() * 70) + 'px')
    p.style.setProperty('--dy', Math.abs(Math.sin(a)) * (10 + Math.random() * 40) + 'px')
    p.style.setProperty('--t', 900 + Math.random() * 1100 + 'ms')
    p.style.animationDelay = 380 + Math.random() * 900 + 'ms'
    el.appendChild(p)
  }
  setTimeout(() => el.remove(), 3200)
}

/** A ring of dust where he hit the wall. */
export function puff(host: HTMLElement, x: number, y: number) {
  const el = spawn(host, 'fx', x, y)
  for (let i = 0; i < 7; i++) {
    const p = document.createElement('span')
    p.className = 'fx-dust'
    const a = (Math.PI * 2 * i) / 7 + Math.random()
    p.style.setProperty('--dx', Math.cos(a) * 34 + 'px')
    p.style.setProperty('--dy', Math.sin(a) * 34 - 6 + 'px')
    p.style.animationDelay = Math.random() * 60 + 'ms'
    el.appendChild(p)
  }
  setTimeout(() => el.remove(), 720)
}

/**
 * The full payoff: light, shockwaves, rays and confetti.
 *
 * The bits that fly to the counter are *not* here — that is the economy
 * paying out, and it belongs beside the thing that knows what a reward is.
 */
export function celebrate(host: HTMLElement, x: number, y: number) {
  const flash = spawn(host, 'fx fx-flash')
  setTimeout(() => flash.remove(), 800)

  const rings = spawn(host, 'fx', x, y)
  for (let i = 0; i < 3; i++) {
    const r = document.createElement('span')
    r.className = 'fx-shock'
    r.style.animationDelay = i * 190 + 'ms'
    rings.appendChild(r)
  }
  setTimeout(() => rings.remove(), 1700)

  const rays = spawn(host, 'fx fx-rays', x, y)
  setTimeout(() => rays.remove(), 2400)

  const cols = ['#ff7b45', '#ffd23f', '#4dc8ff', '#ff6bd6', '#7ef07a', '#f4e6c8']
  const el = spawn(host, 'fx')
  for (let i = 0; i < 38; i++) {
    const p = document.createElement('span')
    p.className = i % 3 === 0 ? 'fx-confetti fx-star' : 'fx-confetti'
    p.style.background = cols[i % cols.length]
    p.style.left = 6 + Math.random() * 88 + '%'
    p.style.top = '14%'
    p.style.setProperty('--dx', Math.random() * 240 - 120 + 'px')
    p.style.setProperty('--rot', Math.random() * 1080 - 540 + 'deg')
    p.style.setProperty('--t', 1200 + Math.random() * 1000 + 'ms')
    p.style.animationDelay = Math.random() * 320 + 'ms'
    el.appendChild(p)
  }
  setTimeout(() => el.remove(), 2800)
}

/**
 * Every class this module puts into the DOM, written here because here is where
 * the names are. A guard reads it in both directions: no stylesheet rule may
 * name a particle that has stopped existing, and no particle may be spawned
 * with nowhere to land. The second half is the one that found `.spark`.
 */
export const FX_CLASSES = [
  'fx', 'fx-pickring', 'fx-plume', 'fx-dust',
  'fx-flash', 'fx-shock', 'fx-rays', 'fx-confetti', 'fx-star',
] as const
