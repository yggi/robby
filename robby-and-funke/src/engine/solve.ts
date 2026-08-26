import { simulate } from './simulate'
import { DIRS, type Dir, type Level, type State, type Trace } from './types'

function key(s: State): string {
  const cells = s.world.cells
    .map((c) => (c.kind === 'gate' ? (c.open ? '1' : '0') : c.kind === 'fragile' ? (c.collapsed ? '1' : '0') : ''))
    .join('')
  return `${s.pos.x},${s.pos.y},${s.dir},${s.items.map((i) => i.id).join('|')},${cells}`
}

function tail(t: Trace): State | null {
  const f = t.frames[t.frames.length - 1]
  return f ? f.state : null
}

/** Does this program stay inside the level's token tray? */
export function withinTray(level: Level, program: Dir[]): boolean {
  const used: Record<string, number> = {}
  for (const d of program) used[d] = (used[d] ?? 0) + 1
  return Object.entries(used).every(([d, n]) => (level.tray[d as Dir] ?? 0) >= n)
}

/**
 * Shortest winning program, or null. Breadth-first over instruction sequences,
 * deduped on the resulting world state so irreversible levels stay tractable.
 */
export function solve(level: Level, maxLen = 20): Dir[] | null {
  const seen = new Set<string>()
  let layer: Dir[][] = [[]]

  const base = simulate(level, [])
  if (base.outcome === 'win') return []
  const bs = tail(base)
  if (bs) seen.add(key(bs))

  for (let len = 0; len < maxLen; len++) {
    const next: Dir[][] = []
    for (const prefix of layer) {
      for (const d of DIRS) {
        const program = [...prefix, d]
        if (!withinTray(level, program)) continue
        const t = simulate(level, program)
        if (t.outcome === 'win') return program
        if (t.outcome !== 'shrug') continue // bonked or stranded: dead branch
        const s = tail(t)
        if (!s) continue
        const k = key(s)
        if (seen.has(k)) continue
        seen.add(k)
        next.push(program)
      }
    }
    if (!next.length) return null
    layer = next
  }
  return null
}
