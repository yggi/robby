<script lang="ts">
  import { glyphFor } from '../engine/legend'
  import { parseMap } from '../engine/parse'
  import {
    assess, cellAt, cycle, discard, draftMap, grab, height, isStart, move, owns, paint,
    removable, rotate, starterDraft, width, BELTS, OBJECTS, ROCKET, rotated, nextObject,
    type Brush, type Draft, type Verdict,
  } from '../engine/editor'
  import { DIRS, posKey, spend, THEMES, type Dir, type Theme } from '../engine/types'
  import { sfx } from './audio'
  import { DIR_ANGLE } from './colors'
  import { kindCls } from './css'
  import { DECOR } from './decor'
  import type { Game } from './game.svelte'
  import { geom } from './geom'
  import {
    arrow, BACK_ICON, BATT_SVG, BOT_SVG, itemIcon, ROCKET_SVG, STRANDS_SVG,
  } from './icons'

  let { g }: { g: Game } = $props()

  let draft = $state<Draft>(g.editDraft ?? starterDraft('lab'))
  let past = $state<Draft[]>([])
  let brush = $state<Brush>('floor')
  /**
   * What the two brushes that carry a setting will lay down next. Tapping a
   * tool tile that is already chosen walks its ring — so a north-running belt
   * is chosen before it is painted, rather than painted east and turned three
   * times, and the rocket is reachable from the same button as the battery.
   */
  let kind = $state<Record<'object' | 'belt', string>>({ object: OBJECTS[0], belt: BELTS[0] })
  let gridEl: HTMLDivElement

  let verdict = $state<Verdict>(assess(draft))
  let thinking = $state(false)

  const W = $derived(width(draft))
  const H = $derived(height(draft))
  const decor = $derived(DECOR[draft.theme]())

  /* ── one gesture: hold to pick a thing up, tap to paint, drag to draw ── */
  let carrying = $state<{ ch: string; from: [number, number] } | null>(null)
  let hover = $state<[number, number] | null>(null)
  let pressed = $state<[number, number] | null>(null)
  let painting = false
  let holding: ReturnType<typeof setTimeout> | null = null

  /**
   * Long enough that drawing a line never lifts a piece by accident, short
   * enough that a hold does not feel like a wait. The piece lifts visibly the
   * moment it fires, which is what makes a hold legible without a word.
   */
  const HOLD_MS = 260

  /**
   * What the room looks like *right now*, mid-gesture: the draft with whatever
   * is being carried already at the finger — or already gone, when the finger
   * is off the edge. Done by running the same `move`/`discard` the release will
   * run, so the drag is a preview of its own outcome rather than a second
   * rendering path that has to agree with the first.
   */
  const shown = $derived.by(() => {
    if (!carrying) return draft
    return hover ? move(draft, carrying.from, hover) : discard(draft, carrying.from)
  })

  /**
   * The grid is drawn with the board's own tiles rather than a set of its own:
   * same neighbour-aware geometry, same ribbon, same theme. A room therefore
   * looks in the editor exactly as it will look played, and a new world's
   * palette reaches the editor without anyone remembering to bring it.
   */
  const parsed = $derived(parseMap(draftMap(shown)))
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
          start: isStart(shown, x, y),
          ...geom(world, x, y),
        })
      }
    return out
  })
  const route = $derived(verdict.status === 'ok' ? new Set(verdict.route) : new Set<string>())
  /** the cell the finger is on while something is being carried */
  const lifted = $derived(carrying && hover ? posKey({ x: hover[0], y: hover[1] }) : null)

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

  function cellAtPointer(e: PointerEvent): [number, number] | null {
    const r = gridEl.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * W)
    const y = Math.floor(((e.clientY - r.top) / r.height) * H)
    return x >= 0 && y >= 0 && x < W && y < H ? [x, y] : null
  }

  const clearHold = () => {
    if (holding) clearTimeout(holding)
    holding = null
  }

  /** Lay a brush stroke on one cell. */
  const stroke = (cell: [number, number]) =>
    commit(paint(draft, cell[0], cell[1], brush, kind[brush as 'object' | 'belt']))

  /**
   * Press decides nothing yet.
   *
   * Three things can follow, and which one it was is only knowable later: the
   * finger leaves the tile (a trail), the finger stays put long enough (pick
   * the thing up), or the finger lifts (a tap, which paints — or cycles, when
   * the tool is the one that made what is under it).
   */
  function down(e: PointerEvent) {
    const cell = cellAtPointer(e)
    if (!cell) return
    gridEl.setPointerCapture(e.pointerId)
    pressed = cell
    const thing = grab(draft, cell[0], cell[1])
    if (!thing) return
    holding = setTimeout(() => {
      holding = null
      pressed = null
      carrying = { ch: thing, from: cell }
      hover = cell
      sfx.token('up')
    }, HOLD_MS)
  }

  function drag(e: PointerEvent) {
    const cell = cellAtPointer(e)
    if (carrying) {
      hover = cell // null once the finger leaves the room, which means "drop it"
      return
    }
    if (!cell) return
    if (pressed && (cell[0] !== pressed[0] || cell[1] !== pressed[1])) {
      // the finger left the tile it started on: this is a stroke, not a tap
      clearHold()
      painting = true
      stroke(pressed)
      pressed = null
    }
    if (painting) stroke(cell)
  }

  function up() {
    clearHold()
    if (carrying) {
      if (!hover && removable(carrying.ch)) {
        // carried off the edge of the room and let go
        commit(discard(draft, carrying.from))
        sfx.remove()
      } else if (hover) {
        commit(move(draft, carrying.from, hover))
        sfx.press()
      }
    } else if (pressed) {
      // a tap. The tool that made what is under the finger turns it; any other
      // tool paints over it, and so does a tap on bare ground.
      const [x, y] = pressed
      const there = cellAt(draft, x, y)
      if (owns(brush, there)) {
        commit(brush === 'belt' ? rotate(draft, x, y) : cycle(draft, x, y))
        sfx.token('right')
      } else {
        stroke(pressed)
      }
    }
    carrying = null
    hover = null
    pressed = null
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
    { brush: 'object', label: 'Battery' },
    { brush: 'fragile', label: 'Bridge' },
    { brush: 'belt', label: 'Conveyor' },
  ]
  /**
   * What the two settable tools currently show, asked of the legend rather than
   * tabulated again here — a second table of what `@` or `S` means is exactly
   * what `legend.ts` was written to end.
   */
  const objectIcon = $derived(
    kind.object === ROCKET
      ? ROCKET_SVG(g.kit)
      : itemIcon(glyphFor(kind.object)?.item ?? 'battery'),
  )
  const beltAngle = $derived(DIR_ANGLE[glyphFor(kind.belt)?.dir ?? 'right'])
  const NAMES: Record<string, string> = {
    '*': 'Battery', c: 'Cog', s: 'Coil', x: 'Core', '@': 'Rocket',
    E: 'Conveyor right', S: 'Conveyor down', W: 'Conveyor left', N: 'Conveyor up',
  }
  const labelOf = (p: { brush: Brush; label: string }) =>
    p.brush === 'object' || p.brush === 'belt' ? NAMES[kind[p.brush]] ?? p.label : p.label

  /** Choosing a tool, or — when it is already chosen — walking its ring. */
  function pickTool(b: Brush) {
    if (brush !== b) {
      brush = b
      sfx.select()
      return
    }
    if (b === 'object') kind = { ...kind, object: nextObject(kind.object) }
    else if (b === 'belt') kind = { ...kind, belt: rotated(kind.belt) }
    else return
    sfx.token('right')
  }
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
            <div class="tile {kindCls(c.kind)}" style="--x:{c.x}; --y:{c.y}; --in:{c.in}; --rad:{c.rad}"></div>
          {/if}
        {/each}
      </div>

      <div class="elayer">
        {#each cells as c (c.key)}
          <div class="over {c.ori}"
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

        <!-- the rocket, drawn with the board's own launchpad so a built errand
             room looks exactly like the world it was learned in -->
        {#each cells.filter((c) => c.kind === 'exit') as c (c.key)}
          <div class="launchpad" class:carried={lifted === c.key} style="--x:{c.x}; --y:{c.y}">
            <span class="pad"></span>
            {@html ROCKET_SVG(g.kit)}
          </div>
        {/each}

        {#each cells.filter((c) => c.item) as c (c.key)}
          <div class="item {kindCls(c.item ?? 'battery')}" class:carried={lifted === c.key}
               style="--x:{c.x}; --y:{c.y}">
            <span class="cellwrap">{@html itemIcon(c.item ?? 'battery')}</span>
          </div>
        {/each}

        {#each cells.filter((c) => c.start) as c (c.key)}
          <div class="bot flat on" class:carried={lifted === c.key}
               style="--x:{c.x}; --y:{c.y}">
            {@html BOT_SVG(g.kit)}
            <!-- The verdict, in his own thought bubble rather than a sentence
                 under the grid. Same bubble, same slots and same colours as the
                 one he thinks in while a room is being played — a room that is
                 not finished is him wanting something, which is a thing he
                 already knows how to say without a word of text. -->
            <span class="think" class:good={!thinking && verdict.status === 'ok'}>
              {#if thinking}
                <span class="gearspin"><i></i><i></i><i></i></span>
              {:else if verdict.status === 'target'}
                <i class="want">{@html BATT_SVG}</i>
              {:else if verdict.status === 'ground'}
                <i class="want ground"></i>
              {:else if verdict.status === 'nopath'}
                <i class="want lost">?</i>
              {:else}
                <i class="want lit">{@html arrow('right')}</i>
                <b class="par">{verdict.par.length}</b>
              {/if}
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- in landscape these three become a rail beside the grid; in portrait
       `display: contents` leaves them exactly the rows they have always been -->
  <div class="erail">
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
          <!-- a brush is a cell kind, so its class goes through `kindCls` like
               every other one: `.wall {}` written for anything else must never
               be able to reach the palette -->
          <button class="paint {kindCls(p.brush)}" class:on={brush === p.brush}
                  aria-label={labelOf(p)} onclick={() => pickTool(p.brush)}>
            {#if p.brush === 'object'}
              <span class="swatch batt">{@html objectIcon}</span>
            {:else if p.brush === 'fragile'}
              <span class="swatch span">{@html STRANDS_SVG}</span>
            {:else if p.brush === 'belt'}
              <span class="swatch {kindCls('belt')}" style="--spin:{beltAngle}deg">
                <i></i><i></i><i></i>
              </span>
            {:else}
              <span class="swatch {kindCls(p.brush)}"></span>
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
</div>
