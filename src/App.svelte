<script lang="ts">
  import { cubicOut } from 'svelte/easing'
  import Board from './view/Board.svelte'
  import Console from './view/Console.svelte'
  import GameBar from './view/GameBar.svelte'
  import Menu from './view/Menu.svelte'
  import Rooms from './view/Rooms.svelte'
  import Editor from './view/Editor.svelte'
  import Intro from './view/Intro.svelte'
  import Store from './view/Store.svelte'
  import { DECOR } from './view/decor'
  import { createGame } from './view/game.svelte'
  import type { Dir } from './engine/types'

  const g = createGame()
  const decor = $derived(DECOR[g.level.theme]())

  const KEYS: Record<string, Dir> = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  }
  /**
   * Screens push through one another rather than cutting: going deeper zooms
   * in, coming back zooms out. Depth is what tells you which way you moved.
   */
  function push(_n: Element, { from = 1.06, delay = 0 } = {}) {
    return {
      duration: 340,
      delay,
      easing: cubicOut,
      css: (t: number, u: number) => `opacity:${t}; transform: scale(${from + (1 - from) * t})`,
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (g.screen !== 'play') {
      if (e.key === 'Escape') g.goTo('menu')
      return
    }
    if (KEYS[e.key]) { e.preventDefault(); g.add(KEYS[e.key]) }
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); g.play() }
    if (e.key === 'Backspace') { e.preventDefault(); g.removeAt(g.program.length - 1) }
    if (e.key === 'Escape') g.goTo('rooms')
  }
</script>

<svelte:window {onkeydown} />

{#if g.screen === 'menu'}
  <div class="screen" class:back={g.nav === 'back'} in:push={{ from: 0.9, delay: 120 }} out:push={{ from: 0.9 }}>
    <Menu {g} />
  </div>
{:else if g.screen === 'intro' && g.introOf}
  <div class="screen"><Intro {g} /></div>
{:else if g.screen === 'editor'}
  <div class="screen" in:push={{ from: 1.16, delay: 120 }} out:push={{ from: 1.16 }}>
    <Editor {g} />
  </div>
{:else if g.screen === 'store'}
  <div class="screen" class:back={g.nav === 'back'} in:push={{ from: 1.16, delay: 120 }} out:push={{ from: 1.16 }}>
    <Store {g} />
  </div>
{:else if g.screen === 'rooms'}
  <div class="screen" class:back={g.nav === 'back'} in:push={{ from: 1.1, delay: 120 }} out:push={{ from: 1.1 }}>
    <Rooms {g} />
  </div>
{:else}
  <div class="screen ingame" class:back={g.nav === 'back'} in:push={{ from: 1.16, delay: 120 }} out:push={{ from: 1.16 }}>
    <GameBar {g} />
  <!-- The third viewing of the celebration is already too long — tap to skip. -->
  <div class="scene" class:snap={g.snap} data-theme={g.level.theme}
       style="--z:{g.zoom}" onclick={g.skipCelebration} role="presentation">
    {#key g.level.id}<div class="decor">{@html decor}</div>{/key}
    <Board {g} />
  </div>
    <Console {g} />
  </div>
{/if}
