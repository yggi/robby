<script lang="ts">
  import MiniMap from './MiniMap.svelte'
  import { DECOR } from './decor'
  import { BACK_ICON } from './icons'
  import type { Game } from './game.svelte'

  let { g }: { g: Game } = $props()
  const decor = $derived(DECOR[g.chapter.theme]())
  /** which room has its menu open; only ever one */
  let menu = $state<string | null>(null)
</script>

<!-- The level select stands in the chapter's own room, so choosing a level
     already feels like being somewhere. -->
<div class="rooms" data-theme={g.chapter.theme}>
  {#key g.chapter.id}<div class="decor">{@html decor}</div>{/key}

  {#if g.rolling}
    <!-- The roll blocks the main thread for up to about half a second, so this
         is animated purely with transform and opacity: those run off the
         compositor and keep moving while the thread is busy. Anything driven by
         script would simply freeze on its first frame. -->
    <div class="rolling-note">
      <span class="gearspin">
        <i></i><i></i><i></i>
      </span>
      <span class="dots"><i></i><i></i><i></i></span>
    </div>
  {/if}

  <div class="roomsinner">
    <div class="roomsbar">
      <button class="ghostbtn" aria-label="back" onclick={() => g.goTo('menu', 'back')}>
        {@html BACK_ICON}
      </button>
      <h2>{g.chapter.name}</h2>
      <span class="purse">
        <span class="bit static"><span class="face"><b>0</b><b>1</b></span></span>
        {g.bits}
      </span>
    </div>

    <!-- Snapshots of their adventures, pinned to the wall. The shape of the
         room is the label; a pre-reader recognises it long before a name. -->
    <div class="grid">
      {#each g.chapter.levels as l, i (l.id)}
        {#if g.chapter.id === 'mine'}
          <!-- A room you built is several things at once, so the tile cannot be
               a button: the menu holding the rest sits inside it. -->
          <div class="room mine" style="--tilt:0deg">
            <button class="playface" aria-label="{l.room}, room {i + 1}"
                    onclick={() => g.openLevel(i)}>
              <MiniMap level={l} />
              {#if g.isSolved(l.id)}<span class="tick">✓</span>{/if}
            </button>
            <span class="rname">{l.room}</span>
            <button class="dots" aria-label="more for {l.room}"
                    onclick={() => (menu = menu === l.id ? null : l.id)}>⋯</button>
            {#if menu === l.id}
              <div class="dropdown">
                <button onclick={() => { menu = null; g.editRoom(l.id) }}>Edit</button>
                <button onclick={() => { menu = null; g.copyRoom(l.id) }}>Copy</button>
                <button class="danger" onclick={() => { menu = null; g.deleteRoom(l.id) }}>
                  Delete
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <button
            class="room"
            class:solved={g.isSolved(l.id)}
            style="--tilt:{(i % 2 ? 1 : -1) * (0.8 + ((i * 7) % 9) / 9)}deg"
            aria-label="{l.room ?? l.id}, room {i + 1}"
            onclick={() => g.openLevel(i)}
          >
            <span class="pin"></span>
            <MiniMap level={l} />
            <span class="rname">{l.room ?? l.id}</span>
            <span class="num">{i + 1}</span>
            {#if g.isSolved(l.id)}<span class="tick">✓</span>{/if}
          </button>
        {/if}
      {/each}
      {#if g.chapter.id === 'mine'}
        <!-- the one tile that makes a room rather than opening one -->
        <button class="room build" aria-label="build a new room"
                onclick={() => g.buildRoom()}>
          <span class="plus"></span>
        </button>
      {/if}

      {#if g.canPractice}
        <!-- An endless room: a fresh corridor every time it is opened. Marked
             with a torn edge rather than a pin, because it is not a snapshot of
             anywhere they have been. -->
        <button class="room practice" class:rolling={g.rolling}
                aria-label="Practice, a new room every time"
                disabled={g.rolling}
                onclick={() => g.openPractice()}>
          <span class="dice"><i></i><i></i><i></i><i></i><i></i></span>
          <span class="num">∞</span>
        </button>
      {/if}
    </div>
  </div>
</div>
