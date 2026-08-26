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

/**
 * Every element placed at a board coordinate must be matched by a selector that
 * sizes it to one tile. jsdom has no layout engine, so nothing here can measure
 * a box; this checks the rule instead. The giant rocket was exactly this — a
 * board element missing from the sizing rule, so it sized against the whole
 * board.
 *
 * Sampled all through the run rather than read once at the end, because the
 * board only exists while a level is open, and a single read is really a
 * question about whichever screen the suite happened to stop on. The fast suite
 * stopped on the editor, so its copy of this check looked at *nothing* — and
 * announced it, in a cheerfully passing line reading `(0 checked)`, until
 * somebody read the number. Hence two things: `sweepBoard()` on every
 * navigation, and a final assertion that a sample of nothing is not a pass.
 */
const boardSeen = new Map()

/** Record whatever is on the board right now. Safe to call with no board up. */
export function sweepBoard() {
  for (const el of $$('.board [style*="--x"]')) boardSeen.set(el.className, el)
  return boardSeen.size
}

/** Assert over everything `sweepBoard()` has seen. Call once, at the end. */
export function checkBoardSizing() {
  sweepBoard() // whatever is up right now counts too
  const sized = new Set()
  for (const m of raw.matchAll(/([^{}@]+)\{[^{}]*width:\s*var\(--c\)/g))
    for (const sel of m[1].split(',')) {
      const c = sel.trim().match(/^\.([\w-]+)/)
      if (c) sized.add(c[1])
    }
  const placed = [...boardSeen.values()]
  const unsized = placed.filter((el) => ![...el.classList].some((c) => sized.has(c)))
  check(`board elements were sampled at all (${placed.length} kinds)`, placed.length > 0)
  check(`every board element is sized to one tile (${placed.length} checked)`, unsized.length === 0)
  if (unsized.length) console.log('     unsized:', unsized.map((e) => e.className).join(', '))
}

/**
 * ---- the namespace guards ----
 *
 * Name collisions are this codebase's recurring failure mode, seven of them,
 * and the two guards in `smoke.fast.mjs` both fire *after* the mistake. The fix
 * is `src/view/css.ts`: a cell kind, an item kind or a minimap mark reaches the
 * DOM only through `kindCls`/`markCls`, so it arrives as `k-belt` or `m-w` and
 * a hand-written `.belt {}` can no longer land on it.
 *
 * That only holds while everything generated actually goes through them, which
 * is what these check — sampled all through the run, like the sizing guard
 * above and for the same reason.
 */
/**
 * The names these guards check against, read out of the files that own them.
 *
 * Not transcribed. `smoke.fast.mjs` re-types the board-kind list by hand and
 * `oneway` was missing from it for the feature's whole life, which made a bare
 * `.oneway {}` the one collision nothing could catch. A `.mjs` suite cannot
 * import TypeScript, but it can read it, and a regex over a `const` array is
 * enough to make adding a kind to the engine unable to leave the guard behind.
 */
function namesIn(file, constName) {
  const src = readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const list = src.match(new RegExp(`${constName}\\s*=\\s*\\[([\\s\\S]*?)\\]`))
  if (!list) throw new Error(`${constName} not found in ${file} — the guard is reading nothing`)
  return [...list[1].matchAll(/'([\w-]+)'/g)].map((m) => m[1])
}

export const CELL_KINDS = namesIn('src/engine/types.ts', 'CELL_KINDS')
export const ITEM_KINDS = namesIn('src/engine/types.ts', 'ITEM_KINDS')
export const MARKS = namesIn('src/view/css.ts', 'MARKS')
export const FX_CLASSES = namesIn('src/view/particles.ts', 'FX_CLASSES')

const generatedSeen = new Map()

/** Record every element whose class comes from data. Safe with nothing up. */
export function sweepGenerated() {
  const sel = '.board .tile, .board .item, .egrid .tile, .egrid .item, .mini i, .paint, .swatch'
  for (const el of $$(sel)) generatedSeen.set(el.className, el)
  return generatedSeen.size
}

/**
 * Nothing generated reaches the DOM unprefixed, and no prefixed class is one
 * the engine does not own.
 *
 * `kinds` and `marks` are the real lists, passed in from the suite because a
 * `.mjs` file cannot import TypeScript. Transcribing them here is what left
 * `oneway` out of the bare-kind guard for its whole life, so the suite gets
 * them from the built bundle instead.
 */
export function checkNamespacing(kinds, marks) {
  sweepGenerated()
  // The invariant, stated exactly: no element wears a name the engine owns.
  // Not "every class is prefixed" — a swatch is legitimately `swatch batt`,
  // and `batt` is nobody's kind. What must never appear is a *bare* `blocked`,
  // `cog` or `w`, because those are the names a stylesheet elsewhere might
  // reasonably use for something else.
  const owned = new Set([...kinds, ...marks])
  const seen = [...generatedSeen.values()]
  const stray = seen.filter((el) => [...el.classList].some((c) => owned.has(c)))

  check(`generated classes were sampled at all (${seen.length} kinds)`, seen.length > 0)
  check(`no element wears a bare engine name (${seen.length} checked)`, stray.length === 0)
  if (stray.length) console.log('     unprefixed:', stray.map((e) => e.className).join(' | '))
}

/**
 * Every namespaced class in the stylesheet names something that still exists,
 * and — the half that matters more — every class the code writes has somewhere
 * to land.
 *
 * The second direction found `.spark`: the pickup burst spawned eight of them
 * with a colour, a direction and a delay, and **no `.spark` rule had ever been
 * written**, in any commit. They were unstyled inline spans of no size, born
 * and removed 900ms later, on every pickup the game has ever played.
 */
export function checkPrefixedRules(declared) {
  const ruled = new Set()
  for (const m of raw.matchAll(/\.((?:k|m|fx)-[\w-]+)/g)) ruled.add(m[1])
  const owned = new Set(declared)
  // `fx` itself is the namespace root and carries no dash
  owned.add('fx')

  const stale = [...ruled].filter((c) => !owned.has(c))
  // a class the code writes that no rule anywhere mentions
  const homeless = [...owned].filter((c) => c !== 'fx' && !ruled.has(c) && raw.includes(`"${c}`))

  check(`namespaced rules were found at all (${ruled.size} classes)`, ruled.size > 10)
  check(`no rule names a class nothing writes (${ruled.size} checked)`, stale.length === 0)
  if (stale.length) console.log('     no such class:', stale.join(', '))
  check(`nothing is spawned with nowhere to land (${owned.size} checked)`, homeless.length === 0)
  if (homeless.length) console.log('     no rule for:', homeless.join(', '))
}

/**
 * Collision seven, as a rule rather than as a patch.
 *
 * `.confetti` and `.star` were both single-class selectors declaring
 * `animation`, at identical specificity, and `.star` — the sky decor, five
 * hundred lines further down `world.css` — came later. So the third of the
 * confetti given `class="confetti star"` ran `twinkle … infinite` in place
 * instead of `fall`, in the shipped build. Neither existing guard could see it:
 * the keyframe names differ, and `star` is not a board kind.
 *
 * The general form is what is checked: no element may carry two classes that
 * each have a bare single-class rule declaring an animation, because which one
 * wins is then decided by source order rather than by anybody's intent.
 */
export function checkOneAnimationEach() {
  sweepGenerated()
  sweepBoard()
  const animated = new Set()
  for (const m of raw.matchAll(/(^|[,{}])((?:\.[\w-]+)+)\{([^{}]*)\}/g)) {
    if (!/(^|;)animation:/.test(m[3])) continue
    const classes = m[2].match(/\.[\w-]+/g) ?? []
    if (classes.length === 1) animated.add(classes[0].slice(1))
  }

  /*
   * Two samples, because neither alone is enough.
   *
   * The DOM half sees whatever is on screen — but particles are throwaway and
   * exist only mid-celebration, so the fast suite never has one up. The source
   * half reads the multi-class strings `particles.ts` writes, which is where
   * `'confetti star'` lived: a combination that only ever exists for 2.8
   * seconds after a win, and was wrong for months.
   */
  const onScreen = [...generatedSeen.values(), ...boardSeen.values(), ...$$('.fx *')]
    .map((el) => [...el.classList])
  const written = [...readFileSync('src/view/particles.ts', 'utf8')
    .matchAll(/'([\w-]+(?: [\w-]+)+)'/g)].map((m) => m[1].split(' '))

  const groups = [...onScreen, ...written]
  const doubled = groups.filter((cs) => cs.filter((c) => animated.has(c)).length > 1)
  check(`animating rules were found at all (${animated.size} bare rules)`, animated.size > 5)
  check(`class combinations were found at all (${written.length} written)`, written.length > 0)
  check(`no element is claimed by two animations (${groups.length} checked)`, doubled.length === 0)
  if (doubled.length) console.log('     claimed twice:', doubled.map((cs) => cs.join('.')).join(' | '))
}

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
