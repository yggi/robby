import type { Theme } from '../engine/types'

/** Ambient backdrop per theme. Purely decorative — no gameplay meaning. */
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

const house = () => {
  // dust turning in an afternoon sunbeam
  let h =
    '<div style="position:absolute;inset:0;background:linear-gradient(112deg,' +
    'transparent 33%,#fff6dc2b 41%,#fff6dc12 57%,transparent 63%)"></div>'
  for (let i = 0; i < 24; i++) {
    const s = rnd(2, 5)
    h += `<span class="mote" style="left:${rnd(0, 100)}%;top:${rnd(20, 100)}%;width:${s}px;height:${s}px;
      --o:${rnd(0.2, 0.6)};--dx:${rnd(-30, 30)}px;--t:${rnd(9, 18)}s;animation-delay:-${rnd(0, 14)}s"></span>`
  }
  return h
}

const garden = () => {
  // fireflies over the hedge
  let h = ''
  for (let i = 0; i < 18; i++) {
    const s = rnd(4, 7)
    h += `<span class="mote" style="left:${rnd(0, 100)}%;top:${rnd(28, 100)}%;width:${s}px;height:${s}px;
      background:#dcff86;box-shadow:0 0 11px #b6ff4d;--o:${rnd(0.35, 0.95)};--dx:${rnd(-70, 70)}px;
      --t:${rnd(7, 15)}s;animation-delay:-${rnd(0, 13)}s"></span>`
  }
  return h
}

/**
 * City, seen from directly above — the same viewpoint as the board.
 * The earlier version put a side-on skyline behind a top-down road, which
 * asked the eye to hold two incompatible cameras at once. These are rooftops:
 * ducting, water tanks, lit skylights. Everything obeys one projection.
 */
const city = () => {
  let h = ''
  const blocks = [
    [-6, -8, 34, 30], [32, -10, 30, 26], [66, -6, 40, 28],
    [-8, 26, 26, 26], [78, 24, 30, 30],
    [-10, 58, 32, 34], [26, 74, 30, 34], [62, 70, 26, 30], [88, 56, 26, 28],
  ]
  for (const [x, y, w, ht] of blocks) {
    h += `<div class="roof" style="left:${x}%;top:${y}%;width:${w}%;height:${ht}%"></div>`
    // rooftop clutter, placed inside the block
    for (let i = 0; i < 3; i++) {
      h += `<div class="ac" style="left:${x + rnd(0.12, 0.62) * w}%;top:${y + rnd(0.12, 0.68) * ht}%;
        width:${rnd(4, 8)}%;height:${rnd(4, 7)}%"></div>`
    }
    if (Math.random() > 0.45) {
      const d = rnd(6, 10)
      h += `<div class="tank" style="left:${x + rnd(0.5, 0.78) * w}%;top:${y + rnd(0.5, 0.72) * ht}%;
        width:${d}%;aspect-ratio:1"></div>`
    }
    for (let i = 0; i < 2; i++) {
      if (Math.random() > 0.55) continue
      h += `<div class="sky" style="left:${x + rnd(0.15, 0.7) * w}%;top:${y + rnd(0.15, 0.72) * ht}%;
        width:${rnd(3, 6)}%;height:${rnd(3, 5)}%;
        background:${Math.random() > 0.35 ? '#ffd98a' : '#8fd0ff'};
        box-shadow:0 0 12px ${Math.random() > 0.35 ? '#ffd98a90' : '#8fd0ff90'};
        --t:${rnd(3, 11)}s;animation-delay:-${rnd(0, 8)}s"></div>`
    }
  }
  return h
}

const factory = () => {
  // cogs turning behind the machine
  const cog = (s: number, t: number, rev = false) => `
    <svg class="gear${rev ? ' rev' : ''}" width="${s}" height="${s}" viewBox="0 0 100 100" style="--t:${t}s">
      <circle cx="50" cy="50" r="34" fill="none" stroke="#333a47" stroke-width="17" stroke-dasharray="13 13"/>
      <circle cx="50" cy="50" r="25" fill="none" stroke="#2b313d" stroke-width="9"/>
      <circle cx="50" cy="50" r="7" fill="#2b313d"/>
    </svg>`
  return `<div style="position:absolute;left:-5%;top:5%">${cog(200, 26)}</div>
          <div style="position:absolute;right:1%;top:-7%">${cog(135, 18, true)}</div>
          <div style="position:absolute;right:12%;bottom:-9%">${cog(240, 34)}</div>
          <div style="position:absolute;left:7%;bottom:-11%">${cog(115, 15, true)}</div>`
}

const ship = () => {
  // starfield and a distant world
  let h =
    '<div style="position:absolute;right:-14%;top:6%;width:230px;height:230px;border-radius:50%;' +
    'background:radial-gradient(circle at 34% 30%,#6486e0,#27407f 60%,#141f47);opacity:.55"></div>'
  for (let i = 0; i < 95; i++) {
    const s = rnd(1, 3.4)
    h += `<span class="star" style="left:${rnd(0, 100)}%;top:${rnd(0, 100)}%;width:${s}px;height:${s}px;
      --t:${rnd(2.2, 7)}s;animation-delay:-${rnd(0, 6)}s"></span>`
  }
  return h
}

/**
 * The Lab, seen from directly above — the same camera as the board itself.
 *
 * An earlier version built a papered wall with a pegboard and lamps hanging on
 * cords, which is a side-on view sitting underneath a top-down floor: the same
 * mistake the city skyline made. Everything here obeys one projection. Light
 * pools are the only trace of the ceiling, and a pool of light on a floor is
 * exactly what you see from above.
 */
const lab = () => {
  let h = '<div class="labfloor"></div>'

  // hazard paint along one edge of the workshop area
  h += '<div class="hazard" style="top:9%"></div><div class="hazard" style="bottom:11%"></div>'

  // a rug, slightly askew, because nobody straightens rugs
  h += '<div class="rug" style="left:4%;top:52%;width:210px;height:140px;rotate:-4deg"></div>'
  h += '<div class="rug small" style="right:6%;top:16%;width:130px;height:96px;rotate:6deg"></div>'

  // cable runs taped down to the floor
  h += `<svg class="cablerun" viewBox="0 0 100 100" preserveAspectRatio="none">
    <path d="M-2 26 C 18 24, 26 40, 46 38 S 78 22, 102 30" />
    <path d="M-2 78 C 22 82, 30 68, 52 72 S 82 88, 102 80" />
  </svg>`
  for (const [x, y, r] of [[16, 27, -8], [44, 38, 6], [72, 26, 12], [28, 80, 4], [66, 76, -10]])
    h += `<i class="tape" style="left:${x}%;top:${y}%;rotate:${r}deg"></i>`

  // a floor drain, and the oil that never quite came out
  h += '<div class="drain" style="left:78%;top:64%"></div>'
  h += '<div class="oil" style="left:12%;top:22%;width:88px;height:56px"></div>'
  h += '<div class="oil" style="right:16%;bottom:8%;width:64px;height:40px;rotate:24deg"></div>'

  // bolts and washers, dropped and never picked up
  for (let i = 0; i < 14; i++) {
    const d = rnd(3, 6)
    h += `<i class="bolt" style="left:${rnd(2, 98)}%;top:${rnd(4, 96)}%;width:${d}px;height:${d}px"></i>`
  }

  // pools of light from ceiling lamps you never see, breathing very slowly
  const lamps: [number, number, number][] = [[14, 18, 300], [52, 6, 380], [86, 44, 280], [30, 80, 320]]
  for (const [x, y, d] of lamps)
    h += `<span class="pool" style="left:${x}%;top:${y}%;width:${d}px;height:${d}px;
      --t:${rnd(7, 12)}s;animation-delay:-${rnd(0, 6)}s"></span>`

  // workshop dust turning through them
  for (let i = 0; i < 22; i++) {
    const d = rnd(2, 4.5)
    h += `<span class="mote" style="left:${rnd(0, 100)}%;top:${rnd(24, 100)}%;width:${d}px;height:${d}px;
      background:#ffe9c4;--o:${rnd(0.16, 0.44)};--dx:${rnd(-26, 26)}px;
      --t:${rnd(10, 19)}s;animation-delay:-${rnd(0, 15)}s"></span>`
  }
  return h
}

/**
 * The Mechanical Forest, seen from straight above — canopies, not trunks.
 * Looking down on a wood you see the tops of trees, so that is what this is:
 * clusters of leaves with a silver bolt at the centre of each, fallen logs,
 * ferns, glowing sap, and shafts of light coming through the gaps.
 */
const forest = () => {
  let h = '<div class="forestfloor"></div>'

  // canopies. Big ones first so the small ones layer on top.
  const trees: [number, number, number][] = [
    [6, 4, 190], [72, -6, 220], [88, 48, 170], [-6, 54, 200],
    [40, 84, 180], [18, 74, 130], [58, 10, 120],
  ]
  for (const [x, y, d] of trees) {
    h += `<div class="canopy" style="left:${x}%;top:${y}%;width:${d}px;height:${d}px;
      --t:${rnd(8, 15)}s;animation-delay:-${rnd(0, 8)}s">
        <i class="bolt-hub"></i>
      </div>`
  }

  // fallen silver trunks lying across the floor
  for (const [x, y, r, w] of [[10, 34, -18, 150], [66, 66, 24, 120], [34, 12, 8, 96]])
    h += `<i class="trunk" style="left:${x}%;top:${y}%;width:${w}px;rotate:${r}deg"></i>`

  // ferns and glowing sap on the ground
  for (let i = 0; i < 16; i++)
    h += `<i class="fern" style="left:${rnd(1, 97)}%;top:${rnd(2, 96)}%;
      rotate:${rnd(0, 360)}deg;scale:${rnd(0.6, 1.25)}"></i>`
  for (let i = 0; i < 12; i++) {
    const d = rnd(5, 11)
    h += `<i class="sap" style="left:${rnd(2, 97)}%;top:${rnd(3, 96)}%;width:${d}px;height:${d}px;
      --t:${rnd(2.4, 6)}s;animation-delay:-${rnd(0, 5)}s"></i>`
  }

  // shafts of daylight through the gaps in the canopy
  for (const [x, y, d] of [[30, 22, 260], [76, 30, 200], [22, 62, 220], [62, 78, 240]])
    h += `<span class="pool green" style="left:${x}%;top:${y}%;width:${d}px;height:${d}px;
      --t:${rnd(7, 12)}s;animation-delay:-${rnd(0, 6)}s"></span>`

  // spores drifting up through the light
  for (let i = 0; i < 20; i++) {
    const d = rnd(2, 5)
    h += `<span class="mote" style="left:${rnd(0, 100)}%;top:${rnd(24, 100)}%;width:${d}px;height:${d}px;
      background:#d9ffe4;--o:${rnd(0.2, 0.55)};--dx:${rnd(-30, 30)}px;
      --t:${rnd(9, 18)}s;animation-delay:-${rnd(0, 14)}s"></span>`
  }
  return h
}

/**
 * The scrapyard, from above: crushed car roofs stacked in rows, tyre piles seen
 * down the middle, oil that soaked in years ago, and rust creeping over
 * everything. Same camera as the board, as ever.
 */
const scrap = () => {
  let h = '<div class="scrapground"></div>'

  // flattened car roofs, laid out in rough rows the way a yard stacks them
  const cars: [number, number, number, number, string][] = [
    [-4, 6, 26, 15, '#8c3f2e'], [24, 2, 22, 13, '#6d5a3c'], [70, -2, 26, 14, '#9a5a2c'],
    [82, 30, 24, 14, '#7a3b30'], [-6, 34, 24, 13, '#5f6152'],
    [-4, 74, 27, 15, '#8a5330'], [30, 82, 24, 13, '#6b4030'], [68, 78, 25, 14, '#8f6a34'],
  ]
  for (const [x, y, w, ht, col] of cars)
    h += `<div class="wreck" style="left:${x}%;top:${y}%;width:${w}%;height:${ht}%;
      background:${col};rotate:${rnd(-8, 8)}deg"></div>`

  // tyre stacks, concentric from directly overhead
  for (const [x, y, d] of [[20, 24, 62], [56, 12, 48], [12, 58, 54], [88, 62, 46], [46, 92, 58]])
    h += `<div class="tyrepile" style="left:${x}%;top:${y}%;width:${d}px;height:${d}px"></div>`

  // rust blooms and old oil
  for (let i = 0; i < 10; i++)
    h += `<i class="rust" style="left:${rnd(0, 96)}%;top:${rnd(0, 96)}%;
      width:${rnd(40, 110)}px;height:${rnd(30, 80)}px;rotate:${rnd(0, 360)}deg"></i>`
  for (let i = 0; i < 5; i++)
    h += `<div class="oil" style="left:${rnd(4, 90)}%;top:${rnd(4, 90)}%;
      width:${rnd(50, 90)}px;height:${rnd(34, 58)}px"></div>`

  // bolts and swarf
  for (let i = 0; i < 16; i++) {
    const d = rnd(3, 6)
    h += `<i class="bolt" style="left:${rnd(2, 98)}%;top:${rnd(3, 97)}%;width:${d}px;height:${d}px"></i>`
  }

  // hard yard lighting from a mast you never see
  for (const [x, y, d] of [[24, 10, 300], [72, 54, 340]])
    h += `<span class="pool warm" style="left:${x}%;top:${y}%;width:${d}px;height:${d}px;
      --t:${rnd(8, 13)}s;animation-delay:-${rnd(0, 6)}s"></span>`

  for (let i = 0; i < 16; i++) {
    const d = rnd(2, 4.5)
    h += `<span class="mote" style="left:${rnd(0, 100)}%;top:${rnd(24, 100)}%;width:${d}px;height:${d}px;
      background:#ffd6a8;--o:${rnd(0.15, 0.4)};--dx:${rnd(-24, 24)}px;
      --t:${rnd(10, 18)}s;animation-delay:-${rnd(0, 14)}s"></span>`
  }
  return h
}

/**
 * The cheese moon. A moon that happens to be made of the stuff, not a wheel of
 * it in a spotlight: bare grey rock, craters with a lit rim and a shadowed
 * floor, Earth low over the horizon. The cheese shows only where the ground is
 * broken open, and in the strings holding the bridges together.
 *
 * The joke still works from directly overhead, which is the useful part — a
 * crater and a bubble in a wheel of Emmental are the same shape.
 */
const cheese = () => {
  let h = '<div class="rindground"></div>'

  // holes, from wide shallow ones to little bubbles
  const holes: [number, number, number][] = [
    [8, 12, 120], [64, 4, 90], [86, 38, 110], [-4, 46, 100],
    [30, 70, 130], [72, 76, 86], [46, 26, 70], [16, 88, 76],
  ]
  for (const [x, y, d] of holes)
    h += `<div class="hole" style="left:${x}%;top:${y}%;width:${d}px;height:${d}px"></div>`
  for (let i = 0; i < 22; i++) {
    const d = rnd(9, 26)
    h += `<i class="bubble" style="left:${rnd(0, 97)}%;top:${rnd(0, 97)}%;width:${d}px;height:${d}px"></i>`
  }

  // Earth, low and small, because that is the whole reason you know it is a moon
  h += '<div class="earthrise" style="right:6%;top:5%;width:96px;height:96px"></div>'

  // a seam of the stuff split open along a ridge; sparingly, it is a rumour
  h += '<div class="rind" style="left:-8%;top:62%;width:30%;height:8%;rotate:-6deg"></div>'

  // crumbs
  for (let i = 0; i < 16; i++) {
    const d = rnd(3, 7)
    h += `<i class="crumb" style="left:${rnd(2, 98)}%;top:${rnd(3, 97)}%;width:${d}px;height:${d}px;
      rotate:${rnd(0, 360)}deg"></i>`
  }

  // earthlight, low and blue-white across the surface
  for (const [x, y, d] of [[18, 8, 320], [70, 62, 300]])
    h += `<span class="pool cold" style="left:${x}%;top:${y}%;width:${d}px;height:${d}px;
      --t:${rnd(9, 14)}s;animation-delay:-${rnd(0, 7)}s"></span>`

  for (let i = 0; i < 14; i++) {
    const d = rnd(2, 4)
    h += `<span class="mote" style="left:${rnd(0, 100)}%;top:${rnd(24, 100)}%;width:${d}px;height:${d}px;
      background:#fff6cf;--o:${rnd(0.15, 0.4)};--dx:${rnd(-18, 18)}px;
      --t:${rnd(12, 20)}s;animation-delay:-${rnd(0, 15)}s"></span>`
  }
  return h
}

export const DECOR: Record<Theme, () => string> = {
  cheese,
  lab, forest, scrap, house, garden, city, factory, ship,
}
