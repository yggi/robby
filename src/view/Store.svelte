<script lang="ts">
  import { flyCoins } from './bits'
  import type { Game } from './game.svelte'
  import { BACK_ICON, BOT_SVG, CAT_SVG, ROCKET_SVG } from './icons'
  import { SLOTS, partFor, type Part, type Slot } from './parts'

  let { g }: { g: Game } = $props()

  let openSlot = $state<Slot | null>(null)
  let purseEl: HTMLElement

  /** A part drawn on its own, cropped to the bit of the sprite it belongs to. */
  function preview(slot: Slot, part: Part) {
    const box =
      slot.owner === 'funke' ? '0 0 80 80' : slot.owner === 'rocket' ? '0 0 60 112' : '0 0 100 100'
    const g = slot.owner === 'funke' ? 'tail' : slot.owner === 'rocket' ? 'rtip' : 'ant'
    return `<svg viewBox="${slot.thumb}" data-box="${box}" class="pv"><g class="${g}">${part.art}</g></svg>`
  }

  function choose(slot: Slot, part: Part, e: MouseEvent) {
    if (!g.canAfford(part)) return
    const paying = !g.isOwned(part)
    const target = (e.currentTarget as HTMLElement).getBoundingClientRect()
    g.fit(slot.id, part)
    // coins leave the purse and land on the thing they bought
    if (paying && purseEl)
      flyCoins(purseEl.getBoundingClientRect(), target, Math.min(part.price, 5), () => {})
    openSlot = null
  }
</script>

<div class="store">
  <div class="roomsbar">
    <button class="ghostbtn" aria-label="back" onclick={() => g.goTo('menu', 'back')}>
      {@html BACK_ICON}
    </button>
    <h2>Workshop</h2>
    <span class="purse" bind:this={purseEl}>
      <span class="bit static"><span class="face"><b>0</b><b>1</b></span></span>
      {#key g.bits}<em>{g.bits}</em>{/key}
    </span>
  </div>

  <!-- Funke, Robby and the rocket, each on a stand with the one slot they own -->
  <div class="stands">
    {#each SLOTS as slot (slot.id)}
      <div class="stand {slot.owner}">
        <div class="figure">
          {#if slot.owner === 'funke'}
            <div class="cat on">{@html CAT_SVG(g.kit)}</div>
          {:else if slot.owner === 'robby'}
            <div class="bot flat on">{@html BOT_SVG(g.kit)}</div>
          {:else}
            <div class="launchpad armed showpiece">{@html ROCKET_SVG(g.kit)}</div>
          {/if}
        </div>
        <button class="slotchip" class:open={openSlot?.id === slot.id}
                aria-label="change {slot.label}"
                onclick={() => (openSlot = openSlot?.id === slot.id ? null : slot)}>
          {@html preview(slot, partFor(slot.id, g.kit))}
          <b>{slot.label}</b>
        </button>
      </div>
    {/each}
  </div>

  {#if openSlot}
    {@const slot = openSlot}
    <!-- the parts bin: a tray of compartments, one part to a compartment -->
    <div class="bin">
      <div class="binlip"><i></i><i></i><i></i></div>
      <div class="bintray">
        {#each slot.parts as part (part.id)}
          {@const owned = g.isOwned(part)}
          {@const worn = g.kit[slot.id] === part.id}
          {@const afford = g.canAfford(part)}
          <button
            class="bay"
            class:worn
            class:locked={!afford}
            disabled={!afford}
            aria-label="{part.name}{owned ? '' : `, ${part.price} bits`}"
            onclick={(e) => choose(slot, part, e)}
          >
            <span class="bayart">{@html preview(slot, part)}</span>
            <span class="bayname">{part.name}</span>
            {#if worn}
              <span class="tick">✓</span>
            {:else if owned}
              <span class="tag owned">·</span>
            {:else}
              <span class="tag price">
                <span class="bit static"><span class="face"><b>0</b><b>1</b></span></span>
                {part.price}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>
