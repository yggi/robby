# Robby & Funke

A programming puzzle game for small children — roughly ages four to seven, the
ones who cannot read yet.

Robby is a robot who has run out of power. Funke is his cat. You do not drive
Robby; you give him a short list of arrows and press play, and then you watch
what your list actually does. That gap — between what you meant and what you
wrote — is the whole game, and it is the whole of programming.

The game runs entirely in one HTML file. No server, no network, no accounts.

```
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests, a build, and the ten-second smoke pass
npm run build        # → dist/index.html, a single self-contained file
```

Open `dist/index.html` from disk and it works. Everything is inlined: the
JavaScript, the CSS, the font, every sprite. It is around 250 KB.

## Scripts

| Command | What it does | Takes |
| --- | --- | --- |
| `npm test` | unit tests → build → fast smoke suite | ~15s |
| `npm run test:unit` | Vitest only | ~5s |
| `npm run test:full` | the behavioural smoke suite: plays levels through | ~2min |
| `npm run check:full` | everything, both suites | ~2.5min |
| `npm run dev` | Vite dev server | |
| `npm run build` | single-file production build | ~3s |

`npm test` is the one to run constantly. `test:full` is opt-in: it plays whole
levels in real time, watches celebrations and crosses between worlds, and a
two-minute check is one nobody runs. Run it before shipping, not on every save.

## What is in it

Four worlds of eight rooms each, plus a bench world with one room per mechanic,
plus rooms you build yourself.

- **The Lab** — Robby's home. One way through each room. Corners, then junctions.
- **The Mechanical Forest** — more than one way round, and some ways shut for good.
- **The Scrapyard** — conveyors, and trays with a direction missing. Not one par
  in that world spends a `left`.
- **The Cheese Moon** — bridges that only hold once, so the question becomes
  *in which order*.

Plus a workshop where bits buy parts for Robby, Funke and the rocket; an endless
practice room in the first two worlds; and a level editor that solves your room
as you draw it.

## The one thing to understand first

There is a solver. `solve(level, maxDepth)` returns the shortest program that
wins a level, or `null`. Every level in the game has a par that came from it,
and the test suite re-derives every par on every run. The generator uses it to
throw away dull rooms, and the editor runs it live so a child can never build a
broken level.

Nothing else in this codebase matters as much as that. If you are about to
write something that judges whether a level is any good, ask the solver instead.

See `HANDOFF.md` for the architecture and the reasoning, `MEMORY.md` for the
facts that are easy to get wrong, and `LOG.md` for how it got here.
