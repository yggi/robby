<script lang="ts">
  import { at } from '../engine/parse'
  import { DELTA, OBJECTIVES, type Dir, type ItemKind } from '../engine/types'
  import { flyBits } from './bits'
  import { DIR_ANGLE, DIR_COLOR } from './colors'
  import type { Game } from './game.svelte'
  import { geom } from './geom'
import { propsFor, scatterProps } from './props'
  import { sfx } from './audio'
import { BATT_SVG, BOT_SVG, CAT_SVG, KEY_SVG, PART_SVG, ROCKET_SVG, STRANDS_SVG, THICKET_SVG } from './icons'

  let { g }: { g: Game } = $props()
  const level = $derived(g.level)
  let boardEl: HTMLDivElement
  let botEl: HTMLDivElement

  const st = $derived(g.shown)
  const W = $derived(st.world.w)
  const H = $derived(st.world.h)
  const build = $derived(g.playhead < 0)
  const ev = $derived(g.frame?.event ?? null)

  // In build mode the plan is drawn on the world it *leaves behind*, so gates
  // it opens read as open. Tiles it will burn fade rather than crumble — they
  // haven't fallen yet, and crumbling before Play reads as broken.
  const after = $derived(
    g.trace.frames.length ? g.trace.frames[g.trace.frames.length - 1].state.world : st.world,
  )
  const drawWorld = $derived(build ? after : st.world)

  const cells = $derived.by(() => {
    const out = []
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const c = at(drawWorld, { x, y })
        if (c.kind === 'wall') continue
        out.push({
          key: `${x},${y}`, x, y,
          kind: c.kind,
          open: !!c.open,
          collapsed: c.kind === 'fragile' && !!c.collapsed,
          dir: c.dir ?? null,
          ...geom(drawWorld, x, y),
        })
      }
    return out
  })

  /**
   * The plan, drawn as directed vectors rather than a trail of dots. Each
   * segment carries its own direction's colour, so a long straight run reads as
   * one continuous coloured stroke — which is the lesson exactly: a single
   * instruction bought all of that distance.
   */
  const vectors = $derived.by(() => {
    if (!build) return []
    const moves = g.trace.frames.filter(
      (f) => (f.from.x !== f.to.x || f.from.y !== f.to.y) && f.dir,
    )
    return moves.map((f, i) => ({
      key: i,
      x: f.from.x,
      y: f.from.y,
      angle: DIR_ANGLE[f.dir as Dir],
      color: DIR_COLOR[f.dir as Dir],
      // the belt's share of the journey, which cost him nothing
      carried: !!f.carried,
      delay: i * 44,
      head: i === moves.length - 1,
    }))
  })

  /**
   * The room's furniture, placed by hand at authored coordinates rather than
   * scattered by a hash. A few deliberate objects tell you where you are; a
   * wall full of plausible junk tells you nothing.
   */
  const clutter = $derived(
    propsFor(
      level.id,
      // a generated room has no authored furniture, so it gets some from its seed
      level.id.includes('-gen-')
        ? scatterProps(
            level.id,
            (x, y) => at(st.world, { x, y }).kind === 'wall',
            st.world.w,
            st.world.h,
          )
        : [],
    ),
  )

  const exits = $derived(cells.filter((c) => c.kind === 'exit'))
  /** The rocket's manifest, checked live so the porthole lights the moment the
      robot picks the battery up — the requirement is never written down. */
  const manifest = $derived(g.level.goal.type === 'exit' ? g.level.goal.requires : [])
  const armed = $derived(manifest.length > 0 && manifest.every((r) => st.held.includes(r)))

  /**
   * What Robby is after, in the order the level wants it. Shown in his thought
   * bubble rather than pinned to the rocket: the rocket is not the one doing
   * the wanting, and on a room with no rocket there was nowhere to put it.
   */
  const needs = $derived.by(() => {
    const goal = g.level.goal
    const kinds: ItemKind[] =
      goal.type === 'exit'
        ? goal.requires
        : [...new Set(g.start.items.filter((i) => OBJECTIVES.includes(i.kind)).map((i) => i.kind))]
    return kinds.map((kind) => ({ kind, got: st.held.includes(kind) }))
  })
  const wantsRocket = $derived(g.level.goal.type === 'exit')
  /**
   * Standing on the pad without the full manifest. The rocket has to say so —
   * otherwise arriving short looks identical to the pad being broken.
   */
  const shortHanded = $derived(
    manifest.length > 0 &&
      !armed &&
      exits.some((e) => e.x === st.pos.x && e.y === st.pos.y),
  )
  // Driven by the departure, not by the win: pressing Next is what launches it.
  const launching = $derived(g.launching)
  /**
   * Boarding belongs to the celebration, not to the departure. They cheer, they
   * climb in, and then the rocket sits there loaded and ticking over until the
   * player asks for the next room — which is when it actually goes.
   */
  const boarding = $derived(ev === 'win' && g.level.goal.type === 'exit')
  const loaded = $derived(boarding || launching)

  /**
   * He thinks out loud when he is standing still, when he has run out of
   * instructions, when he has just picked something up, and when he is stood on
   * the pad without everything the rocket wants.
   */
  const thinking = $derived(
    (build && !g.returning) ||
      ev === 'shrug' ||
      ev === 'stranded' ||
      ev === 'pickup' ||
      shortHanded,
  )

  /**
   * When nothing is happening, Funke explores.
   *
   * She used to pick a tile within two squares and slide to it, which took her
   * straight through walls — a cat teleporting across a corner. Now she walks:
   * a breadth-first search finds a real route from where she is to somewhere
   * she has not been lately, and she takes it a tile at a time.
   */
  const reachable = $derived.by(() => {
    const home = g.trace.frames.length ? g.trace.frames[0].from : st.pos
    const seen = new Map<string, { x: number; y: number }[]>()
    const key = (p: { x: number; y: number }) => `${p.x},${p.y}`
    seen.set(key(home), [])
    const queue = [home]
    while (queue.length) {
      const p = queue.shift()!
      const path = seen.get(key(p))!
      if (path.length >= 6) continue // she does not wander off across the room
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: p.x + dx, y: p.y + dy }
        if (seen.has(key(n))) continue
        const cell = at(st.world, n)
        if (cell.kind === 'wall' || cell.kind === 'blocked') continue
        seen.set(key(n), [...path, n])
        queue.push(n)
      }
    }
    return seen
  })

  let stroll = $state<{ x: number; y: number } | null>(null)
  let padding = $state(false)
  let walking: ReturnType<typeof setTimeout> | null = null
  /** the last few tiles she stood on, so she does not pace the same two squares */
  let lately: string[] = []

  $effect(() => () => {
    if (walking) clearTimeout(walking)
    walking = null
  })

  /** Take one route, a tile at a time, at a cat's pace. */
  function padAlong(route: { x: number; y: number }[]) {
    let i = 0
    const step = () => {
      if (i >= route.length) {
        padding = false
        return
      }
      stroll = route[i++]
      lately = [...lately.slice(-5), `${stroll.x},${stroll.y}`]
      walking = setTimeout(step, 380 + Math.random() * 160)
    }
    padding = true
    step()
  }

  let party = $state<{ bot: number; cat: number; path: { x: number; y: number }[] } | null>(null)
  let beat = $state(0)
  let partyTimer: ReturnType<typeof setInterval> | null = null

  // The celebration's interval outlived the component if you left mid-party —
  // it went on nudging state belonging to a destroyed effect, which is what
  // Svelte's derived_inert warning was pointing at.
  $effect(() => () => {
    if (partyTimer) clearInterval(partyTimer)
    partyTimer = null
  })

  function throwParty(atPos: { x: number; y: number }) {
    // tiles she can bolt to, never the one Robby is standing on
    const near = []
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const p = { x: atPos.x + dx, y: atPos.y + dy }
      if (at(st.world, p).kind !== 'wall') near.push(p)
    }
    for (let i = near.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[near[i], near[j]] = [near[j], near[i]]
    }
    const cat = 1 + Math.floor(Math.random() * 4)
    // only the zoomies variant actually travels, and only if there is room
    const path = cat === 3 && near.length > 1 ? near.slice(0, 3) : near.slice(0, 1)
    party = { bot: 1 + Math.floor(Math.random() * 4), cat, path }
    beat = 0
    if (partyTimer) clearInterval(partyTimer)
    if (path.length > 1) {
      partyTimer = setInterval(() => (beat += 1), 620)
      setTimeout(() => {
        if (partyTimer) clearInterval(partyTimer)
        partyTimer = null
      }, 2400)
    }
  }
  $effect(() => {
    const idle = g.playhead < 0 && !g.running && !g.returning
    if (!idle || reachable.size < 3) {
      stroll = null
      return
    }
    const id = setInterval(
      () => {
        if (padding) return // still on her way somewhere
        const here = stroll ?? (g.trace.frames.length ? g.trace.frames[0].from : st.pos)
        const from = reachable.get(`${here.x},${here.y}`)
        // routes are held from Robby's tile, so re-root them on hers
        const options = [...reachable.entries()]
          .filter(([k, route]) => route.length > 0 && k !== `${here.x},${here.y}`)
          .filter(([k]) => !lately.includes(k))
        const pick = (options.length ? options : [...reachable.entries()].slice(1))[
          Math.floor(Math.random() * Math.max(1, options.length))
        ]
        if (!pick) return
        // walk out to Robby's tile and on to the target, so every step is a
        // neighbour of the last and she never crosses a wall
        const back = (from ?? []).slice().reverse().slice(1).concat(
          (from ?? []).length ? [g.trace.frames.length ? g.trace.frames[0].from : st.pos] : [],
        )
        padAlong([...back, ...pick[1]])
      },
      2600 + Math.random() * 2400,
    )
    return () => clearInterval(id)
  })

  /**
   * Funke trails one frame behind Robby — literally: her tile is wherever he
   * was on the previous frame. Free following, no pathfinding, and it can never
   * desync because it is derived from the same trace.
   */
  const catPos = $derived.by(() => {
    if (loaded) return st.pos // she boards too
    // Never onto Robby's own tile: she used to celebrate standing inside him,
    // which put her tail across his face.
    if (ev === 'win' && party?.path.length) return party.path[beat % party.path.length]
    if (g.playhead >= 1) return g.trace.frames[g.playhead - 1].state.pos
    if (g.playhead < 0 && !g.running && stroll) return stroll
    return g.trace.frames.length ? g.trace.frames[0].from : st.pos
  })
  const catStep = $derived(ev === 'win' ? 520 : padding ? 900 : g.stepMs)
  const catCls = $derived(
    [
      st.held.includes('battery') ? 'on' : '',
      g.running || g.returning || padding ? 'moving' : '',
      // she climbs in when he does, at the end of the cheering — not at liftoff,
      // or she would be left standing on the pad watching it go
      boarding || launching ? 'boarding' : '',
      ev === 'bonk' ? 'startled' : '',
      ev === 'shrug' || ev === 'stranded' ? 'puzzled' : '',
      ev === 'win' ? `cheer v${party?.cat ?? 1}` : '',
    ]
      .filter(Boolean)
      .join(' '),
  )

  const BELT_SPIN: Record<string, number> = { right: 0, down: 90, left: 180, up: 270 }

  const bd = $derived(ev === 'bonk' && st.dir ? DELTA[st.dir as Dir] : { x: 0, y: 0 })
  const botCls = $derived(
    [
      st.dir ?? 'flat',
      st.held.includes('battery') ? 'on' : 'sad',
      g.running ? 'moving' : '',
      g.returning ? 'homing' : '',
      boarding || launching ? 'boarding' : '',
      ev === 'bonk' ? 'bonk' : '',
      ev === 'shrug' || ev === 'stranded' ? 'shrugging' : '',
      ev === 'win' ? `cheer v${party?.bot ?? 1}` : '',
    ]
      .filter(Boolean)
      .join(' '),
  )

  /**
   * A little grit in every idle clock. Two robots on the same page were
   * breathing, blinking and swaying in lockstep, which reads as one animation
   * playing twice rather than as two creatures.
   */
  const tic = Math.random() * 6
  const catTic = Math.random() * 6

  const fx = $derived(g.focus ? g.focus.x : (W - 1) / 2)
  const fy = $derived(g.focus ? g.focus.y : (H - 1) / 2)

  // Particles are throwaway DOM — cheaper and simpler than reactive lists.
  // Guarded by frame index so a re-render can never fire the same burst twice.
  let lastFx = -2
  $effect(() => {
    const e = ev
    const at = g.playhead
    if (!boardEl || at === lastFx) return
    lastFx = at
    if (e === 'bonk') puff(st.pos.x + bd.x * 0.5, st.pos.y + bd.y * 0.5)
    if (e === 'win') {
      throwParty(st.pos)
      celebrate()
    }
    if (e === 'pickup') pickup(st.pos.x, st.pos.y)
    if (shortHanded) sfx.denied()
  })

  function spawn(cls: string, x?: number, y?: number) {
    const el = document.createElement('div')
    el.className = cls
    if (x !== undefined) {
      el.style.setProperty('--x', String(x))
      el.style.setProperty('--y', String(y))
    } else el.style.cssText = 'inset:0;width:100%;height:100%;translate:0 0;'
    boardEl.appendChild(el)
    return el
  }

  /** A ring and a scatter of sparks where the thing was. */
  function pickup(x: number, y: number) {
    const el = spawn('fx', x, y)
    const ring = document.createElement('span')
    ring.className = 'pickring'
    el.appendChild(ring)
    for (let i = 0; i < 8; i++) {
      const p = document.createElement('span')
      p.className = 'spark'
      p.style.setProperty('--sc', i % 2 ? '#ffd9a8' : '#fff3d6')
      const a = (Math.PI * 2 * i) / 8 + 0.4
      p.style.setProperty('--dx', Math.cos(a) * 38 + 'px')
      p.style.setProperty('--dy', Math.sin(a) * 38 - 8 + 'px')
      p.style.animationDelay = i * 18 + 'ms'
      el.appendChild(p)
    }
    setTimeout(() => el.remove(), 900)
  }

  /** The burn: a rolling cloud out from under it, and the pad shaking. */
  function exhaust(x: number, y: number) {
    if (!boardEl) return
    boardEl.classList.add('liftoff')
    setTimeout(() => boardEl?.classList.remove('liftoff'), 1300)
    const el = spawn('fx', x, y)
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('span')
      p.className = 'plume'
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

  $effect(() => {
    if (!launching) return
    const spot = exits[0]
    if (spot) exhaust(spot.x, spot.y)
  })

  function puff(x: number, y: number) {
    const el = spawn('fx', x, y)
    for (let i = 0; i < 7; i++) {
      const p = document.createElement('span')
      p.className = 'dust'
      const a = (Math.PI * 2 * i) / 7 + Math.random()
      p.style.setProperty('--dx', Math.cos(a) * 34 + 'px')
      p.style.setProperty('--dy', Math.sin(a) * 34 - 6 + 'px')
      p.style.animationDelay = Math.random() * 60 + 'ms'
      el.appendChild(p)
    }
    setTimeout(() => el.remove(), 720)
  }

  /** The full payoff: light, shockwaves, rays, confetti, and the bits. */
  function celebrate() {
    const { x, y } = st.pos

    const flash = spawn('fx flash')
    setTimeout(() => flash.remove(), 800)

    const rings = spawn('fx', x, y)
    for (let i = 0; i < 3; i++) {
      const r = document.createElement('span')
      r.className = 'shock'
      r.style.animationDelay = i * 190 + 'ms'
      rings.appendChild(r)
    }
    setTimeout(() => rings.remove(), 1700)

    const rays = spawn('fx rays', x, y)
    setTimeout(() => rays.remove(), 2400)

    const cols = ['#ff7b45', '#ffd23f', '#4dc8ff', '#ff6bd6', '#7ef07a', '#f4e6c8']
    const el = spawn('fx')
    for (let i = 0; i < 38; i++) {
      const p = document.createElement('span')
      p.className = i % 3 === 0 ? 'confetti star' : 'confetti'
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

    if (botEl) flyBits(botEl.getBoundingClientRect(), g.reward, g.collectBit)
  }
</script>

<div
  bind:this={boardEl}
  class="board"
  class:snap={g.snap}
  class:shake={ev === 'bonk'}
  style="--w:{W}; --h:{H}; --z:{g.zoom}; --fx:{fx}; --fy:{fy};
         --step:{g.stepMs}ms; --bx:{bd.x}; --by:{bd.y}"
>
  <div class="layer clutter">
    {#each clutter as p (p.key)}
      <div class="propcell" style="--x:{p.x}; --y:{p.y}">{@html p.svg}</div>
    {/each}
  </div>

  <div class="layer floors">
    {#each cells as c (c.key)}
      <div
        class="tile {c.kind}"
        class:willfall={c.collapsed && build}
        class:gone={c.collapsed && !build}
        style="--x:{c.x}; --y:{c.y}; --in:{c.in}; --rad:{c.rad}"
      ></div>
    {/each}
  </div>

  <div class="layer">
    {#each cells as c (c.key)}
      <div
        class="over {c.ori}"
        class:open={c.open}
        class:willfall={c.collapsed && build}
        class:gone={c.collapsed && !build}
        style="--x:{c.x}; --y:{c.y}; --in:{c.in}; --rad:{c.rad}"
      >
        {#if c.kind === 'belt'}
          <!-- drawn running east and rotated into place, so one animation
               serves all four directions -->
          <span class="beltwrap" style="--spin:{BELT_SPIN[c.dir ?? 'right']}deg">
            <i class="band"></i><i class="arrows"></i>
            <i class="lip a"></i><i class="lip b"></i>
          </span>
        {:else if c.kind === 'blocked'}
          <!-- the way through is still visible, it is simply shut for good -->
          <span class="thicket">{@html THICKET_SVG}</span>
        {:else if c.kind === 'gate'}
          <!-- raised bollards mean stop; sunk into the ground means go -->
          <span class="bollards">
            {#each [0, 1, 2] as i (i)}<span class="bollard"><span class="post"></span></span>{/each}
          </span>
        {:else if c.kind === 'fragile'}
          <!-- a floor that will not take a second crossing, drawn as whatever
               the world makes its weak bridges out of -->
          <span class="strands">{@html STRANDS_SVG}</span>
        {:else if c.kind === 'plate'}
          <span class="plate-ring"></span>
        {:else}
          <span class="mark"></span>
        {/if}
      </div>
    {/each}
  </div>

  <div class="layer plans">
    {#each vectors as v (v.key)}
      <div class="vec" style="--x:{v.x}; --y:{v.y}">
        <span class="seg" class:head={v.head} class:carried={v.carried}
              style="--a:{v.angle}deg; --dc:{v.color}">
          <i style="--d:{v.delay}ms"></i>
        </span>
      </div>
    {/each}
  </div>

  <div class="layer">
    {#each exits as e (e.key)}
      <div class="launchpad {launching ? `lift${g.liftVariant}` : ''}"
           class:armed class:loaded class:short={shortHanded} class:launch={launching}
           style="--x:{e.x}; --y:{e.y}">
        <span class="pad"></span>
        {@html ROCKET_SVG(g.kit)}
      </div>
    {/each}

    <!-- Iterated from the level's *starting* items, not the remaining ones:
         keying off what is left destroys the element the instant it is picked
         up, so it vanished with no animation at all. -->
    {#each g.start.items as item (item.id)}
      <div
        class="item {item.kind}"
        class:taken={!st.items.some((i) => i.id === item.id)}
        style="--x:{item.at.x}; --y:{item.at.y}"
      >
        <span class="cellwrap">
          {@html item.kind === 'battery' ? BATT_SVG : PART_SVG[item.kind] ?? KEY_SVG}
        </span>
      </div>
    {/each}

    <div class="cat {catCls}" class:dashing={!!g.leaving}
         style="--tic:{catTic}s; --x:{catPos.x}; --y:{catPos.y}; --catstep:{catStep}ms;
                --lx:{g.leaving?.dx ?? 0}; --ly:{g.leaving?.dy ?? 0}">
      {@html CAT_SVG(g.kit)}
    </div>

    <div
      bind:this={botEl}
      class="bot {botCls}"
      class:chasing={!!g.leaving}
      style="--tic:{tic}s; --x:{st.pos.x}; --y:{st.pos.y}; --bx:{bd.x}; --by:{bd.y};
             --lx:{g.leaving?.dx ?? 0}; --ly:{g.leaving?.dy ?? 0}"
    >
      {@html BOT_SVG(g.kit)}
      {#if thinking && needs.length}
        <span class="think" class:short={shortHanded}>
          {#each needs as n (n.kind)}
            <i class="want" class:got={n.got}>
              {@html n.kind === 'battery' ? BATT_SVG : PART_SVG[n.kind] ?? KEY_SVG}
            </i>
          {/each}
          {#if wantsRocket}
            <b class="then"></b>
            <i class="want goal" class:got={armed}>{@html ROCKET_SVG(g.kit)}</i>
          {/if}
        </span>
      {/if}
      {#if ev === 'shrug' || ev === 'stranded'}<span class="qmark">?</span>{/if}
    </div>
  </div>
</div>
