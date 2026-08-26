# LOG.md — worklog

Append-only. **Newest first.** What was actually done, and closed cards. Not
plans, not open questions.

**Target: 1000 lines, act at 1200** (`CLAUDE.md`). At 1200, **fold** the oldest
sessions into the paragraph of `doc/HISTORY.md` they belong to and delete them
here. Not moved intact: a verbatim archive is what git already is.

Entry format:

```
## YYYY-MM-DD — title
Cards: [id] ...
What happened, in past tense. Anything tried and rejected, and why.
```

---

## 2026-08-26 — `docs/` → `doc/`

Cards: none. A rename.

Every path-shaped reference followed, including this file's: a rename moves a
document's address without changing the document, so the usual reason not to
rewrite the record — that it would be editing the past to match the present —
does not apply. `src/docs.test.ts` became `src/doc.test.ts` with it, because a
repo half-committed to a token is the exact detail this was cleaning up.

**The two references the bulk rewrite could not reach were inside the checker
itself**, where the directory appears as `docs\/` in a regex and the escape hid
it from a `docs/` search. Had they been missed, the path check would have
matched nothing and passed — which is the `(0 checked)` shape again, and which
is why `expect(checked).toBeGreaterThan(20)` exists. It stayed at 160 scraped
paths across the rename, and the fault-planting was re-run against the new
regex to confirm it still fails.

Line-count targets stay **soft gates**: prose, not assertions. They are
judgement calls about when a surface wants condensing, and a build that fails at
361 lines would buy exactly the line-shaving the band exists to prevent.

## 2026-08-26 — the arc leaves the log, and the root empties

Cards: [R-000] extended and closed.

**`doc/LOG.md` was two documents.** It held a dated worklog on top of an eleven-part
narrative history written from the whole project, and the two have opposite
disciplines — one is appended to and never touched again, the other has to be
rewritten as it ages or it stops being readable. Split: `doc/HISTORY.md` is the
arc, oldest first, rewritten rather than appended to, targeted at 250 lines
*below* MEMORY's 300 so current truth always outranks how it was arrived at.

The mechanism is `laborsim`'s, which replaced three verbatim `doc/log/`
archives with it after they grew 1,577 lines in a month, condensed 2% of what
they held, duplicated four entries between themselves and were read by nothing.
This repo never built those archives, so it skipped straight to the thing that
replaced them: **when the log overflows, its oldest sessions fold into the
paragraph they belong to and are deleted.** Nothing is lost — it is all in git —
and what git cannot give you cheaply is the arc, because it hands you commits
rather than periods, and changes rather than changes of mind.

**`doc/handoff-2026-08.md` was deleted rather than kept as a record.** Last
session's argument for keeping it — §11 is the only playtest that exists — had
already been answered by the same session's work: the playtest is
`doc/design/game/playtest.md`, better placed and cross-linked. What was left
was 433 lines duplicating content that now has owners, carrying three facts
known to be wrong, in a repo that had just adopted the rule that an archive
duplicating git is not worth its drift. Recoverable at
`git show 2d8fec1:doc/handoff-2026-08.md`.

**The root is now `CLAUDE.md`, `README.md` and configuration.** Every other
surface moved to `doc/`. Two files stayed and the reason is mechanical rather
than aesthetic: `CLAUDE.md` is discovered at the repository root by the agent
that reads it, and `README.md` is what GitHub renders. Both are entrypoints for
readers who have not been told where to look; everything else is for readers who
have been.

References were rewritten to **full paths** in the process: a backticked
`doc/MEMORY.md` rather than a bare filename. That is not tidiness —
`src/doc.test.ts` only resolves a backticked path that carries a directory, so
every bare filename was unverifiable prose and is now a checked link. Counted
rather than estimated: **106 scraped paths before, 158 after.** The check earned
it back within the hour — it failed on a `README.md` link to the deleted
handover that had been missed by eye twice.

`CLAUDE.md` gained the **gates** section: the four conditions that decide
whether work is finished, stated as things to check rather than things to
remember. The write order already said what to update; nothing said what makes a
change complete.

`doc/META.md` gained one entry that this session actually earned — **a document
that needs two disciplines is two documents** — with both incidents, the
handover and the log, because the same shape turning up twice in one day is what
makes it a pattern rather than an anecdote.

Two small things found by doing the work rather than planning it. The path check
walked into a git worktree left in the repo root and reported four broken links
that were all correct where they were written; `markdownUnder` now skips any
directory containing a `.git`, because somebody else's tree is not this tree's
problem. And `doc/HISTORY.md` came out of its first draft at 275 lines —
already inside its own notice band on the day it was created — so it was
condensed to 251 before being committed. It sits one line over target, and
**that is where it stays**: acting at 251 is precisely the line-shaving the band
exists to prevent.

## 2026-08-26 — the surfaces

Cards: [R-000] opened. `doc/BOARD.md`, `doc/NOTES.md` and `doc/META.md`
created; `doc/design/` seeded; `HANDOFF.md` distributed.

`CLAUDE.md` was a briefing that pointed at three documents. It is now a contract:
a read order, a write order, and surfaces that each have a stated job, a target
size and a line at which they get condensed rather than shaved. Structure
follows `laborsim`, which has been running it long enough to have opinions about
the band.

**`HANDOFF.md` was the problem this solves.** 418 lines holding durable truth,
method lessons, open questions and work-to-do *at once* — four surfaces in a
trench coat, which is why none of it could be kept current: there was nowhere to
put an update that did not also mean re-reading the other three kinds of thing.

Rejected on the way: **leaving it at the root as a second entrypoint.** Two
documents claiming to be the briefing is the drift hazard the whole structure
exists to remove, and it would have started on the first session that updated
one of them.

**Three drifts were found while seeding**, all of the same kind — the tree moved
and the prose did not:

- **six stylesheets → eight.** `index.css` imports eight, and the comment at the
  top of that file is right where the docs were wrong.
- **four worlds → five chapters.** `chapters` is
  `[lab, forest, scrapyard, cheeseMoon, testWorld]` and the level select shows
  six tiles. Test World ships to players. `README.md` knew; `HANDOFF.md` and
  `doc/MEMORY.md` did not, and "all four worlds" reads differently once you know
  there is a fifth on the menu. Now a thread in `doc/NOTES.md`, because the
  question is not a fact to record but a decision nobody made.
- **`Board.svelte` ~500 → 584 lines**, and the view has **nine plain modules**
  the architecture description elided behind an ellipsis — about 1,200 lines, a
  third of the view. Now in the repo map, and the file is a card.

A fourth turned up while writing the rules page: **no shipped level anywhere
uses a one-way**, though `parse.ts` parses `^ v < >`, `simulate.ts` runs them
and `solve.ts` solves them. Test World's own comment claims "every trigger the
engine supports has a level here". Carded as [R-004], with the check that keeps
the claim true rather than a promise to remember.

`src/doc.test.ts` checks the parts of a documentation tree a test can check:
every markdown path written down resolves, every cluster page indexes its own
tree, and no content page has crept into the `doc/MEMORY.md` index. Each of the
three was verified by **planting the fault and watching it fail** — a broken
link, an unindexed page, a content page in the index — and each carries the
sample-size assertion `CLAUDE.md` requires, because the alternative is the
`(0 checked)` incident again with different subjects.
