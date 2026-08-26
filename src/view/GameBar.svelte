<script lang="ts">
  import { BACK_ICON } from './icons'
  import type { Game } from './game.svelte'

  let { g }: { g: Game } = $props()
</script>

<!-- The same bar as the world screens: back on the left, where you left it,
     then the name of the room you are in. The progress and the purse used to
     sit down in the console among the controls, which put status and input in
     the same place and left neither with any room. -->
<div class="gamebar">
  <button class="ghostbtn" aria-label="back to rooms" onclick={() => g.goTo(g.returnTo, 'back')}>
    {@html BACK_ICON}
  </button>

  <div class="gbmid">
    <h2>{g.level.room ?? g.chapter.name}</h2>
    {#if g.isPractice}
      <span class="endless">∞</span>
    {:else}
    <div class="pips">
      {#each g.chapter.levels as l, i (l.id)}
        <button class="pip" class:now={i === g.li}
                class:done={g.isSolved(l.id) && i !== g.li}
                aria-label="room {i + 1}" onclick={() => g.openLevel(i)}></button>
      {/each}
    </div>
    {/if}
  </div>

  <span class="purse" id="bits" aria-label="{g.bits} bits">
    <span class="bit static"><span class="face"><b>0</b><b>1</b></span></span>
    {#key g.bits}<em>{g.bits}</em>{/key}
  </span>
</div>
