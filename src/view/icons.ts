import type { Dir } from '../engine/types'
import { partFor, type Kit } from './parts'

/* A real arrow — shaft and head. The play button is the only triangle in the
   app, so a direction can never be misread as "go". One path, rotated, so all
   four are provably identical. */
const ARROW_UP = 'M12 2.6 L20.6 12.6 H15.7 V21.4 H8.3 V12.6 H3.4 Z'
const SPIN: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 }

export const arrow = (d: Dir) =>
  `<svg viewBox="0 0 24 24" style="transform:rotate(${SPIN[d]}deg)"><path d="${ARROW_UP}"/></svg>`

export const BOT_SVG = (kit: Kit) => `
<svg viewBox="0 0 100 100" aria-hidden="true">
  <ellipse cx="50" cy="95" rx="29" ry="5.5" fill="#00000038"/>
  <g class="fidget"><g class="breathe"><g class="lean">
    <g class="ant">${partFor('antenna', kit).art}</g>
    <rect class="tread" x="12" y="78" width="76" height="15" rx="7.5"/>
    <line class="treadbelt" x1="20" y1="85.5" x2="80" y2="85.5"
          stroke-width="8" stroke-dasharray="5 7" stroke-linecap="round"/>
    <rect class="shell" x="15" y="26" width="70" height="58" rx="19"/>
    <path class="plate2" d="M15 70h70v5a9 9 0 0 1-9 9H24a9 9 0 0 1-9-9z"/>
    <rect class="visor" x="24" y="35" width="52" height="26" rx="13"/>
    <g class="gaze"><g class="eyes">
      <circle class="eye" cx="40" cy="48" r="6"/>
      <circle class="eye" cx="60" cy="48" r="6"/>
    </g></g>
    <rect x="36" y="66" width="28" height="9" rx="4.5" fill="#14403f"/>
    <rect class="gaugefill" x="37" y="67" width="26" height="7" rx="3.5"/>
  </g></g></g>
</svg>`

export const BATT_SVG = `
<svg class="batt" viewBox="0 0 40 62" aria-hidden="true">
  <rect x="13" y="0" width="14" height="7" rx="2.5" fill="#ffb08a"/>
  <rect x="2" y="6" width="36" height="54" rx="8" fill="#ff7b45" stroke="#c8552a" stroke-width="3"/>
  <path d="M23 16 L12 37 h8 l-3 12 12-21 h-8 z" fill="#fff3d6"/>
</svg>`

export const KEY_SVG = `
<svg class="keyi" viewBox="0 0 44 40" aria-hidden="true">
  <circle cx="14" cy="20" r="11" fill="none" stroke="#9fd6ff" stroke-width="6"/>
  <path d="M24 20h16M35 20v8" stroke="#9fd6ff" stroke-width="6" stroke-linecap="round"/>
</svg>`

/**
 * Funke, Robby's robot-cat. She has no bearing on the rules whatsoever — she
 * simply follows one step behind him and reacts to whatever happens.
 */
export const CAT_SVG = (kit: Kit) => `
<svg class="cat-svg" viewBox="0 0 80 80" aria-hidden="true">
  <g class="tail">${partFor('tail', kit).art}</g>
  <g class="catbody">
    <ellipse class="shell" cx="34" cy="56" rx="21" ry="16"/>
    <rect class="shell" x="44" y="62" width="10" height="11" rx="5"/>
    <rect class="shell" x="59" y="62" width="10" height="11" rx="5"/>
    <g class="cathead">
      <g class="eartwitch"><path class="ear" d="M45 32 L46 15 L58 27 Z"/></g>
      <path class="ear" d="M71 32 L70 16 L59 27 Z"/>
      <rect class="shell" x="42" y="25" width="31" height="28" rx="12"/>
      <rect class="plate2" x="43" y="47" width="29" height="6" rx="3"/>
      <g class="ceyes">
        <circle class="ceye" cx="52" cy="38" r="4.2"/>
        <circle class="ceye" cx="64" cy="38" r="4.2"/>
      </g>
      <path d="M56 45 h5" stroke="#9bb0b2" stroke-width="2.4" stroke-linecap="round"/>
    </g>
  </g>
</svg>`

export const ROCKET_SVG = (kit: Kit) => `
<svg class="rocket" viewBox="0 0 60 112" aria-hidden="true">
  <path class="flame" d="M20 84 Q30 116 40 84 Q30 94 20 84 Z" fill="#ffb648"/>
  <path class="flame" d="M24 84 Q30 105 36 84 Q30 91 24 84 Z" fill="#fff0c0"/>
  <path class="fin" d="M14 60 L1 88 L14 83 Z"/>
  <path class="fin" d="M46 60 L59 88 L46 83 Z"/>
  <path class="hull" d="M30 3 C45 20 47 40 47 62 L47 84 L13 84 L13 62 C13 40 15 20 30 3 Z"/>
  <g class="rtip">${partFor('tip', kit).art}</g>
  <rect class="band" x="13" y="66" width="34" height="8" rx="2"/>
  <circle class="port" cx="30" cy="41" r="10.5"/>
  <g class="crew">
    <circle cx="26.4" cy="38.4" r="2.5" fill="#ff7b45"/>
    <circle cx="33.6" cy="38.4" r="2.5" fill="#ff7b45"/>
    <path d="M25 46.6 L25.4 42.6 L28 45 Z" fill="#c39bff"/>
    <path d="M33.4 46.6 L33 42.6 L30.4 45 Z" fill="#c39bff"/>
    <circle cx="27.4" cy="46.6" r="1.7" fill="#c39bff"/>
    <circle cx="31.2" cy="46.6" r="1.7" fill="#c39bff"/>
  </g>
  <circle cx="30" cy="41" r="10.5" fill="none" stroke="#c4cfd6" stroke-width="3.5"/>
</svg>`

/** The three parts, in the forest's own colours: silver, purple, green. */
export const PART_SVG: Record<string, string> = {
  cog: `<svg class="part" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="20" r="13" fill="none" stroke="#cfd8e0" stroke-width="9" stroke-dasharray="5.5 5.5"/>
    <circle cx="20" cy="20" r="10" fill="#9aa8b5"/>
    <circle cx="20" cy="20" r="4.4" fill="#4a5560"/></svg>`,
  coil: `<svg class="part" viewBox="0 0 40 40" aria-hidden="true">
    <path d="M12 32 q8 -5 16 -3 M12 26 q8 -5 16 -3 M12 20 q8 -5 16 -3 M12 14 q8 -5 16 -3"
      fill="none" stroke="#b07dff" stroke-width="4.6" stroke-linecap="round"/>
    <rect x="9" y="32" width="22" height="4.5" rx="2.2" fill="#7a4fc0"/>
    <rect x="9" y="5" width="22" height="4.5" rx="2.2" fill="#7a4fc0"/></svg>`,
  core: `<svg class="part" viewBox="0 0 40 40" aria-hidden="true">
    <path d="M20 4 L32 16 L20 36 L8 16 Z" fill="#4bd98a"/>
    <path d="M20 4 L32 16 L20 36 Z" fill="#2fae67"/>
    <path d="M20 4 L20 36" stroke="#c8ffe0" stroke-width="1.6" opacity=".6"/></svg>`,
}

/**
 * The picture for a thing lying on the floor. Three callers were each writing
 * out the same ternary — battery, else a part, else the key — and the editor's
 * copy had been narrowed to batteries only, so a cog in a draft parsed, changed
 * the answer, and drew nothing at all.
 */
export const itemIcon = (kind: string) =>
  kind === 'battery' ? BATT_SVG : PART_SVG[kind] ?? KEY_SVG

/** Vines across a way that is shut for good. */
export const THICKET_SVG = `
<svg class="thicket-svg" viewBox="0 0 100 100" aria-hidden="true">
  <path d="M6 18 Q34 30 22 52 T44 92" fill="none" stroke="#3f6a45" stroke-width="9" stroke-linecap="round"/>
  <path d="M94 14 Q64 32 78 56 T56 94" fill="none" stroke="#4a7c50" stroke-width="8" stroke-linecap="round"/>
  <path d="M2 62 Q40 52 62 70 T98 66" fill="none" stroke="#35583b" stroke-width="7" stroke-linecap="round"/>
  <ellipse cx="30" cy="40" rx="9" ry="5" fill="#5c9a63" transform="rotate(-28 30 40)"/>
  <ellipse cx="70" cy="34" rx="8" ry="4.5" fill="#68a870" transform="rotate(22 70 34)"/>
  <ellipse cx="52" cy="76" rx="9" ry="5" fill="#5c9a63" transform="rotate(14 52 76)"/>
  <circle cx="20" cy="70" r="4" fill="#b07dff"/>
  <circle cx="84" cy="46" r="3.4" fill="#b07dff"/>
</svg>`

export const ICON = {
  play: '<svg viewBox="0 0 24 24"><path d="M8 4.5 L19.5 12 L8 19.5 Z"/></svg>',
  stop: '<svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/></svg>',
  retry:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20.5 3v5h-5"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M6 4.5 L14 12 L6 19.5 Z"/><rect x="16.5" y="4.5" width="3" height="15" rx="1.5"/></svg>',
}

/**
 * A span of strings across a gap. Drawn as curves rather than bars because a
 * straight line across a floor tile reads as a stripe painted on it, not as
 * something you could fall through.
 *
 * `pathLength="100"` normalises every strand to the same nominal length, so one
 * set of dash keyframes tears all four the same way regardless of how long each
 * curve actually is.
 */
export const STRANDS_SVG = `
<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
  <path pathLength="100" d="M-4 26 Q50 40 104 24"/>
  <path pathLength="100" d="M-4 44 Q50 62 104 46"/>
  <path pathLength="100" d="M-4 62 Q50 76 104 60"/>
  <path pathLength="100" d="M-4 78 Q50 90 104 80"/>
</svg>`

export const HOME_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11 L12 3 L21 11"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/></svg>'
export const BACK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4 L7 12 L15 20"/></svg>'

/**
 * World emblems. Each is a place you can see at a glance, so the menu needs no
 * names or descriptions — a child picks the house because it looks like a house.
 */
export const EMBLEM: Record<string, string> = {
  lab: `
<svg viewBox="0 0 120 120" class="emblem" aria-hidden="true">
  <g class="smoke">
    <circle cx="84" cy="26" r="5"/><circle cx="89" cy="15" r="4"/><circle cx="85" cy="5" r="3"/>
  </g>
  <rect class="e-chimney" x="76" y="26" width="14" height="24" rx="3"/>
  <path class="e-roof" d="M60 16 L106 54 H14 Z"/>
  <rect class="e-wall" x="24" y="52" width="72" height="52" rx="5"/>
  <rect class="e-door" x="52" y="72" width="20" height="32" rx="8"/>
  <circle class="e-knob" cx="67" cy="89" r="2.4"/>
  <rect class="e-win" x="32" y="62" width="16" height="16" rx="4"/>
  <rect class="e-win e-lit" x="76" y="62" width="16" height="16" rx="4"/>
  <rect class="e-step" x="18" y="102" width="84" height="8" rx="4"/>
</svg>`,
  forest: `
<svg viewBox="0 0 120 120" class="emblem" aria-hidden="true">
  <g class="e-canopy">
    <circle class="e-leaf" cx="60" cy="40" r="30"/>
    <circle class="e-leaf2" cx="36" cy="52" r="20"/>
    <circle class="e-leaf2" cx="84" cy="52" r="18"/>
  </g>
  <rect class="e-trunk" x="53" y="60" width="14" height="42" rx="4"/>
  <path class="e-branch" d="M60 74 L40 62 M60 84 L82 74" stroke-width="6" fill="none" stroke-linecap="round"/>
  <g class="e-cog2">
    <circle cx="60" cy="38" r="13" fill="none" class="e-cogring" stroke-width="8" stroke-dasharray="5 5"/>
    <circle cx="60" cy="38" r="5" class="e-knob"/>
  </g>
  <rect class="e-step" x="20" y="100" width="80" height="8" rx="4"/>
  <circle class="e-spore" cx="26" cy="28" r="3.5"/>
  <circle class="e-spore" cx="96" cy="34" r="2.8"/>
  <circle class="e-spore" cx="30" cy="80" r="3"/>
</svg>`,
  scrap: `
<svg viewBox="0 0 120 120" class="emblem" aria-hidden="true">
  <g class="e-crane">
    <path class="e-cable" d="M60 6 V34" stroke-width="4" fill="none"/>
    <path class="e-claw" d="M44 34 h32 v8 h-32 Z"/>
    <path class="e-claw" d="M46 42 L36 62 L44 64 L52 46 Z"/>
    <path class="e-claw" d="M74 42 L84 62 L76 64 L68 46 Z"/>
  </g>
  <rect class="e-heap1" x="14" y="74" width="40" height="20" rx="4"/>
  <rect class="e-heap2" x="48" y="66" width="34" height="18" rx="4"/>
  <rect class="e-heap1" x="70" y="78" width="36" height="17" rx="4"/>
  <rect class="e-heap2" x="26" y="60" width="26" height="14" rx="4"/>
  <rect class="e-step" x="12" y="94" width="96" height="9" rx="4"/>
  <circle class="e-spark" cx="34" cy="52" r="3"/>
  <circle class="e-spark" cx="94" cy="66" r="2.6"/>
</svg>`,
  moon: `
<svg viewBox="0 0 120 120" class="emblem" aria-hidden="true">
  <circle class="e-moon" cx="60" cy="62" r="42"/>
  <circle class="e-crater" cx="44" cy="46" r="13"/>
  <circle class="e-crater" cx="76" cy="72" r="10"/>
  <circle class="e-crater" cx="52" cy="82" r="7"/>
  <circle class="e-glow" cx="44" cy="46" r="5"/>
  <circle class="e-glow" cx="76" cy="72" r="4"/>
  <g class="e-span">
    <path d="M22 66 Q60 82 98 64" fill="none" stroke-width="4" stroke-linecap="round"/>
    <path d="M24 74 Q60 90 96 72" fill="none" stroke-width="3" stroke-linecap="round"/>
  </g>
  <circle class="e-earth" cx="98" cy="24" r="13"/>
</svg>`,
  test: `
<svg viewBox="0 0 120 120" class="emblem" aria-hidden="true">
  <g class="e-cog">
    <circle cx="60" cy="58" r="30" fill="none" class="e-cogring" stroke-width="15" stroke-dasharray="12 12"/>
    <circle cx="60" cy="58" r="21" fill="none" class="e-cogin" stroke-width="8"/>
  </g>
  <rect class="e-wall" x="20" y="88" width="80" height="16" rx="6"/>
  <circle class="e-lit2" cx="38" cy="96" r="4"/>
  <circle class="e-knob" cx="52" cy="96" r="4"/>
  <rect class="e-door" x="66" y="92" width="22" height="8" rx="4"/>
</svg>`,
}
