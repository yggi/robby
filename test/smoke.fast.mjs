import {
  $, $$, CELL_KINDS, FX_CLASSES, ITEM_KINDS, MARKS, check, checkBoardSizing,
  checkNamespacing, checkOneAnimationEach, checkPrefixedRules, raw, report,
  sweepBoard, sweepGenerated, tok, until, wait, window,
} from './harness.mjs'

/**
 * Navigate and wait for the screen to actually be there. Screens cross-fade, so
 * two exist at once mid-transition and a bare querySelector picks up the one on
 * its way out. Polling for the arrival costs a third of the fixed 700ms wait the
 * full suite uses, which is most of the difference in runtime.
 */
async function go(click, ready) {
  click()
  const ok = await until('the next screen', ready, 4000, 40)
  if (!ok) check('a screen failed to open', false)
  // Every board this suite opens feeds the sizing check at the end. Doing it
  // here rather than at call sites means a room added later is covered without
  // anybody remembering to cover it.
  sweepBoard()
  sweepGenerated()
}

/**
 * The fast suite. Everything provable without playing a level through, which
 * turns out to be most of what actually breaks: markup that vanished, styles
 * that stopped matching, a screen that no longer opens, a prop on the path.
 *
 * The rule for what belongs here: if it needs the robot to *finish* a run, it
 * belongs in smoke.full.mjs. Waiting out step frames and a 2.6s celebration is
 * what took the old suite to two minutes, and a two-minute check is one nobody
 * runs.
 */
// the app mounts on its own; wait for it rather than for a fixed delay
await until('the app to mount', () => !!$('.menu'), 5000, 30)

/**
 * Svelte's dev-only warnings are compiled out of a production build, so this
 * catches only what survives minification — but derived_inert does, and it is
 * the one that matters: it means a screen on its way out is still being asked
 * to re-render, which is how stale values reach the DOM.
 *
 * `npm run test:dev-warnings` runs the same walk against a development build,
 * where the full set is still armed.
 */
let inert = 0
const realWarn = window.console.warn
window.console.warn = (...a) => {
  if (String(a[0]).includes('derived_inert')) inert++
  else realWarn(...a)
}

// ---- the title screen ----
check('opens on the menu, not straight into a level', !!$('.menu') && !$('.board'))
// five shipped, plus the one that holds rooms you made
check('five worlds, and a place for your own', $$('.world').length === 6)
check('worlds are pictures, not names', !$('.ctext') && !$('.chapter'))
check('the Lab is a house you can recognise', !!$('.world .e-roof') && !!$('.world .e-door'))
check('the Forest is a tree you can recognise', !!$$('.world')[1].querySelector('.e-leaf'))
check('progress rings one pip per room', $$('.world')[0].querySelectorAll('.ringpip').length === 8)
check('worlds are named for screen readers', $$('.world')[0].getAttribute('aria-label') === 'The Lab')
check('Robby and Funke greet you', !!$('.hero-bot') && !!$('.hero-cat'))
check('the dedication is the subtitle', $('h1')?.nextElementSibling?.classList.contains('dedication'))
check('nothing to erase yet, so no wipe button', !$('.wipe'))
check('the purse is on the title screen', !!$('.castpurse'))
check('the cast is a way in, not just a picture', $('.cast')?.tagName === 'BUTTON')

// ---- the workshop ----
await go(() => $('.cast').click(), () => !!$('.store'))
check('Robby, Funke and the rocket are all on show', $$('.stand').length === 3)
check('each has exactly one slot', $$('.slotchip').length === 3)
check('and each idles rather than standing to attention',
  !!$('.stand .bot .breathe') && !!$('.stand .cat .catbody') && !!$('.stand .rocket'))
check('no bin is open until one is asked for', !$('.bin'))

$$('.slotchip')[1].click()
await wait(200)
check('the parts bin opens', !!$('.bin'))
check('four parts for the antenna', $$('.bay').length === 4)
check('the fitted one is marked', $$('.bay.worn').length === 1)
check('with nothing in the purse, everything paid is greyed out',
  $$('.bay.locked').length === 3)
check('and a greyed part cannot be picked', $$('.bay.locked').every((b) => b.disabled))
check('prices are shown as bits', !!$('.bay .tag.price .bit'))
$$('.bay')[2].click()
await wait(200)
check('clicking a part you cannot afford does nothing',
  !!$('.bin') && $$('.bay.worn')[0]?.getAttribute('aria-label') === 'Stalk')

$$('.slotchip')[1].click()
await wait(200)
check('the bin closes again when the slot is tapped twice', !$('.bin'))
await go(() => $('.roomsbar .ghostbtn').click(), () => !!$('.menu'))

// ---- the font travels with the file ----
check('the font is embedded', /@font-face/.test(raw) && /data:font/.test(raw))
check('only woff2, no legacy duplicate',
  (raw.match(/data:font\/woff2/g) || []).length === 2 && !/data:font\/woff;/.test(raw))
check('nothing is loaded over the network',
  !/<link[^>]+href="http/i.test(raw) && !/<script[^>]+src="http/i.test(raw))

// ---- level select ----
await go(() => $$('.world')[0].click(), () => !!$('.rooms') && !$('.menu'))
check('level select opens', !!$('.rooms'))
check('the Lab has eight rooms and an endless one', $$('.room').length === 9)
check('every authored room shows its shape', $$('.room .mini').length === 8)
check('and says what it is called', $('.room .rname')?.textContent === 'Charging Nook')
check('room tiles say what they are called', !!$('.room .rname'))
check('rooms are named for screen readers',
  $('.room')?.getAttribute('aria-label')?.startsWith('Charging Nook'))
check('snapshots are pinned up', $$('.room .pin').length === 8)
check('the level select stands in the chapter room', !!$('.rooms .labfloor'))
check('nothing solved yet', $$('.room.solved').length === 0)
check('the Lab offers an endless room as well', !!$('.room.practice'))
check('which is not dressed as a snapshot of anywhere', !$('.room.practice .pin'))

// ---- a generated room ----
await go(() => $('.room.practice').click(), () => !!$('.board') && !$('.rooms'))
check('the practice room opens', $('.gamebar h2')?.textContent === 'Practice')
check('it is a Lab room like any other', $('.scene')?.dataset.theme === 'lab')
check('with furniture scattered from its seed', $$('.clutter .prop').length > 0)
check('progress pips give way to the endless mark',
  !$('.gamebar .pips') && !!$('.gamebar .endless'))
check('Robby knows what he is after in it', !!$('.bot .think'))
const firstShape = $$('.tile').length + ':' +
  $$('.tile').map((t) => t.style.getPropertyValue('--x')).join()
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $('.room.practice').click(), () => !!$('.board') && !$('.rooms'))
check('a spinner shows while the generator works',
  /\.rolling-note\{/.test(raw) && /\.gearspin\{/.test(raw))
check('and it animates on transform alone, so it keeps turning while blocked',
  /\.gearspin\{[^}]*animation:spin/.test(raw))
check('and it is a different room the next time',
  firstShape !== $$('.tile').length + ':' + $$('.tile').map((t) => t.style.getPropertyValue('--x')).join())
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))

// ---- a room, at rest ----
await go(() => $$('.room')[0].click(), () => !!$('.board') && !$('.rooms'))
check('the board is up', !!$('.board'))
check('the Lab theme is applied', $('.scene')?.dataset.theme === 'lab')
check('the backdrop is a floor seen from above', !!$('.labfloor'))
check('nothing side-on survives in the backdrop',
  !$('.labwall') && !$('.pendant') && !$('.toolsil') && !$('.socket'))
check('the floor has rugs, cable runs and light pools',
  $$('.rug').length === 2 && !!$('.cablerun') && $$('.pool').length === 4)
check("the Charging Nook has Robby's charger in it", $$('.clutter .prop').length === 3)
check('the charger sits over where he wakes up',
  $$('.clutter .propcell').some((el) =>
    el.style.getPropertyValue('--x') === '1' && el.style.getPropertyValue('--y') === '0'))
check('one walkable path, six tiles', $$('.tile').length === 6)
check('battery present', !!$('.item.k-battery'))
check('robot starts unpowered', $('.bot')?.classList.contains('sad'))
check('Funke came along', !!$('.cat .cat-svg'))
check('Robby has idle tics', !!$('.bot .gaze') && !!$('.bot .fidget'))
check('Funke has idle tics', !!$('.cat .cathead') && !!$('.cat .eartwitch'))
check('camera starts pulled back', $('.board')?.style.getPropertyValue('--z') === '1')
// a fractional tile size drifts the sprites against the floor by up to a pixel,
// because the floors layer rasterises on its own and snaps to the grid
check('tiles are a whole number of pixels', /--c:\s*round\(down,/.test(raw))
check('with a fallback for engines without round()',
  (raw.match(/--c:\s*min\(66px/g) || []).length >= 1)
check('a home button leads back out', !!$('.gamebar .ghostbtn'))

// ---- the thought bubble, at rest ----
check('Robby says what he is after', !!$('.bot .think'))
check('the Charging Nook wants one battery', $$('.think .want').length === 1)
check('no rocket in a room without one', !$('.think .want.goal') && !$('.think .then'))
check('nothing collected yet', $$('.think .want.got').length === 0)

// ---- planning ----
check('tray has exactly one direction', $$('.token').length === 1)
check('arrows have a shaft, not just a head',
  $('.token svg path')?.getAttribute('d').split(/[A-Z]/).length > 5)
tok('right').click()
await wait(120)
check('slot filled after tap', $$('.slot.filled').length === 1)
check('plan drawn as vectors, not dots', $$('.plans .seg').length === 5)
check('vectors carry the direction colour', $('.seg')?.style.getPropertyValue('--dc') === '#3fcf5f')
check('one arrowhead, on the last segment', $$('.seg.head').length === 1)
check('token is colour-coded to match', $('.token')?.style.getPropertyValue('--dc') === '#3fcf5f')
check('play invites once the plan reaches the battery',
  $('.play')?.classList.contains('ready'))
check('the tray is spent', $('.token')?.disabled === true)

// removing a slot puts the token back
$('.slot.filled').click()
// the slot tumbles out on a transition, so it lingers in the DOM for a moment
check('the slot is gone from the strip',
  await until('the slot to drop', () => $$('.slot.filled').length === 0, 2000, 40))
check('and the token is back in the tray', $('.token')?.disabled === false)
check('the plan went with it', $$('.plans .seg').length === 0)

// ---- the Mechanical Forest, at rest ----
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $('.roomsbar .ghostbtn').click(), () => !!$('.menu') && !$('.rooms'))
await go(() => $$('.world')[1].click(), () => !!$('.rooms') && !$('.menu'))
check('the Forest has eight clearings and an endless one', $$('.room').length === 9)
check('the Forest offers practice too', !!$('.room.practice'))
await go(() => $('.room.practice').click(), () => !!$('.board') && !$('.rooms'))
check('a generated clearing opens', $('.gamebar h2')?.textContent === 'Practice')
check('in the forest, not the Lab', $('.scene')?.dataset.theme === 'forest')
check('with more than one thing to fetch',
  $$('.item.k-cog, .item.k-coil, .item.k-core').length >= 2)
check('and a passage grown over', !!$('.thicket .thicket-svg'))
check('Robby lists them all in his bubble', $$('.think .want').length >= 2)
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
check('the level select stands in the forest', !!$('.rooms .forestfloor'))
check('canopies are seen from above, not trunks from the side',
  $$('.rooms .canopy').length > 4 && !$('.rooms .labwall'))

await go(() => $$('.room')[1].click(), () => $('.scene')?.dataset.theme === 'forest')
check('forest theme applied', $('.scene')?.dataset.theme === 'forest')
check('the blocked way is drawn, not just missing', !!$('.thicket .thicket-svg'))
check('the blocked tile is dimmed rather than removed', !!$('.tile.k-blocked'))
check('no clutter outside the Lab', $$('.clutter .prop').length === 0)

await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $$('.room')[4].click(), () => $$('.item.k-cog').length === 1)
check('three parts on the floor', $$('.item.k-cog, .item.k-coil, .item.k-core').length === 3)
check('parts are distinguishable', !!$('.item.k-cog') && !!$('.item.k-coil') && !!$('.item.k-core'))
check('the bubble lists all three', $$('.think .want').length === 3)
check('and still no rocket, because there is none', !$('.think .want.goal'))

await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $$('.room')[7].click(), () => !!$('.launchpad'))
check('the finale has a rocket', !!$('.launchpad .rocket'))
check('three parts and the rocket in the bubble', $$('.think .want').length === 4)
check('an arrow says the parts come first', !!$('.think .then'))
check('the rocket is the last thing in the bubble',
  $('.think .want:last-child')?.classList.contains('goal'))
check('the rocket sits on a disc so a white hull is visible on a cream bubble',
  /\.want\.goal\{[^}]*border-radius:50%/.test(raw))
// The battery is the one non-square icon: at 100% it met its slot on height and
// pressed against the bubble's padding, which looked like it had burst out.
check('bubble icons are inset in their slot, not filling it',
  /\.want svg\{width:82%;height:82%/.test(raw))
check('and cannot escape it even if a future icon strays outside its viewBox',
  /\.want svg\{[^}]*overflow:hidden/.test(raw))
check('the rocket carries a crew, so nobody is left behind', !!$('.launchpad .crew'))
check('rocket is unarmed while the parts are still out there',
  !$('.launchpad')?.classList.contains('armed'))
check('he is not complaining until he stands on the pad',
  !$('.think')?.classList.contains('short'))

// ---- World 3, the Scrapyard ----
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $('.roomsbar .ghostbtn').click(), () => !!$('.menu') && !$('.rooms'))
await go(() => $$('.world')[2].click(), () => !!$('.rooms') && !$('.menu'))
check('the Scrapyard has eight rooms', $$('.room').length === 8)
check('the level select stands in the yard', !!$('.rooms .scrapground'))

/**
 * The thumbnail is read off the parsed world, not off the map characters. It
 * used to know four of them and drew everything else as plain path, so a yard
 * full of conveyors looked like an empty corridor. Asserted here rather than in
 * the Lab because the Lab has no machinery to draw — which is the whole point.
 */
{
  const machinery = $$('.room .mini i.m-m').length
  const lab = $$('.mini').length
  check(`the yard's thumbnails show its machinery (${machinery} marks over ${lab} rooms)`,
    lab > 0 && machinery > 0)
}

await go(() => $$('.room')[0].click(), () => $('.scene')?.dataset.theme === 'scrap')
check('Grand Tour runs belts in all four directions',
  new Set($$('.beltwrap').map((b) => b.style.getPropertyValue('--spin'))).size === 4)
check('and gives him no way to go left', !$$('.token').some((t) => t.getAttribute('aria-label') === 'left'))
check('the battery is one step left of him, and he cannot take it',
  $('.item.k-battery')?.style.getPropertyValue('--x') === '1' &&
  $('.bot')?.style.getPropertyValue('--x') === '2')

await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $$('.room')[7].click(), () => !!$('.launchpad'))
check('the finale wants three parts', $$('.think .want').length === 4)
check('and still offers no left', !$$('.token').some((t) => t.getAttribute('aria-label') === 'left'))
// 6 west along the top, 7 north up the side, 6 east along the bottom
check('the yard is one long machine: nineteen belt tiles', $$('.beltwrap').length === 19)
check('running in three of the four directions',
  new Set($$('.beltwrap').map((b) => b.style.getPropertyValue('--spin'))).size === 3)

// ---- the test world's conveyor room ----
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $('.roomsbar .ghostbtn').click(), () => !!$('.menu') && !$('.rooms'))
await go(() => $$('.world')[4].click(), () => !!$('.rooms') && !$('.menu'))
check('the test world has a room per mechanic', $$('.room').length === 9)

// ---- World 4, the Cheese Moon ----
await go(() => $('.roomsbar .ghostbtn').click(), () => !!$('.menu') && !$('.rooms'))
await go(() => $$('.world')[3].click(), () => !!$('.rooms') && !$('.menu'))
check('the moon has eight rooms', $$('.room').length === 8)
check('the level select stands on the moon', !!$('.rooms .rindground'))
check('it reads as a moon: rock and craters, not a wheel of cheese',
  $$('.rooms .hole').length === 8 && !!$('.rooms .earthrise'))
check('the cheese shows only where the ground is broken', $$('.rooms .rind').length === 1)

await go(() => $$('.room')[7].click(), () => !!$('.launchpad'))
check('the finale wants three parts', $$('.think .want').length === 4)
check('and has two spans to spend', $$('.strands').length === 2)
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $('.roomsbar .ghostbtn').click(), () => !!$('.menu') && !$('.rooms'))
await go(() => $$('.world')[4].click(), () => !!$('.rooms') && !$('.menu'))

// ---- the test world's cheese room ----
await go(() => $$('.room')[7].click(), () => $('.scene')?.dataset.theme === 'cheese')
check('cheese moon theme applied', $('.scene')?.dataset.theme === 'cheese')
check('the surface is cheese, seen from above',
  !!$('.rindground') && $$('.hole').length === 8 && $$('.bubble').length > 10)
check('four bridges of cheese string', $$('.strands').length === 4)
check('each is strung with four sagging strands',
  $$('.strands')[0].querySelectorAll('path').length === 4)
// they looked like ordinary floor until the tile below stopped being painted
check('a bridge is a gap, not a floor tile with lines on it',
  /\.tile\.k-fragile::?before\{background:#00000038/.test(raw))
check('the strands tear rather than fade when a bridge goes',
  /@keyframes snap\{[^}]*stroke-dasharray/.test(raw))
check('and they part one after another, not all together',
  /\.over\.gone \.strands path:nth-child\(2\)\{animation-delay/.test(raw))
check('every strand is normalised, so one set of keyframes tears them all',
  ($('.strands')?.innerHTML.match(/pathLength="?100/g) || []).length === 4)
check('the moon is grey, with cheese only as a highlight',
  /--floor:\s*#ccd2dc/.test(raw) && /--string:\s*#f5d24f/.test(raw))
check('both parts are out on the moon', !!$('.item.k-cog') && !!$('.item.k-coil'))
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $$('.room')[6].click(), () => $('.scene')?.dataset.theme === 'scrap')
check('scrapyard theme applied', $('.scene')?.dataset.theme === 'scrap')
check('the yard is seen from above', !!$('.scrapground') && $$('.wreck').length === 8)
check('five belt tiles are drawn', $$('.beltwrap').length === 5)
check('they all run the same way', new Set(
  $$('.beltwrap').map((b) => b.style.getPropertyValue('--spin'))).size === 1)
check('the belt is walkable, so it is part of the path', $$('.tile.k-belt').length === 5)

// the plan should run straight through the belt, with the free stretch marked
tok('down').click()
tok('right').click()
await wait(200)
check('the plan carries on through the conveyor', $$('.plans .seg').length >= 7)
check('and the free stretch is drawn differently', $$('.plans .seg.carried').length === 5)
check('the arrowhead is at the end of the whole run, belt included',
  $$('.seg.head').length === 1 && $('.seg.head')?.classList.contains('carried'))

/**
 * The one run in the fast suite, because a suite that never presses Play would
 * not notice the engine falling over. The conveyor room earns its place: it
 * proves the loop turns *and* that the belt carries him for free.
 */
$('.play').click()
check('pressing play starts the run',
  await until('the robot to move', () => $('.bot')?.classList.contains('moving'), 3000))
check('the belt carries him the length of it',
  await until('the far end of the belt',
    () => $('.bot')?.style.getPropertyValue('--x') === '7' &&
          $('.bot')?.style.getPropertyValue('--y') === '3', 9000))
check('and it cost him nothing: two instructions, seven tiles travelled',
  $$('.slot.filled').length === 2)

// ---- the editor ----
const PE = (t, x, y) =>
  new window.PointerEvent(t, { clientX: x, clientY: y, pointerId: 1, bubbles: true })

// the conveyor room above leaves us mid-play, so climb back out first
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))
await go(() => $('.roomsbar .ghostbtn').click(), () => !!$('.menu') && !$('.rooms'))
check('rooms you build are offered like any other world', $$('.world').length === 6)
await go(() => $$('.world')[5].click(), () => !!$('.rooms') && !$('.menu'))
check('My Rooms opens', $('.roomsbar h2')?.textContent === 'My Rooms')
check('with a tile that makes one rather than opening one', !!$('.room.build'))

await go(() => $('.room.build').click(), () => !!$('.editor') && !$('.rooms'))
// It used to open on a blank grid, which meant the first thing a child saw was
// a complaint about something they had not done yet.
check('the editor gets the world\'s colours like any other screen',
  /\[data-theme="lab"\]\{--bg/.test(raw) || /\[data-theme=lab\]\{--bg/.test(raw))
check('the editor opens on a room that already works',
  $('.egrid .think .par')?.textContent === '1')
check('and says so in Robby\'s own thought bubble, not in a sentence',
  !$('.editor .verdict') && !/needs \{|can't get there/.test(raw))
check('with Robby and a battery already placed',
  !!$('.egrid .bot') && !!$('.egrid .item.k-battery'))
check('and it can be saved straight away', $('.keep')?.disabled === false)
check('Robby is not a brush: there is one of him and he cannot go',
  !$$('.paint').some((p) => p.getAttribute('aria-label') === 'Robby'))
check('the room can be named', !!$('.roomname'))
check('and the tray can be tightened or loosened', $$('.trayslot').length === 4)
check('the minus stops at what the answer actually spends',
  $$('.trayslot button')[0]?.disabled === false)
check('the hero plays the room being built', $('.editor .play')?.getAttribute('aria-label') === 'try this room')
check('and saving is the smaller act beside it', !!$('.keep'))
check('the palette offers the world\'s pieces',
  $$('.paint').map((p) => p.getAttribute('aria-label')).join() ===
    'Floor,Wall,Battery,Bridge,Conveyor right')
check('drawn with the board\'s own tiles, not a set of its own',
  $$('.egrid .tile').length === 7 && !!$('.elayer.floors'))
check('the grid refuses to pan under a finger', /\.egrid\{[^}]*touch-action:none/.test(raw))

const eg = $('.egrid')
eg.setPointerCapture = () => {}
eg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 360, height: 280 })
const at = (x, y) => [x * 40 + 20, y * 40 + 20]
/** press and hold, which is what picks a thing up */
const hold = async (x, y) => {
  eg.dispatchEvent(PE('pointerdown', ...at(x, y)))
  await wait(340)
}

// ---- the gesture grammar: hold to carry, tap to paint, leave the tile to draw
//
// Four gestures and one rule between them: the tool decides whether a tap is a
// paint or a turn, and only a *hold* picks a thing up.
const tiles = () => $$('.egrid .tile').length
const tap = async (x, y) => {
  eg.dispatchEvent(PE('pointerdown', ...at(x, y)))
  eg.dispatchEvent(PE('pointerup', ...at(x, y)))
  await wait(400)
}

// a tap paints, even on a thing — the brush wins wherever it is not the brush
// that made what is under the finger
$$('.paint')[1].click() // wall
await tap(7, 3)
check('a tap paints over a thing the chosen tool did not make',
  $$('.egrid .item.k-battery').length === 0)
check('and the room says it has nothing to fetch, wordlessly',
  await until('the bubble', () => !!$('.egrid .think .want') && !$('.egrid .think .par'), 4000, 60))

// leaving the pressed tile draws a trail from it
$$('.paint')[0].click() // floor
const before = tiles()
eg.dispatchEvent(PE('pointerdown', ...at(4, 1)))
eg.dispatchEvent(PE('pointermove', ...at(5, 1)))
eg.dispatchEvent(PE('pointermove', ...at(6, 1)))
eg.dispatchEvent(PE('pointerup', ...at(6, 1)))
await wait(400)
check('and leaving the tile it started on draws a trail, the first tile included',
  tiles() === before + 3)

// the outer ring is ground like any other: it used to be an inert border, and
// nothing on screen said so
await tap(0, 0)
check('and the outermost ring paints too, where it used to be an inert border',
  tiles() === before + 4)
$('.roomsbar [aria-label="undo"]').click()
await wait(400)

// put the battery back with the object tool, which is what it is now
$$('.paint')[2].click()
await tap(7, 3)
check('the object tool puts one back', $$('.egrid .item.k-battery').length === 1)
check('and the answer comes back with it',
  await until('an answer', () => $('.egrid .think .par')?.textContent === '1', 5000, 60))

// the floor under Robby is floor: paint it and he is standing on a wall
$$('.paint')[1].click() // wall
await tap(1, 3)
check('the floor under Robby paints like any other floor', !!$('.egrid .bot'))
check('and the bubble says he is not standing on anything',
  await until('the ground mark', () => !!$('.egrid .think .want.ground'), 4000, 60))
$('.roomsbar [aria-label="undo"]').click()
await wait(400)

// carried off the edge of the room and let go: gone
$$('.paint')[2].click() // the object tool, so the battery is the tool's own
await hold(7, 3)
check('holding a thing picks it up, and it rides under the finger',
  !!$('.egrid .item.k-battery.carried'))
eg.dispatchEvent(PE('pointermove', 400, 140))
await wait(80)
check('carrying a piece past the edge offers to throw it away',
  $('.egrid')?.classList.contains('dropping'))
eg.dispatchEvent(PE('pointerup', 400, 140))
check('and letting go there removes it',
  await until('the battery to go', () => $$('.egrid .item.k-battery').length === 0, 4000, 60))

// a conveyor turns on the spot — but only under the tool that made it
$$('.paint')[4].click()
await tap(5, 3)
const spin = () => $('.egrid .beltwrap')?.style.getPropertyValue('--spin')
check('conveyors can be painted', spin() === '0deg')
await tap(5, 3)
check('and tapping one turns it', spin() === '90deg')
$$('.paint')[0].click() // floor
await tap(5, 3)
check('but under any other tool a tap paints over it instead of turning it',
  !$('.egrid .beltwrap'))

// a tool tile that is already chosen cycles what it lays down
$$('.paint')[4].click()
check('the conveyor tool starts pointing the way it paints',
  $$('.paint')[4].getAttribute('aria-label') === 'Conveyor right')
$$('.paint')[4].click()
await wait(80)
check('and tapping it again turns it, so a belt is aimed before it is painted',
  $$('.paint')[4].getAttribute('aria-label') === 'Conveyor down')
$$('.paint')[2].click()
$$('.paint')[2].click()
await wait(80)
check('the object tool walks the parts the same way',
  $$('.paint')[2].getAttribute('aria-label') === 'Cog')
for (let i = 0; i < 3; i++) $$('.paint')[2].click()
await wait(80)
check('and out to the rocket, which is how a built room asks for an errand',
  $$('.paint')[2].getAttribute('aria-label') === 'Rocket')
await tap(4, 3)
check('so a rocket can be placed in a room a child built', !!$('.egrid .launchpad'))
$('.roomsbar [aria-label="undo"]').click()
await wait(400)

// round the ring to the battery again, put it back, and save
$$('.paint')[2].click()
await wait(80)
check('and round again to the battery', $$('.paint')[2].getAttribute('aria-label') === 'Battery')
await tap(7, 3)
check('the solver answers as you build',
  await until('an answer', () => !!$('.egrid .think .par'), 5000, 60))
check('and draws the answer on the room', $$('.routedot').length > 0)

$('.keep').click()
await until('saved', () => !!$('.rooms') && !$('.editor'), 5000, 60)
check('saving puts it in My Rooms', $$('.room.mine').length === 1)
check('rooms carry their name on the tile', !!$('.room.mine .rname'))
check('and the rest is folded behind one mark', !!$('.room.mine .dots'))
$('.room.mine .dots').click()
await wait(150)
check('which opens edit, copy and delete', $$('.dropdown button').length === 3)
$$('.dropdown button')[1].click()
await wait(300)
check('copying leaves you with two', $$('.room.mine').length === 2)
$('.room.mine .dots').click()
await wait(150)
$$('.dropdown button')[2].click()
await wait(300)
check('and deleting takes one away', $$('.room.mine').length === 1)

await go(() => $('.room.mine .playface').click(), () => !!$('.board') && !$('.rooms'))
check('a room you built plays like any other', $$('.tile').length > 0)
check('with a tray worked out from the answer', $$('.token').length >= 1)
await go(() => $('.gamebar .ghostbtn').click(), () => !!$('.rooms') && !$('.board'))

/**
 * Two @keyframes with the same name is legal CSS and silently disastrous: the
 * later one wins everywhere, so an unrelated rule quietly hijacks an animation.
 * Robby's treads spent a while running the practice-tile dice animation this
 * way — a 5.5s tumble crushed into 280ms, twenty times a second.
 */
const frames = [...raw.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
const dupes = frames.filter((n, i) => frames.indexOf(n) !== i)
check(`no two animations share a name (${frames.length} defined)`, dupes.length === 0)
if (dupes.length) console.log('     duplicated:', [...new Set(dupes)].join(', '))

/**
 * Nothing in the console may clip: the arrow tokens carry a count badge that
 * sits deliberately outside their corner. A rule written for the store's parts
 * bin as a bare `.tray` once matched the console's tray too, and a container
 * that clips one axis clips the other — which sliced every badge.
 */
const clipRules = [...raw.matchAll(/(^|})([^{}@]*)\{([^{}]*)\}/g)]
  .filter((m) => /overflow(-x|-y)?:\s*(auto|hidden|scroll)/.test(m[3]))
  .flatMap((m) => m[2].split(','))
  .map((sel) => sel.trim())
check('no clipping rule targets the console tray or its tokens',
  !clipRules.some((sel) => /^\.(tray|token|controls|console|strip|slot)$/.test(sel)))

/**
 * Two rules with an identical selector list. Legal CSS, and occasionally what
 * you want, but here it has three times meant an old block survived an edit and
 * — being later — silently overrode the replacement. The cheese moon shipped a
 * whole stale palette this way.
 */
// the stylesheet only: the bundle below it is full of things that look like
// selectors to a regex and are not
const sheet = raw.slice(raw.search(/<style[^>]*>/), raw.indexOf('</style>'))
const rules = [...sheet.matchAll(/(?:^|[{}])\s*([.#][^{}@]{2,90}?)\{/g)]
  .map((m) => m[1].replace(/\s+/g, ' ').trim())
  .filter((sel) => !sel.includes(':'))
const repeated = [...new Set(rules.filter((sel, i) => rules.indexOf(sel) !== i))]
// a check that finds nothing is worse than no check
check('the stylesheet was actually found', rules.length > 200)
check(`no selector is defined twice (${rules.length} rules)`, repeated.length === 0)
if (repeated.length) console.log('     defined twice:', repeated.slice(0, 8).join(' | '))

/**
 * A world is three things in three files: an entry in THEMES, a backdrop in
 * DECOR, and a block of colours in the stylesheet. The first two are held
 * together by the type system — DECOR is keyed by Theme and will not compile
 * without every backdrop — but nothing forces the third, so it is checked here.
 */
// the minifier drops the quotes, so match with or without them
const themes = [...raw.matchAll(/data-theme=["']?([\w-]+)["']?\]/g)].map((m) => m[1])
const styled = new Set(themes)
const declared = [
  'lab', 'forest', 'scrap', 'cheese', 'house', 'garden', 'city', 'factory', 'ship',
]
const unstyled = declared.filter((t) => !styled.has(t))
check(`every world has a palette (${declared.length} worlds)`, unstyled.length === 0)
if (unstyled.length) console.log('     no palette for:', unstyled.join(', '))

/**
 * Item and cell kinds become element classes — `<div class="item cog">`,
 * `<div class="tile blocked">` — so any bare rule on one of those names lands on
 * the board whether it was meant to or not. A loading spinner called `.cog` did
 * exactly that: it turned the cog part into a 22px spinning disc in the wrong
 * place, which is why only levels with parts looked broken.
 *
 * The rule: those names must always be qualified.
 */
// The list is read out of `src/engine/types.ts` rather than re-typed here.
// It *was* re-typed, and `oneway` was missing from it for as long as the
// mechanic existed, so a bare `.oneway {}` was the one board kind nothing here
// would have caught — the guard against transcription errors, containing one.
//
// This is now the net rather than the fix: since `src/view/css.ts`, no kind
// reaches the DOM unprefixed, so `.cog {}` cannot land on the board even if
// somebody writes it. It costs nothing and it still catches the writing.
const KINDS = [...ITEM_KINDS, ...CELL_KINDS]
const bare = KINDS.filter((k) => new RegExp(`(^|[,{}])\\.${k}[,{]`).test(raw))
check(`board kinds are never styled bare (${KINDS.length} checked)`, bare.length === 0)
if (bare.length) console.log('     bare rules for:', bare.join(', '))

// Two of anything on one page were breathing and blinking in lockstep, which
// reads as one animation playing twice rather than as two creatures.
check('every idle clock is offset from every other',
  /animation-delay:calc\(var\(--tic/.test(raw))
check('and the board hands one to each of them', /--tic:/.test(raw))
check('the rocket idles loaded before it ever goes', /@keyframes standby/.test(raw))
// it used to be centred in its tile with a ring round its middle, which read
// as sunk into the floor rather than standing on anything
// note the anchor: `.stand .launchpad` in the workshop is still a grid, and an
// unanchored match finds it as a substring
check('the rocket is placed against the tile, not an auto-sized grid row',
  /\.launchpad \.rocket\{[^}]*position:absolute/.test(raw) &&
  /[,}]\.launchpad\{z-index:3;pointer-events:none\}/.test(raw))
check('and the pad is a plate under it', /\.launchpad \.pad\{[^}]*bottom:7%/.test(raw))
// a quarter of the sprite below the fins is flame, so bottom-aligning the box
// left the ship hovering above the plate
check('the fins are pulled down onto it past the flame overhang',
  /\.launchpad \.rocket\{[^}]*bottom:-6%/.test(raw))
check('and goes up three different ways',
  /@keyframes liftoff2/.test(raw) && /@keyframes liftoff3/.test(raw))

check('the tread is a scrolling belt, not a hopping plate',
  /\.treadbelt\{/.test(raw) && /@keyframes treadscroll/.test(raw))

// over every board this suite opened, not just whichever screen it ended on
checkBoardSizing()

/**
 * The namespace guards. `src/view/css.ts` makes a collision impossible to
 * write; these three make sure it stays that way — that everything generated
 * still goes through it, that no rule names a class nothing writes and nothing
 * is written with no rule to land on, and that no element is ever claimed by
 * two animations at once. → `doc/design/testing/guards.md`
 */
checkNamespacing([...CELL_KINDS, ...ITEM_KINDS], MARKS)
checkPrefixedRules([
  ...CELL_KINDS.map((k) => `k-${k}`),
  ...ITEM_KINDS.map((k) => `k-${k}`),
  ...MARKS.map((m) => `m-${m}`),
  ...FX_CLASSES,
])
checkOneAnimationEach()

check('no screen is re-rendered after it has gone', inert === 0)

report('FAST')
