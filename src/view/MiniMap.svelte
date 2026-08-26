<script lang="ts">
  import type { Level } from '../engine/types'
  let { level }: { level: Level } = $props()

  // A tiny picture of the room's shape. Far more use to a pre-reader than the
  // room's name, and it makes each level select tile individually recognisable.
  const w = $derived(Math.max(...level.map.map((r) => r.length)))
  const cells = $derived(
    level.map.flatMap((row, y) =>
      row.padEnd(w, '#').split('').map((ch, x) => ({ ch, x, y, key: `${x},${y}` })),
    ),
  )
  const kind = (ch: string) =>
    ch === '#' ? 'w' : ch === '*' ? 'b' : ch === '@' ? 'r' : ch === 'R' ? 's' : 'p'
</script>

<div class="mini" style="--mw:{w}; --mh:{level.map.length}">
  {#each cells as c (c.key)}
    <i class={kind(c.ch)} style="--mx:{c.x}; --my:{c.y}"></i>
  {/each}
</div>
