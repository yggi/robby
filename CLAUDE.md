# CLAUDE.md — agent entrypoint

`robby` — Robby & Funke, a programming puzzle game for children who cannot read
yet. One self-contained HTML file, no server, no network, no accounts.

This file is short on purpose. The project already documents itself well and
those documents are the real briefing; this one holds only what they cannot:
the working agreement, and the things that are true about *operating* this
repository rather than about the game.

## Read order

1. `README.md` — what it is, how to run it, what is in it.
2. `MEMORY.md` — **read this before changing code.** The facts that are
   expensive to rediscover, most of them learnt by breaking something.
3. `HANDOFF.md` — the architecture and the reasoning behind it. §11 is what
   happened when a child actually played it, which reorders the open threads
   in §8.

`LOG.md` is history — why something is the way it is. Read it when you need
that, not as context by default.

## Git

- **Push any branch freely.** Branch, commit, push, iterate.
- **`main` requires explicit instruction**, every time. A standing permission
  to push branches is not permission to push `main`.
- **Pushing a branch publishes it.** `.github/workflows/pages.yml` builds every
  `main` and `claude/**` push and puts it on the web: `main` at the site root,
  every other branch at `/b/<slug>/`. A branch's build is withdrawn when the
  branch is deleted. So a push is not a private act — it puts a playable build
  in front of anybody with the link, which is the point of it, and worth
  knowing before pushing something half-finished.

CI runs `npm run check:full`, so a branch that does not pass both suites does
not get published. Run it before pushing rather than finding out in the log.

## The two rules that outrank everything else

**Ask the solver.** `solve(level, maxDepth)` returns the shortest program that
wins a level, or `null`. Every par in the game is derived from it and re-derived
on every test run; the generator judges rooms with it; the editor runs it live.
If you are about to write something that decides whether a level is any good,
you are about to duplicate it badly. Ask it instead.

**It works on a plane.** No secrets, no accounts, no network calls, no
analytics, no external assets — the build is verified to contain zero non-`data:`
URLs. This is a children's game that runs from a phone with no signal. Keep it
that way.

## When you add a check

A check that can pass on an empty sample eventually will, and it will look like
coverage while providing none — see the `(0 checked)` incident in `MEMORY.md`.
If a check scrapes the DOM for its subjects, assert that it found some.
