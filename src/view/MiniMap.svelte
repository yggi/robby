<script lang="ts">
  import { parseMap } from '../engine/parse'
  import { posKey, type Level } from '../engine/types'
  import { markCls } from './css'
  let { level }: { level: Level } = $props()

  // A tiny picture of the room's shape. Far more use to a pre-reader than the
  // room's name, and it makes each level select tile individually recognisable.
  //
  // It reads the parsed world rather than the map characters. It used to have
  // its own four-character ladder, which meant every mechanic the engine grew
  // after it — belts, bridges, gates, one-ways — drew as indistinguishable
  // plain path, so two quite different rooms could show the same picture.
  const parsed = $derived(parseMap(level.map))
  const held = $derived(new Map(parsed.items.map((i) => [posKey(i.at), i.kind])))

  const cells = $derived(
    Array.from({ length: parsed.world.h }, (_, y) =>
      Array.from({ length: parsed.world.w }, (_, x) => ({
        x,
        y,
        key: posKey({ x, y }),
        mark: mark(x, y),
      })),
    ).flat(),
  )

  /**
   * One letter per class, because these are 4px squares: `w`all, `p`ath,
   * `s`tart, `r`ocket, `b` for anything lying there to be picked up, and `m`
   * for machinery — a belt, a gate, a bridge, a one-way, a way shut for good.
   *
   * `m` is deliberately *terrain only*. Lumping the parts in with it made the
   * check below pass on a room whose conveyors had stopped being drawn, because
   * the parts were still marking it.
   */
  function mark(x: number, y: number): string {
    if (parsed.start.x === x && parsed.start.y === y) return 's'
    if (held.has(posKey({ x, y }))) return 'b'
    const kind = parsed.world.cells[y * parsed.world.w + x].kind
    if (kind === 'wall') return 'w'
    if (kind === 'exit') return 'r'
    if (kind === 'floor') return 'p'
    return 'm'
  }
</script>

<div class="mini" style="--mw:{parsed.world.w}; --mh:{parsed.world.h}">
  {#each cells as c (c.key)}
    <i class={markCls(c.mark)} style="--mx:{c.x}; --my:{c.y}"></i>
  {/each}
</div>
