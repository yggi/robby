import { spawn } from 'node:child_process'

/**
 * Runs a smoke suite in a child process with a hard timeout and one retry.
 *
 * The suites drive a real build through jsdom on wall-clock timers, so they are
 * inherently timing-sensitive: a slow machine, a GC pause or one unlucky
 * random celebration can push a step past its window. Two guards:
 *
 *   1. A hard kill, so a wedged run fails loudly instead of hanging a CI job or
 *      a terminal forever.
 *   2. Exactly one retry, because a genuine regression fails twice while a
 *      timing wobble usually does not. Two retries would start hiding real
 *      flakiness, which is worth knowing about.
 */
// The suite runs the real build on wall-clock timers and takes roughly two
// minutes. The ceiling is deliberately well clear of that: a limit that only
// just fits turns a slow machine into a false failure, which is the opposite of
// what a timeout is for.
const SUITE = process.argv[2] ?? 'test/smoke.fast.mjs'
const FAST = SUITE.includes('fast')

// The ceiling is deliberately well clear of each suite's real runtime — about
// 10s for the fast one, about two minutes for the full one. A limit that only
// just fits turns a slow machine into a false failure, which is the opposite of
// what a timeout is for.
const LIMIT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? (FAST ? 60_000 : 300_000))

function attempt(n) {
  return new Promise((resolve) => {
    const started = Date.now()
    const child = spawn(process.execPath, [SUITE], { stdio: 'inherit' })

    // Killing the child fires 'exit' as well, so the outcome is latched: without
    // this a timeout reports itself twice, once as a timeout and once as a
    // SIGKILL failure.
    let settled = false
    const finish = (what, note) => {
      if (settled) return
      settled = true
      clearTimeout(kill)
      if (note) console.error(note)
      resolve(what)
    }

    const kill = setTimeout(() => {
      child.kill('SIGKILL')
      finish('timeout', `\n[smoke] attempt ${n} exceeded ${LIMIT_MS / 1000}s and was killed`)
    }, LIMIT_MS)

    child.on('exit', (code, signal) => {
      const secs = ((Date.now() - started) / 1000).toFixed(1)
      if (code === 0) return finish('ok')
      finish('fail', `\n[smoke] attempt ${n} failed after ${secs}s (code ${code}, signal ${signal})`)
    })
    child.on('error', (err) => finish('fail', `[smoke] could not start: ${err.message}`))
  })
}

let result = await attempt(1)
if (result !== 'ok') {
  console.error('[smoke] retrying once — a real regression will fail again\n')
  result = await attempt(2)
  if (result === 'ok') console.error('[smoke] passed on retry: treat this as flaky, not green')
}
process.exit(result === 'ok' ? 0 : 1)
