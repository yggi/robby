<script lang="ts">
  import { tick } from 'svelte'
  import { flip } from 'svelte/animate'
  import { DIRS, type Dir } from '../engine/types'
  import { DIR_COLOR } from './colors'
  import { flyBetween } from './fly'
  import type { Game } from './game.svelte'
  import { arrow, ICON } from './icons'

  let { g }: { g: Game } = $props()
  let stripEl: HTMLDivElement

  const empties = $derived(
    Math.max(1, Math.max(g.level.par.length, g.slots.length) + 1 - g.slots.length),
  )

  /** The arrow flies out of the tray and into the slot it just filled. */
  async function place(d: Dir, e: MouseEvent) {
    const before = g.slots.length
    const from = (e.currentTarget as HTMLElement).getBoundingClientRect()
    g.add(d)
    if (g.slots.length === before) return
    await tick()
    const landed = stripEl?.querySelectorAll('.slot.filled')
    const target = landed?.[landed.length - 1]
    if (target) flyBetween(from, target.getBoundingClientRect(), arrow(d), DIR_COLOR[d], 300)
  }

  /** Falls out of the strip; the rest close the gap behind it. */
  function drop(_node: Element, { duration = 260 } = {}) {
    return {
      duration,
      css: (t: number, u: number) =>
        `transform: translateY(${u * 34}px) scale(${0.35 + t * 0.65}) rotate(${u * 22}deg);
         opacity: ${t}`,
    }
  }
  const lit = $derived(g.running ? g.frame?.cmdIndex ?? null : null)

  // Two modes only. A failed run drives itself home, so there is nothing left
  // for a "try again" button to do — the button is always Play or Next.
  // `won` is checked before `running`, so the button flips to Next on the first
  // frame of the celebration rather than after the confetti has settled.
  const mode = $derived(
    g.won ? 'next'
      : g.running ? 'running'
      : g.program.length && g.trace.outcome === 'win' ? 'ready'
      : '',
  )
  const icon = $derived(g.won ? ICON.next : g.running ? ICON.stop : ICON.play)
  const label = $derived(g.won ? 'next level' : g.running ? 'stop' : 'play')
</script>

<div class="console">
  <div class="strip" bind:this={stripEl}>
    {#each g.slots as s, i (s.id)}
      <button
        class="slot filled"
        class:lit={lit === i}
        class:blame={g.blame === i}
        style="--dc:{DIR_COLOR[s.dir]}"
        animate:flip={{ duration: 300 }}
        out:drop
        aria-label="remove {s.dir}"
        onclick={() => g.removeAt(i)}
      >
        {@html arrow(s.dir)}
      </button>
    {/each}
    {#each { length: empties } as _, i (i)}
      <span class="slot"></span>
    {/each}
  </div>

  <div class="controls">
    <div class="tray">
      {#each DIRS as d (d)}
        {#if g.level.tray[d]}
          <button class="token" aria-label={d} style="--dc:{DIR_COLOR[d]}"
                  disabled={g.left(d) <= 0 || g.playhead >= 0 || g.running}
                  onclick={(e) => place(d as Dir, e)}>
            {@html arrow(d)}<b>{g.left(d)}</b>
          </button>
        {/if}
      {/each}
    </div>

    <button class="play {mode}" aria-label={label} onclick={g.play}>{@html icon}</button>
  </div>
</div>
