import {
  $, $$, D, NAV, check, checkBoardSizing, checkOneAnimationEach, errors, raw, report,
  sweepBoard, sweepGenerated, tok, until, wait,
} from './harness.mjs'

/**
 * The full behavioural suite: plays levels through, watches celebrations,
 * crosses between worlds. Takes minutes. Run it before shipping, not on every
 * keystroke — `npm test` runs the fast suite instead.
 */
await wait(NAV)

// ---- main menu ----
check('opens on the menu, not straight into a level', !!$('.menu') && !$('.board'))
// five shipped, plus the one that holds rooms you made
check('five worlds, and a place for your own', $$('.world').length === 6)
check('worlds are pictures, not names', !$('.ctext') && !$('.chapter'))
check('the Lab is a house you can recognise', !!$('.world .e-roof') && !!$('.world .e-door'))
check('progress rings one pip per room', $$('.world')[0].querySelectorAll('.ringpip').length === 8)
check('worlds are still named for screen readers',
  $$('.world')[0].getAttribute('aria-label') === 'The Lab')
check('Robby and Funke greet you', !!$('.hero-bot') && !!$('.hero-cat'))
check('progress rings each emblem', $$('.world')[0]?.querySelectorAll('.ringpip').length === 8)
check('screens know which way you went',
  /@keyframes screenIn/.test(raw) && /@keyframes screenBack/.test(raw))
check('the dedication is the subtitle, right under the title',
  $('h1')?.nextElementSibling?.classList.contains('dedication'))
check('the font travels with the file', /@font-face/.test(raw) && /data:font/.test(raw))
check('only woff2 is embedded, no legacy duplicate',
  (raw.match(/data:font\/woff2/g) || []).length === 2 && !/data:font\/woff;/.test(raw))

// ---- level select ----
$$('.world')[0].click()
await wait(NAV)
check('level select opens', !!$('.rooms'))
check('going deeper animates forward', !$('.rooms')?.classList.contains('back'))
check('screens stack so they can cross-fade', $$('.screen').length >= 1)
check('the Lab has eight rooms and an endless one', $$('.room').length === 9)
check('every authored room shows its shape', $$('.room .mini').length === 8)
check('room tiles say what they are called', !!$('.room .rname'))
check('rooms are still named for screen readers',
  $('.room')?.getAttribute('aria-label')?.startsWith('Charging Nook'))
check('the level select stands in the chapter room', !!$('.rooms .labfloor'))
check('snapshots are pinned up', $$('.room .pin').length === 8)
check('nothing solved yet', $$('.room.solved').length === 0)

// ---- into the first room ----
$$('.room')[0].click()
await wait(NAV)
check('the board is up', !!$('.board'))
check('the Lab theme is applied', $('.scene')?.dataset.theme === 'lab')
check("the room is furnished with Robby's things", $$('.clutter .prop').length > 0)
check('the Lab backdrop is a floor seen from above', !!$('.labfloor'))
check('nothing side-on survives in the backdrop',
  !$('.labwall') && !$('.pendant') && !$('.toolsil') && !$('.socket'))
check('the floor has rugs, cable runs and light pools',
  $$('.rug').length === 2 && !!$('.cablerun') && $$('.pool').length === 4)
check('clutter sits only in wall cells', $$('.clutter .propcell').length === $$('.clutter .prop').length)
check('one walkable path, six tiles', $$('.tile').length === 6)
check('tray has exactly one direction', $$('.token').length === 1)
check('Funke came along', !!$('.cat .cat-svg'))
check('Robby has idle tics', !!$('.bot .gaze') && !!$('.bot .fidget'))
check('Funke has idle tics', !!$('.cat .cathead') && !!$('.cat .eartwitch'))
check('a home button leads back out', !!$('.gamebar .ghostbtn'))
check('camera starts pulled back', $('.board')?.style.getPropertyValue('--z') === '1')

// ---- Funke wanders while nothing is happening ----
const catAt = () =>
  $('.cat').style.getPropertyValue('--x') + ',' + $('.cat').style.getPropertyValue('--y')
const seen = new Set([catAt()])
for (let i = 0; i < 24; i++) {
  await wait(NAV)
  seen.add(catAt())
}
check(`Funke strolls about while idle (${seen.size} spots)`, seen.size > 1)
check('she never wanders into a wall',
  [...seen].every((p) => {
    const [x, y] = p.split(',').map(Number)
    return $$('.tile').some(
      (t) => +t.style.getPropertyValue('--x') === x && +t.style.getPropertyValue('--y') === y,
    )
  }))

// ---- plan and run ----
tok('right').click()
await wait(60)
check('plan drawn as vectors, not dots', $$('.plans .seg').length === 5)
check('vectors carry the direction colour', $('.seg')?.style.getPropertyValue('--dc') === '#3fcf5f')
check('one arrowhead, on the last segment', $$('.seg.head').length === 1)
check('token is colour-coded to match', $('.token')?.style.getPropertyValue('--dc') === '#3fcf5f')
check('play invites once the plan reaches the battery', $('.play')?.classList.contains('ready'))


$('.play').click()
await wait(120)
check('she comes back to his side for the off', catAt() === '1,1')
// Wait for the celebration to *start* rather than computing when it should:
// the run is four step frames and a pickup, and a fixed sum lands either side
// of the moment on a slow machine.
const cheering = await until('the celebration', () => $('.bot')?.classList.contains('cheer'))
check('the run reaches the battery', cheering)
check('hero reads next while the confetti is still falling', $('.play')?.classList.contains('next'))
check('Robby celebrates', $('.bot')?.classList.contains('cheer'))
check('Funke celebrates as well', $('.cat')?.classList.contains('cheer'))
check('the celebration actually throws confetti', $$('.fx-confetti').length > 20)
/**
 * The real rule behind the dot-on-his-face bug: `.fx` paints above the robot,
 * so any effect anchored to *his* tile is drawn over him. Rings and masked
 * shapes are fine — they are hollow in the middle. A coloured particle is not.
 * This checks the invariant rather than any one particle's start radius, which
 * is what I got wrong twice.
 */
const onHisTile = $$('.fx').filter((el) => el.style.getPropertyValue('--x') !== '')
const solidOnHim = onHisTile.flatMap((el) =>
  [...el.children].filter((c) => c.style.background || c.style.backgroundColor),
)
check('nothing solid is drawn on top of Robby during the celebration',
  solidOnHim.length === 0)
check('nothing anchored to his tile starts at its centre',
  // Hollow shapes (rings) are fine at the centre. Solid particles are not, and
  // must therefore declare an offset to travel from. Checking for the offset
  // rather than for a list of allowed classes means a new particle type cannot
  // quietly reintroduce the dot-on-his-face bug.
  onHisTile.every((el) => [...el.children].every((c) =>
    c.classList.contains('fx-shock') ||
    c.classList.contains('fx-pickring') ||
    (c.style.getPropertyValue('--dx') !== '' && c.style.getPropertyValue('--dy') !== ''))))
check('Funke does not upstage Robby', !$('.cat')?.classList.contains('star'))
// she used to celebrate standing inside him, which laid her tail across his face
check('Funke never celebrates on top of Robby',
  $('.cat')?.style.getPropertyValue('--x') !== $('.bot')?.style.getPropertyValue('--x') ||
  $('.cat')?.style.getPropertyValue('--y') !== $('.bot')?.style.getPropertyValue('--y'))
check('she celebrates from a real tile, not a wall', $$('.tile').some(
  (t) => t.style.getPropertyValue('--x') === $('.cat')?.style.getPropertyValue('--x') &&
         t.style.getPropertyValue('--y') === $('.cat')?.style.getPropertyValue('--y')))
check('both are running a numbered flourish',
  /\bv[1-4]\b/.test($('.bot')?.className ?? '') && /\bv[1-4]\b/.test($('.cat')?.className ?? ''))
check('robot powered up', $('.bot')?.classList.contains('on'))
check('camera pushed in on the celebration', $('.board')?.style.getPropertyValue('--z') === '2')
await wait(D.win)
check('bits awarded for a first solve', $('.purse em')?.textContent === '3')

check('the award pays out exactly once', $$('.bit:not(.static)').length === 0)

// leaving a room: Funke bolts, Robby chases, and only then does it swap
$('.play').click()
await wait(200)
check('Funke dashes out of the room', $('.cat')?.classList.contains('dashing'))
check('Robby chases after her', $('.bot')?.classList.contains('chasing'))
check('they leave in the same direction',
  $('.cat')?.style.getPropertyValue('--lx') === $('.bot')?.style.getPropertyValue('--lx') &&
  $('.cat')?.style.getPropertyValue('--ly') === $('.bot')?.style.getPropertyValue('--ly'))
check('and it is a real direction, not standing still',
  $('.cat')?.style.getPropertyValue('--lx') !== '0' ||
  $('.cat')?.style.getPropertyValue('--ly') !== '0')
await wait(D.dash + 400)
check('advanced to the Hallway', $$('.pip')[1]?.classList.contains('now'))
check('camera pulled back out', $('.board')?.style.getPropertyValue('--z') === '1')
check('program cleared on the new room', $$('.slot.filled').length === 0)

// ---- failure cleans up after itself ----
const home = $('.bot')?.style.getPropertyValue('--x')
tok('down').click()
await wait(60)
$('.play').click()
const wentHome = await until(
  'the robot to drive itself home',
  () =>
    $$('.slot.blame').length === 1 &&
    $('.bot')?.style.getPropertyValue('--x') === home &&
    // `running` stays true through the drive home, and the strip ignores taps
    // while it is set — so waiting only for the robot's position let the next
    // step click a slot that could not respond
    !$('.play')?.classList.contains('running'),
)
check('the failed run cleaned up after itself', wentHome)
check('no retry button — there is nothing left for one to do',
  !$('.play')?.classList.contains('retry'))
check('robot drove itself home', $('.bot')?.style.getPropertyValue('--x') === home)
check('the wrong slot is ringed, not recoloured', $$('.slot.blame').length === 1)
check('the blamed slot keeps its own direction colour',
  $('.slot.blame')?.style.getPropertyValue('--dc') === '#ffd12e')
check('the program was not cleared', $$('.slot.filled').length === 1)
$('.slot.blame').click()
// the slot falls out of the strip before it leaves the DOM
await wait(500)
check('blame clears when the program is edited', $$('.slot.blame').length === 0)
check('the dropped slot is gone from the strip', $$('.slot.filled').length === 0)

// ---- removing from the middle of the strip ----
// The survivors have to be the right ones, which is what the slot ids are for:
// without them Svelte reshuffles slot *contents* and the wrong arrow vanishes.
$$('.pip')[6].click()
await wait(NAV)
const labels = () => $$('.slot.filled').map((b) => b.getAttribute('aria-label'))
;['right', 'down', 'right'].forEach((d) => tok(d)?.click())
await wait(120)
check('three arrows placed', labels().join(' ') === 'remove right remove down remove right')
$$('.slot.filled')[1].click()
await wait(500)
check('the middle arrow is the one that left', labels().join(' ') === 'remove right remove right')

// ---- back out to the level select ----
$('.gamebar .ghostbtn').click()
await wait(NAV)
check('the home button returns to the rooms', !!$('.rooms') && !$('.board'))
check('the solved room is ticked', $$('.room.solved').length === 1)

/**
 * Spending them. This lives here rather than in the fast suite because the only
 * way to have bits is to have earned them: jsdom refuses localStorage on an
 * opaque origin, so the game runs memory-only and there is no seeding it.
 */
$('.roomsbar .ghostbtn').click()
await wait(NAV)
$('.cast').click()
await wait(NAV)
check('the workshop opens from the title screen', !!$('.store'))
check('three bits reach it', $('.store .purse em')?.textContent === '3')

$$('.slotchip')[0].click() // Funke's tail; the Brush costs exactly 3
await wait(220)
check('the part within reach is not greyed out', !$$('.bay')[1]?.disabled)
check('the two dearer ones still are', $$('.bay.locked').length === 2)

const tailBefore = $('.stand .cat .tail')?.innerHTML
$$('.bay')[1].click()
await wait(500)
check('buying closes the bin', !$('.bin'))
check('and spends the bits', $('.store .purse em')?.textContent === '0')
check('the new tail is on the cat in the workshop',
  $('.stand .cat .tail')?.innerHTML !== tailBefore)
check('it is marked as worn if you look again',
  ($$('.slotchip')[0].click(), await wait(220), $$('.bay.worn')[0]?.getAttribute('aria-label')) ===
    'Brush')
check('and what was just bought is no longer for sale', $$('.bay.locked').length === 2)
$$('.slotchip')[0].click()
await wait(220)

$('.roomsbar .ghostbtn').click()
await wait(NAV)
check('Funke wears it on the title screen', $('.hero-cat .tail')?.innerHTML.includes('3fcf5f'))
$('.world').click()
await wait(NAV)
$$('.room')[0].click()
await wait(NAV)
check('and into the level with her', $('.cat .tail')?.innerHTML.includes('3fcf5f'))
$('.gamebar .ghostbtn').click()
await wait(NAV)

// ---- the Test World, and the rocket ----
$('.roomsbar .ghostbtn').click()
await wait(NAV)
check('back arrow returns to the menu', !!$('.menu'))
check('backing out animates the other way', $('.menu')?.classList.contains('back'))
$$('.world')[4].click()
await wait(NAV)
check('the test world lists one room per mechanic', $$('.room').length === 9)
$$('.room')[8].click()
await wait(NAV)
check('rocket room is the ship theme', $('.scene')?.dataset.theme === 'ship')
sweepBoard() // the rocket and its pad, the elements the check exists for
check('the rocket is on the board', !!$('.launchpad .rocket'))
check('rocket is unarmed while the battery is still out there',
  !$('.launchpad')?.classList.contains('armed'))
check('the rocket carries a crew, so nobody is left behind', !!$('.launchpad .crew'))
check('no clutter outside the Lab', $$('.clutter .prop').length === 0)

;['right', 'down', 'left'].forEach((d) => tok(d)?.click())
await wait(80)
$('.play').click()
await wait(12 * 500 + 900)
check('the pad armed once the battery was aboard', $('.launchpad')?.classList.contains('armed'))
// Boarding belongs to the celebration; the departure waits to be asked for.
check('they climb aboard as the cheering ends',
  await until('the crew to board', () => $('.bot')?.classList.contains('boarding'), 4000, 60))
// she was still waiting for liftoff while he climbed in, which left her stood
// on the pad watching it go
check('and Funke climbs in when he does, not when it goes',
  $('.cat')?.classList.contains('boarding'))
check('and the rocket then sits there loaded',
  $('.launchpad')?.classList.contains('loaded'))
// The launch is the departure, not the celebration: they stand on the pad and
// cheer, and only fly when the player asks for the next room.
check('winning does not launch the rocket by itself',
  !$('.launchpad')?.classList.contains('launch'))

$('.play').click() // Next
await wait(320)
check('pressing next launches the rocket', $('.launchpad')?.classList.contains('launch'))
check('the pad shakes under the burn', $('.board')?.classList.contains('liftoff'))
check('and it throws up an exhaust cloud', $$('.fx-plume').length > 10)
check('it does not go up the same way twice',
  /lift[123]/.test($('.launchpad')?.className ?? ''))
await wait(3400)
// The Test World is the last chapter, so there is nowhere to hand over to and
// the rocket sets them down back at the level select.
check('the last world hands back to the rooms', !!$('.rooms'))
// The launch state used to survive this hand-back, leaving every later room
// rendering mid-departure.
$$('.room')[0].click()
await wait(NAV)
check('the rocket state does not leak into the next room',
  !$('.launchpad')?.classList.contains('launch') && !$('.bot')?.classList.contains('boarding'))
$('.gamebar .ghostbtn').click()
await wait(NAV)

/**
 * Twelve celebrations in the Garage, which is roomy enough for Funke to run
 * about in. Checks the pair of things that can go wrong: that the flourish is
 * actually varying, and that she never once ends up standing inside Robby or
 * out on a wall while she does it.
 */
$('.roomsbar .ghostbtn').click()
await wait(NAV)
$$('.world')[0].click()
await wait(NAV)
const bots = new Set()
const cats = new Set()
let overlaps = 0
let offPath = 0
let samples = 0
const RUNS = Number(process.env.SMOKE_CELEBRATIONS ?? 12)
for (let run = 0; run < RUNS; run++) {
  $$('.room')[5].click()
  await wait(NAV)
  ;['right', 'down', 'right', 'up'].forEach((d) => tok(d)?.click())
  await wait(60)
  $('.play').click()
  await until('this celebration', () => $('.bot')?.classList.contains('cheer'), 12000)
  bots.add(($('.bot').className.match(/\bv[1-4]\b/) || [''])[0])
  cats.add(($('.cat').className.match(/\bv[1-4]\b/) || [''])[0])
  for (let i = 0; i < 3; i++) {
    await wait(320)
    samples++
    if (catAt() === $('.bot').style.getPropertyValue('--x') + ',' +
        $('.bot').style.getPropertyValue('--y')) overlaps++
    const [cx, cy] = catAt().split(',')
    if (!$$('.tile').some((t) => t.style.getPropertyValue('--x') === cx &&
        t.style.getPropertyValue('--y') === cy)) offPath++
  }
  $('.gamebar .ghostbtn').click()
  await wait(NAV)
}
// 12 draws from 4 variants. At 8 draws this failed for real: P(fewer than 3
// distinct) is 2.3% per check and there are two of them, so ~1 run in 21 went
// red on nothing. 12 draws puts it at 0.15% each, ~1 in 340 overall — the cost
// is about 35 seconds in a suite that is already opt-in.
check(`Robby's flourish varies (${[...bots].sort().join(' ')})`, bots.size >= 3)
check(`Funke's flourish varies (${[...cats].sort().join(' ')})`, cats.size >= 3)
check(`she never celebrates inside Robby (${samples} samples)`, overlaps === 0)
check('she never celebrates out on a wall', offPath === 0)

// ---- finishing a world hands straight over to the next one ----
// index 7 is the eighth room; index 8 is the endless one that follows it
$$('.room')[7].click()
await wait(NAV)
sweepBoard()
check('the Lab ends at a rocket', !!$('.launchpad .rocket'))
;['right', 'down', 'down', 'up', 'right', 'up'].forEach((d) => tok(d)?.click())
await wait(80)
$('.play').click()
const flownIn = await until('the Lab finale to be won',
  () => $('.play')?.classList.contains('next'), 16000)
check('the Lab finale is winnable', flownIn)
$('.play').click() // Next: they fly out
await wait(400)
check('leaving the Lab means taking the rocket', $('.launchpad')?.classList.contains('launch'))
// the rocket now hands over by way of a card saying where they have landed
check('a card announces the world they are arriving in',
  await until('the arrival card', () => !!$('.intro'), 8000, 100))
/*
 * The card holds still for three seconds, which is long enough for anything
 * half-torn-down to be caught rendering. `playhead` used to survive the level
 * change and index into a trace that no longer had that many frames, and the
 * pause is what made it visible — nothing had rendered between the two before.
 */
check('and nothing throws while it sits there', errors.length === 0)
check('and it names it', $('.intro h1')?.textContent === 'Mechanical Forest')
$('.intro').click() // tap it away rather than waiting out the beat
await until('the next world', () => !!$('.board') && !$('.intro'), 8000, 120)
check('and the rocket sets them down in the next world',
  $('.scene')?.dataset.theme === 'forest')
check('at its first clearing', $$('.pip')[0]?.classList.contains('now'))
$('.gamebar .ghostbtn').click()
await wait(NAV)

// ---- World 2: the Mechanical Forest ----
// climb out to the menu from wherever the rocket left us, then in again
if ($('.board')) { $('.gamebar .ghostbtn').click(); await until('rooms', () => !!$('.rooms'), 4000, 60) }
if ($('.rooms')) { $('.roomsbar .ghostbtn').click(); await until('menu', () => !!$('.menu'), 4000, 60) }
$$('.world')[1].click()
await until('the forest', () => !!$('.rooms') && !$('.menu'), 4000, 60)
check('the Forest has eight clearings and an endless one', $$('.room').length === 9)
check('the level select stands in the forest', !!$('.rooms .forestfloor'))
check('canopies are seen from above, not trunks from the side',
  $$('.rooms .canopy').length > 4 && !$('.rooms .labwall'))

$$('.room')[1].click()   // Bramble: a way through that is shut for good
await wait(250)
check('forest theme applied', $('.scene')?.dataset.theme === 'forest')
check('the blocked way is drawn, not just missing', !!$('.thicket .thicket-svg'))
check('the blocked tile is dimmed rather than removed', !!$('.tile.k-blocked'))
check('a blocked tile is never walkable', $$('.tile.k-blocked').every((t) => {
  const x = t.style.getPropertyValue('--x'), y = t.style.getPropertyValue('--y')
  return !$$('.plans .vec').some(
    (v) => v.style.getPropertyValue('--x') === x && v.style.getPropertyValue('--y') === y)
}))

$('.gamebar .ghostbtn').click(); await wait(200)
$$('.room')[4].click()   // Crossroads: three parts, any order
await wait(250)
sweepBoard() // a room carrying every part kind at once
sweepGenerated()
check('three parts on the floor', $$('.item.k-cog, .item.k-coil, .item.k-core').length === 3)
check('parts are distinguishable', !!$('.item.k-cog') && !!$('.item.k-coil') && !!$('.item.k-core'))

$('.gamebar .ghostbtn').click(); await wait(200)
// index 7, not 8: the endless room is appended after the eight authored ones
$$('.room')[7].click()   // Clearing: the finale
await wait(250)
check('the finale has a rocket', !!$('.launchpad .rocket'))
check('Robby thinks about what he needs', !!$('.bot .think'))
check('three parts and the rocket in the bubble', $$('.think .want').length === 4)
check('an arrow says the parts come first', !!$('.think .then'))
check('the rocket is the last thing in the bubble',
  $('.think .want:last-child')?.classList.contains('goal'))
check('nothing collected yet', $$('.think .want.got').length === 0)
check('he is not complaining until he stands on the pad',
  !$('.think')?.classList.contains('short'))

// Walk him onto the pad with only two of the three parts. Five tokens takes
// him along the top and straight down onto the rocket, leaving the core behind.
;['right', 'right', 'right', 'down', 'down'].forEach((d) => tok(d)?.click())
await wait(80)
$('.play').click()
// poll rather than guess the arrival time: the walk is nine tiles of mixed
// step and pickup frames, and a fixed wait lands either side of the moment
let refused = false
let launched = false
let sawRing = false
let sawFly = false
for (let i = 0; i < 48 && !refused; i++) {
  await wait(110)
  refused = !!$('.think')?.classList.contains('short')
  launched ||= !!$('.launchpad')?.classList.contains('launch')
  sawRing ||= !!$('.fx-pickring')
  sawFly ||= !!$('.item.taken')
}
check('a part picked up ticks off in the bubble', $$('.think .want.got').length >= 1)
check('and the part played its pickup animation', sawRing && sawFly)
check('the rocket refuses when it is short', refused)
check('and it did not launch', !launched)
await wait(D.ret + 900)

// over every board this suite opened, not just whichever screen it ended on
checkBoardSizing()
// The fast suite runs this too, but only ever over the source half: particles
// are throwaway DOM and it never plays a level far enough to see one. Here the
// celebration has actually happened, so the confetti is real.
checkOneAnimationEach()

report('SMOKE')
