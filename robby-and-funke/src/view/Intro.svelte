<script lang="ts">
  import { DECOR } from './decor'
  import type { Chapter } from '../engine/types'
  import type { Game } from './game.svelte'
  import { EMBLEM } from './icons'

  let { g }: { g: Game } = $props()
  const chapter = $derived(g.introOf as Chapter)
  const decor = $derived(DECOR[chapter.theme]())
</script>

<!-- Where they have landed. A beat between the rocket leaving one world and
     setting down in the next; tap it away if you already know. -->
<div class="intro" data-theme={chapter.theme} onclick={() => g.skipIntro?.()}
     role="presentation">
  {#key chapter.id}<div class="decor">{@html decor}</div>{/key}
  <div class="introcard">
    <span class="introemblem" data-theme={chapter.theme}>
      {@html EMBLEM[chapter.id] ?? EMBLEM.test}
    </span>
    <h1>{chapter.name}</h1>
    <p>{chapter.blurb}</p>
    <span class="introrooms">
      {#each chapter.levels as l (l.id)}<i></i>{/each}
    </span>
  </div>
</div>
