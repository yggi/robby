<script lang="ts">
  import { BOT_SVG, CAT_SVG, EMBLEM } from './icons'
  import type { Game } from './game.svelte'

  let { g }: { g: Game } = $props()

  // Progress rides around the emblem as a ring of pips, so a world shows how
  // far in you are without a number or a word anywhere near it.
  const ring = (n: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = (-90 + (i * 360) / n) * (Math.PI / 180)
      return { i, x: 50 + Math.cos(a) * 47, y: 50 + Math.sin(a) * 47 }
    })

  // Two taps to wipe, and the armed state times out on its own so a stray tap
  // never leaves a live button sitting there.
  let armed = $state(false)
  let disarm: ReturnType<typeof setTimeout> | null = null
  function tapReset() {
    if (disarm) clearTimeout(disarm)
    if (!armed) {
      armed = true
      disarm = setTimeout(() => (armed = false), 4000)
      return
    }
    armed = false
    g.resetProgress()
  }
  const anything = $derived(g.bits > 0 || g.solved.length > 0)
</script>

<div class="menu" class:back={g.nav === 'back'}>
  <!-- Robby, Funke and the purse all lead into the workshop: whichever of the
       three a child prods, they are asking the same question. -->
  <button class="cast" aria-label="workshop" onclick={() => g.goTo('store')}>
    <div class="bot flat on hero-bot">{@html BOT_SVG(g.kit)}</div>
    <div class="cat on hero-cat">{@html CAT_SVG(g.kit)}</div>
    <span class="castpurse">
      <span class="bit static"><span class="face"><b>0</b><b>1</b></span></span>
      {#key g.bits}<em>{g.bits}</em>{/key}
    </span>
  </button>

  <h1>Robby &amp; Funke</h1>
  <p class="dedication">for Emilia</p>

  <div class="worlds">
    {#each g.chapters as c, i (c.id)}
      <button class="world" aria-label={c.name} onclick={() => g.openChapter(i)}>
        <span class="emblemwrap" data-theme={c.theme}>
          {@html EMBLEM[c.id] ?? EMBLEM.test}
          {#each ring(c.levels.length) as p (p.i)}
            <i class="ringpip" class:done={g.isSolved(c.levels[p.i].id)}
               style="left:{p.x}%; top:{p.y}%"></i>
          {/each}
        </span>
      </button>
    {/each}
  </div>

  {#if anything}
    <button class="wipe" class:armed onclick={tapReset}>
      {armed ? 'Tap again to erase everything' : 'Start over'}
    </button>
  {/if}
</div>
