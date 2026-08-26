/**
 * The docs are a structure, so the structure is checked.
 *
 * `doc/design/` is four clusters, indexed by `doc/MEMORY.md` one level up. That
 * shape only helps while it is true: an index that has drifted from the tree is
 * worse than no index, because it is read as authoritative and quietly sends
 * you to a page that moved.
 *
 * Nothing here judges prose. It checks the three things that rot silently — a
 * link that no longer resolves, a page in no cluster, and a content page
 * creeping into the index — because all three are invisible to a reader who is
 * *already* lost and looking for the page they were promised.
 *
 * Every assertion over a scraped sample is preceded by one asserting the sample
 * is not empty. That rule was bought with the `(0 checked)` incident; see
 * `doc/META.md`.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = new URL('..', import.meta.url).pathname
const DESIGN = join(ROOT, 'doc/design')

const CLUSTERS = ['game', 'feel', 'code', 'testing']

/**
 * `doc/LOG.md` is exempt from path resolution. It is append-only, and it
 * records paths that were correct when they were written; rewriting them to
 * keep a checker happy would be editing the record to match the present.
 *
 * `doc/HISTORY.md` is deliberately *not* exempt. It is rewritten rather than
 * appended to, so its links describe the tree as it is now and have to resolve
 * like anything else's.
 */
const APPEND_ONLY = (rel: string) => rel === 'doc/LOG.md'

/**
 * Every markdown file that is part of the contract.
 *
 * Nested checkouts are skipped — a git worktree parked inside the repo is
 * somebody else's tree, and its stale links are not this tree's problem. That
 * is not hypothetical: a worktree left in the root failed this check with four
 * broken paths that had all been correct where they were written.
 */
function markdownUnder(dir: string): string[] {
  let found: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) continue
    const path = join(dir, entry)
    if (!statSync(path).isDirectory()) {
      if (entry.endsWith('.md')) found.push(path)
    } else if (!existsSync(join(path, '.git'))) {
      found = found.concat(markdownUnder(path))
    }
  }
  return found
}

/**
 * A path-shaped mention, from a link or from backticked prose.
 *
 * Both forms are checked because both are used and both are followed. A reader
 * does not care whether the author reached for a link or for
 * `doc/design/code/stack.md`; they care that the file is there. Backticked
 * mentions are only counted when they carry a directory, so that a bare
 * `MEMORY.md` in a page three levels down is not read as a relative path.
 */
function mentionedPaths(source: string): string[] {
  const found = new Set<string>()
  for (const m of source.matchAll(/\]\((\.{0,2}[\w./-]+\.md)(?:#[\w-]*)?\)/g)) {
    found.add(m[1] as string)
  }
  for (const m of source.matchAll(/`((?:doc\/|\.{1,2}\/)[\w./-]+\.md)`/g)) {
    found.add(m[1] as string)
  }
  return [...found]
}

describe('the design docs are four clusters, and the map matches the ground', () => {
  it('every page lives in exactly one cluster', () => {
    const entries = readdirSync(DESIGN)
    expect(entries.length, 'doc/design is empty').toBeGreaterThan(0)

    const stray = entries.filter(
      (e) =>
        statSync(join(DESIGN, e)).isFile() &&
        e.endsWith('.md') &&
        !CLUSTERS.includes(e.replace(/\.md$/, '')),
    )
    expect(stray, 'a content page belongs in a cluster directory').toEqual([])
  })

  it.each(CLUSTERS)('the %s cluster page indexes every page in its tree', (cluster) => {
    const page = readFileSync(join(DESIGN, `${cluster}.md`), 'utf8')
    const pages = readdirSync(join(DESIGN, cluster)).filter((f) => f.endsWith('.md'))

    // A cluster with nothing in it would pass the loop below without checking
    // anything at all, in a line that says ok.
    expect(pages.length, `the ${cluster} cluster has no pages`).toBeGreaterThan(0)

    for (const file of pages) {
      expect(page, `${cluster}.md does not mention ${file}`).toContain(`${cluster}/${file}`)
    }
  })

  it('MEMORY.md indexes the clusters and nothing below them', () => {
    const memory = readFileSync(join(ROOT, 'doc/MEMORY.md'), 'utf8')
    const cut = memory.indexOf('\n---\n')
    expect(cut, 'doc/MEMORY.md has no index section').toBeGreaterThan(0)
    const index = memory.slice(0, cut)

    for (const cluster of CLUSTERS) {
      expect(index, `the index has lost ${cluster}`).toContain(`doc/design/${cluster}.md`)
    }

    // The point of the cluster layer: the index names four things, not twenty.
    // A content page creeping back in is the star topology growing again.
    const deep = [...index.matchAll(/doc\/design\/(\w+)\/([\w-]+\.md)/g)]
    expect(
      deep.map((m) => `${m[1]}/${m[2]}`),
      'index cluster pages, not content pages',
    ).toEqual([])
  })
})

describe('every markdown path that is written down resolves', () => {
  it('no link or backticked path points at a file that is not there', () => {
    const files = markdownUnder(ROOT).filter((f) => !APPEND_ONLY(relative(ROOT, f)))
    expect(files.length, 'no markdown was found to check').toBeGreaterThan(0)

    const broken: string[] = []
    let checked = 0
    for (const file of files) {
      for (const path of mentionedPaths(readFileSync(file, 'utf8'))) {
        checked++
        const target = path.startsWith('doc/')
          ? join(ROOT, path)
          : resolve(dirname(file), path)
        try {
          statSync(normalize(target))
        } catch {
          broken.push(`${relative(ROOT, file)} → ${path}`)
        }
      }
    }

    // The docs cross-link heavily on purpose; a run that found nothing to
    // resolve means the scrape stopped working, not that the docs got tidier.
    expect(checked, 'no paths were scraped at all').toBeGreaterThan(20)
    expect(broken).toEqual([])
  })
})
