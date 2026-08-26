/**
 * Shared harness for the smoke suites: boots the real built artefact in jsdom
 * and hands back the helpers. Two suites import it —
 *
 *   smoke.fast.mjs  everything provable without playing a level through, which
 *                   is what `npm test` runs on every change
 *   smoke.full.mjs  the behavioural suite: full runs, celebrations, world
 *                   transitions. Minutes, not seconds, so it is opt-in.
 */
import { JSDOM, VirtualConsole } from 'jsdom'
import { readFileSync } from 'node:fs'

// jsdom does not execute module scripts. The bundle is an IIFE, so we downgrade
// the tag to a classic script and move it after #app (a module script is
// deferred; a classic one is not). Same bytes of application code either way.
// SMOKE_BUILD lets a probe point the harness at a development build, whose
// Svelte runtime still carries the dev-only warnings a production build strips.
const raw = readFileSync(process.env.SMOKE_BUILD ?? 'dist/index.html', 'utf8')
const tag = raw.match(/<script type="module" crossorigin>[\s\S]*?<\/script>/)[0]
// Replacer *functions*, not strings: the minified bundle contains `$` sequences
// that String.replace would otherwise treat as capture-group references and
// silently corrupt.
const classic = tag.replace('type="module" crossorigin', '')
const html = raw
  .replace(tag, () => '')
  .replace('</body>', () => classic + '</body>')

/**
 * jsdom has no Web Animations. Without it Svelte's out-transitions never
 * finish, so outgoing screens are never unmounted and every selector picks up
 * a stale copy. This shim runs the *timing* only — no visual work — which is
 * enough to make transitions complete, and has the side benefit of putting the
 * flying arrows and bits on their real code path instead of the fallback.
 */
function installWaapi(window) {
  if (window.Element.prototype.animate) return
  const P = window.Element.prototype
  P.getAnimations = function () {
    return this.__anims ?? []
  }
  P.animate = function (_frames, opts) {
    const ms = typeof opts === 'number' ? opts : (opts?.duration ?? 0) + (opts?.delay ?? 0)
    const el = this
    const anim = {
      onfinish: null,
      playState: 'running',
      currentTime: 0,
      startTime: 0,
      playbackRate: 1,
      finished: Promise.resolve(),
      effect: { getTiming: () => ({ duration: ms }), getComputedTiming: () => ({ duration: ms }) },
      cancel() {
        this.playState = 'idle'
        drop()
      },
      finish() {
        this.playState = 'finished'
        drop()
      },
      pause() {},
      play() {},
      commitStyles() {},
      addEventListener() {},
      removeEventListener() {},
    }
    const drop = () => {
      el.__anims = (el.__anims ?? []).filter((a) => a !== anim)
    }
    ;(el.__anims ??= []).push(anim)
    setTimeout(() => {
      anim.playState = 'finished'
      anim.currentTime = ms
      drop()
      anim.onfinish?.call(anim)
    }, ms)
    return anim
  }
}

/**
 * Anything the app throws and does not catch. jsdom swallows these into its
 * own console by default, so a suite could pass while the real thing was
 * throwing on every frame — which is exactly what happened on the arrival card.
 */
const errors = []
const consoleOut = new VirtualConsole()
// jsdom 27 renamed sendTo -> forwardTo
consoleOut.forwardTo(console, { omitJSDOMErrors: true })
consoleOut.on('jsdomError', (e) => errors.push((e.detail?.message ?? e.message).slice(0, 160)))

const dom = new JSDOM(html, {
  runScripts: 'dangerously',
  pretendToBeVisual: true,
  beforeParse: installWaapi,
  virtualConsole: consoleOut,
})
const { window } = dom
const $ = (s) => window.document.querySelector(s)
const $$ = (s) => [...window.document.querySelectorAll(s)]
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const tok = (d) => $$('.token').find((t) => t.getAttribute('aria-label') === d)
const fail = []
let passed = 0
const check = (name, cond) => {
  lastStep = name
  cond ? passed++ : fail.push(name)
  console.log((cond ? 'ok  ' : 'FAIL') + '  ' + name)
}

/**
 * Poll for a condition instead of guessing how long an animation takes. Fixed
 * waits are the single biggest source of flakiness in this suite: they land
 * either side of the moment on a slow machine.
 */
async function until(what, fn, ms = 8000, step = 100) {
  lastStep = `waiting for ${what}`
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    if (fn()) return true
    await wait(step)
  }
  return false
}
/**
 * In-process watchdog. The runner kills a wedged attempt from outside, but this
 * fires first and says *where* it stopped, which the external kill cannot.
 */
let lastStep = 'startup'
const watchdog = setTimeout(() => {
  console.error(`\n[smoke] wedged after: ${lastStep}`)
  process.exit(3)
}, Number(process.env.SMOKE_INNER_MS ?? 280_000))
watchdog.unref?.()

/** Print the tally and exit. Called by whichever suite imported the harness. */
export function report(label) {
  clearTimeout(watchdog)
  console.log(
    fail.length
      ? `\n${label} FAILURES: ` + fail.join(', ')
      : `\nALL ${label} CHECKS PASSED (${passed} checks)`,
  )
  process.exit(fail.length ? 1 : 0)
}

export { raw, window, $, $$, wait, until, check, tok, D, NAV, dom, errors }


const D = { step: 380, pickup: 760, win: 2600, bonk: 980, ret: 820, dash: 760 }
// Screens cross-fade, so two of them exist at once mid-transition and a bare
// querySelector would pick up the one on its way out. Always let it settle.
const NAV = 700

await wait(NAV)
