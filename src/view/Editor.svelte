<script lang="ts">
  import { parseMap } from '../engine/parse'
  import {
    assess, discard, grab, height, inside, move, paint, removable, rotate, starterDraft,
    draftMap, width, type Brush, type Draft, type Verdict,
  } from '../engine/editor'
  import { DIRS, posKey, spend, THEMES, type Dir, type Theme } from '../engine/types'
  import { sfx } from './audio'
  import { DIR_ANGLE } from './colors'
  import { DECOR } from './decor'
  import type { Game } from './game.svelte'
  import { geom } from './geom'
  import { arrow, BACK_ICON, BATT_SVG, BOT_SVG, STRANDS_SVG } from './icons'

  let { g }: { g: Game } = $props()

  let draft = $state<Draft>(g.editDraft ?? starterDraft('lab'))
  let past = $state<Draft[]>([])
  let brush = $state<Brush>('floor')
  let gridEl: HTMLDivElement

  let verdict = $state<Verdict>(assess(draft))
  let thinking = $state(false)

  const W = $derived(width(draft))
  const H = $derived(height(draft))
  const decor = $derived(DECOR[draft.theme]())

  /**
   * The grid is drawn with the board's own tiles rather than a set of its own:
   * same neighbour-aware geometry, same ribbon, same theme. A room therefore
   * looks in the editor exactly as it will look played, and a new world's
   * palette reaches the editor without anyone remembering to bring it.
   */
  const parsed = $derived(parseMap(draftMap(draft)))
  const world = $derived(parsed.world)
  /** Where the pieces are, read off the parsed world rather than off the raw
      characters — the markup below used to test `ch === '*'` and `ch === 'R'`,
      which is the legend restated in a template. */
  const held = $derived(new Map(parsed.items.map((i) => [posKey(i.at), i.kind])))
  const cells = $derived.by(() => {
    const out = []
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const cell = world.cells[y * W + x]
        out.push({
          key: posKey({ x, y }), x, y,
          ground: cell.kind !== 'wall',
          kind: cell.kind,
          dir: cell.dir ?? null,
          item: held.get(posKey({ x, y })) ?? null,
          start: parsed.start.x === x && parsed.start.y === y,
          ...geom(world, x, y),
        })
      }
    return out
  })
  const route = $derived(verdict.status === 'ok' ? new Set(verdict.route) : new Set<string>())

  /** Solved on every finished stroke, never during one. */
  async function reassess() {
    thinking = true
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    verdict = assess(draft)
    thinking = false
  }

  function commit(next: Draft) {
    if (next === draft) return
    past = [...past.slice(-40), draft]
    draft = next
  }

  function undo() {
    if (!past.length) return
    draft = past[past.length - 1]
    past = past.slice(0, -1)
    sfx.remove()
    reassess()
  }

  /* ── one gesture: press a piece to carry it, press ground to paint ── */
  let carrying = $state<{ ch: string; from: [number, number] } | null>(null)
  let hover = $state<[number, number] | null>(null)
  let painting = false
  let moved = false

  function cellAt(e: PointerEvent): [number, number] | null {
    const r = gridEl.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * W)
    const y = Math.floor(((e.clientY - r.top) / r.height) * H)
    return x >= 0 && y >= 0 && x < W && y < H ? [x, y] : null
  }

  function down(e: PointerEvent) {
    const cell = cellAt(e)
    if (!cell) return
    gridEl.setPointerCapture(e.pointerId)
    moved = false
    const held = grab(draft, cell[0], cell[1])
    if (held) {
      carrying = { ch: held, from: cell }
      hover = cell
      sfx.token('up')
    } else {
      painting = true
      commit(paint(draft, cell[0], cell[1], brush))
    }
  }

  function drag(e: PointerEvent) {
    const cell = cellAt(e)
    if (carrying) {
      if (cell && (cell[0] !== carrying.from[0] || cell[1] !== carrying.from[1])) moved = true
      hover = cell // null once the finger leaves the room, which means "drop it"
    } else if (painting && cell) {
      commit(paint(draft, cell[0], cell[1], brush))
    }
  }

  function up() {
    if (carrying) {
      if (!hover && removable(carrying.ch)) {
        // carried off the edge of the room and let go
        commit(discard(draft, carrying.from))
        sfx.remove()
      } else if (hover && moved) {
        commit(move(draft, carrying.from, hover))
        sfx.press()
      } else if (hover) {
        // a tap rather than a drag: turn a conveyor on the spot
        const turned = rotate(draft, carrying.from[0], carrying.from[1])
        if (turned !== draft) {
          commit(turned)
          sfx.token('right')
        }
      }
    }
    carrying = null
    hover = null
    painting = false
    reassess()
  }

  function pickTheme(t: Theme) {
    draft = { ...draft, theme: t }
    sfx.select()
  }

  function save() {
    if (verdict.status !== 'ok') return
    g.saveRoom({
      id: g.editingId ?? `mine-${Date.now()}`,
      theme: draft.theme,
      name: draft.name,
      tray: draft.tray,
      map: draftMap(draft),
    })
  }

  /** Play the half-built room without leaving it behind. */
  function tryIt() {
    if (verdict.status !== 'ok') return
    g.testPlay(draft, { ...verdict.level, room: draft.name?.trim() || 'Trying it' })
  }

  /**
   * How many of each arrow the player gets. The floor is what the answer spends,
   * because a tray too small to hold the solution is a broken room rather than
   * a harder one — so the minus button simply stops there.
   */
  const floor = $derived(verdict.status === 'ok' ? spend(verdict.par) : null)
  const trayOf = (d: Dir) =>
    verdict.status === 'ok' ? (verdict.level.tray[d] ?? 0) : 0

  function nudge(d: Dir, by: number) {
    if (verdict.status !== 'ok' || !floor) return
    const next = Math.max(floor[d], Math.min(9, trayOf(d) + by))
    draft = { ...draft, tray: { ...(draft.tray ?? {}), [d]: next } }
    sfx.token(d)
    reassess()
  }

  const PAINTS: { brush: Brush; label: string }[] = [
    { brush: 'floor', label: 'Floor' },
    { brush: 'wall', label: 'Wall' },
    { brush: 'battery', label: 'Battery' },
    { brush: 'fragile', label: 'Bridge' },
    { brush: 'belt', label: 'Conveyor' },
  ]
</script>

<div class="editor" data-theme={draft.theme}>
  <div class="roomsbar">
    <button class="ghostbtn" aria-label="back" onclick={() => g.goTo('rooms', 'back')}>
      {@html BACK_ICON}
    </button>
    <!-- the room's name, typed straight into the bar it sits in -->
    <input
      class="roomname"
      value={draft.name ?? ''}
      placeholder={g.editingId ? 'Edit Room' : 'New Room'}
      aria-label="room name"
      maxlength="22"
      oninput={(e) => (draft = { ...draft, name: e.currentTarget.value })}
    />
    <button class="ghostbtn" aria-label="undo" disabled={!past.length} onclick={undo}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
           stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 12a8 8 0 1 0 2.5-5.8" /><path d="M3.5 3v5h5" />
      </svg>
    </button>
  </div>

  <div class="canvas">
    {#key draft.theme}<div class="decor">{@html decor}</div>{/key}
    <div
      class="egrid"
      class:dropping={!!carrying && !hover}
      bind:this={gridEl}
      style="--gw:{W}; --gh:{H}"
      onpointerdown={down}
      onpointermove={drag}
      onpointerup={up}
      onpointercancel={up}
      role="application"
      aria-label="level grid"
    >
      <!-- where a finger may paint: every cell, faintly -->
      <div class="elayer hints">
        {#each cells as c (c.key)}
          <div class="hint" class:filled={c.ground} style="--x:{c.x}; --y:{c.y}"></div>
        {/each}
      </div>

      <div class="elayer floors">
        {#each cells as c (c.key)}
          {#if c.ground}
            <div class="tile {c.kind}" style="--x:{c.x}; --y:{c.y}; --in:{c.in}; --rad:{c.rad}"></div>
          {/if}
        {/each}
      </div>

      <div class="elayer">
        {#each cells as c (c.key)}
          <div class="over {c.ori}" class:lifted={!!carrying && carrying.from[0] === c.x && carrying.from[1] === c.y}
               class:target={!!hover && hover[0] === c.x && hover[1] === c.y}
               style="--x:{c.x}; --y:{c.y}; --in:{c.in}; --rad:{c.rad}">
            {#if c.kind === 'belt'}
              <span class="beltwrap" style="--spin:{DIR_ANGLE[c.dir ?? 'right']}deg">
                <i class="band"></i><i class="arrows"></i><i class="lip a"></i><i class="lip b"></i>
              </span>
            {:else if c.kind === 'fragile'}
              <span class="strands">{@html STRANDS_SVG}</span>
            {/if}
            {#if route.has(c.key)}<span class="routedot"></span>{/if}
          </div>
        {/each}

        {#each cells.filter((c) => c.item === 'battery') as c (c.key)}
          <div class="item battery" style="--x:{c.x}; --y:{c.y}">
            <span class="cellwrap">{@html BATT_SVG}</span>
          </div>
        {/each}
        {#each cells.filter((c) => c.start) as c (c.key)}
          <div class="bot flat on" style="--x:{c.x}; --y:{c.y}">{@html BOT_SVG(g.kit)}</div>
        {/each}
      </div>
    </div>
  </div>

  <!-- the verdict, live. No validate button: if it solves, it is playable. -->
  <div class="verdict" class:good={verdict.status === 'ok'}>
    {#if thinking}
      <span class="gearspin"></span><b>thinking</b>
    {:else if verdict.status === 'empty'}
      <b>needs {verdict.needs.join(' and ')}</b>
    {:else if verdict.status === 'unreachable'}
      <b>Robby can't get there</b>
    {:else}
      <b>{verdict.par.length} {verdict.par.length === 1 ? 'arrow' : 'arrows'}</b>
      <span class="dots">{'·'.repeat(Math.min(verdict.par.length, 12))}</span>
    {/if}
  </div>

  {#if verdict.status === 'ok'}
    <!-- the tray the player will get, and how tight to make it -->
    <div class="trayedit">
      {#each DIRS as d (d)}
        <div class="trayslot">
          <button aria-label="fewer {d}" disabled={!floor || trayOf(d) <= floor[d]}
                  onclick={() => nudge(d, -1)}>−</button>
          <span class="cnt">{@html arrow(d)}<b>{trayOf(d)}</b></span>
          <button aria-label="more {d}" disabled={trayOf(d) >= 9}
                  onclick={() => nudge(d, 1)}>+</button>
        </div>
      {/each}
    </div>
  {/if}

  <div class="tools">
    <div class="paints">
      {#each PAINTS as p (p.brush)}
        <button class="paint {p.brush}" class:on={brush === p.brush}
                aria-label={p.label} onclick={() => (brush = p.brush)}>
          {#if p.brush === 'battery'}
            <span class="swatch batt">{@html BATT_SVG}</span>
          {:else if p.brush === 'fragile'}
            <span class="swatch span">{@html STRANDS_SVG}</span>
          {:else if p.brush === 'belt'}
            <span class="swatch belt"><i></i><i></i><i></i></span>
          {:else}
            <span class="swatch {p.brush}"></span>
          {/if}
        </button>
      {/each}
    </div>
    <!-- the hero is Play here as everywhere else; saving is the smaller act -->
    <button class="play" disabled={verdict.status !== 'ok'} aria-label="try this room"
            onclick={tryIt}>
      <svg viewBox="0 0 24 24"><path d="M8 4.5 L19.5 12 L8 19.5 Z"/></svg>
    </button>
    <button class="keep" disabled={verdict.status !== 'ok'} aria-label="save room"
            onclick={save}>
      <svg viewBox="0 0 24 24"><path d="M5 12.5 L10 17.5 L19.5 7" fill="none"
        stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
  </div>

  <div class="themepick">
    {#each THEMES.slice(0, 5) as t (t)}
      <button class="tchip" class:on={draft.theme === t} data-theme={t}
              aria-label={t} onclick={() => pickTheme(t)}></button>
    {/each}
  </div>
</div>
