import { initialState, simulate } from '../engine/simulate'
import { chapters } from '../engine/levels'
import { playable, type Draft, type SavedRoom } from '../engine/editor'
import { canGenerate, generateFor } from '../engine/generate'
import { around, spend, type Chapter, type Dir, type FrameEvent, type Level } from '../engine/types'
import { sfx } from './audio'
import {
  loadBits, loadRooms, saveRooms, loadKit, loadOwned, loadSolved,
  saveBits, saveKit, saveOwned, saveSolved, wipeProgress,
} from './bits'
import { DEFAULT_KIT, FREE_PARTS, type Kit, type Part, type SlotId } from './parts'

/** How long each frame is held. 380ms is readable without being boring. */
export const DUR: Record<FrameEvent, number> = {
  // Pickup is held far longer than a step: it is the only moment where the world
  // changes in his favour, and the bubble ticking over is worth watching.
  // Carry is quicker than a step: he is not walking, he is being whisked along,
  // and the speed is what makes the belt feel like a free ride.
  step: 380, carry: 210, pickup: 1150, gate: 520, collapse: 480,
  bonk: 980, shrug: 1000, stranded: 1200, win: 2600,
}

/** The robot walking itself back to the start after a failure. */
const RETURN_MS = 820

export const CHAPTERS = chapters
export type Screen = 'menu' | 'rooms' | 'play' | 'store' | 'editor' | 'intro'

const reduced = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function createGame() {
  let screen = $state<Screen>('menu')
  let ci = $state(0)
  let li = $state(0)
  /**
   * The program, but each entry carries an identity. The engine only ever sees
   * the directions; the ids exist so the strip can animate a removal — Svelte
   * needs a stable key to know that slot 3 *moved* rather than that slots 3 and
   * 4 both changed contents.
   */
  let slots = $state<{ id: number; dir: Dir }[]>([])
  let nextId = 0
  let playhead = $state(-1)
  let running = $state(false)
  let returning = $state(false)
  let solved = $state<string[]>(loadSolved())
  let bits = $state(loadBits())
  /**
   * A generated room, held outside the chapter. Practice rooms are transient by
   * design: they pay a single bit, are never recorded as solved, and rolling
   * another is the whole point of the tile.
   */
  let practice = $state<Level | null>(null)

  let owned = $state<string[]>([...new Set([...FREE_PARTS, ...loadOwned()])])
  let kit = $state<Kit>({ ...DEFAULT_KIT, ...(loadKit() ?? {}) })
  let reward = $state(0)
  let timer: ReturnType<typeof setTimeout> | null = null

  /**
   * Which slot was wrong. Survives the run, because the robot takes itself home
   * and there is no reset button to press — the red ring is the only thing left
   * pointing at the mistake, so it has to outlive the playhead.
   */
  let blame = $state<number | null>(null)

  // camera
  let zoom = $state(1)
  let focus = $state<{ x: number; y: number } | null>(null)
  let snap = $state(false)

  /**
   * Rooms a child built, presented as a chapter like any other. Doing it this
   * way means the level select, the minimaps, playing, the pips and the next
   * button all work on them without knowing they were not shipped with the game.
   */
  let rooms = $state<SavedRoom[]>(loadRooms() as SavedRoom[])
  const mine = $derived({
    id: 'mine',
    name: 'My Rooms',
    blurb: 'Ones you made yourself.',
    theme: 'lab' as const,
    levels: rooms.map((r, i) => playable(r, i + 1)).filter((l) => !!l),
  })
  const allChapters = $derived([...CHAPTERS, mine])
  const chapter = $derived(allChapters[ci])

  /** Which saved room the editor is working on, and the draft it opened with. */
  let editingId = $state<string | null>(null)
  let editDraft = $state<Draft | null>(null)
  /** where the back button goes: a test play returns to the bench it came from */
  let returnTo = $state<Screen>('rooms')
  /** the world being introduced, between the rocket leaving and the next room */
  let introOf = $state<Chapter | null>(null)

  function saveRoom(room: SavedRoom) {
    const at = rooms.findIndex((r) => r.id === room.id)
    rooms = at < 0 ? [...rooms, room] : rooms.map((r) => (r.id === room.id ? room : r))
    saveRooms(rooms)
    editingId = null
    editDraft = null
    sfx.win()
    ci = allChapters.length - 1
    goTo('rooms')
  }

  function buildRoom() {
    editingId = null
    editDraft = null
    returnTo = 'rooms'
    goTo('editor')
  }

  function editRoom(id: string) {
    const room = rooms.find((r) => r.id === id)
    if (!room) return
    editingId = id
    editDraft = { theme: room.theme, name: room.name, cells: room.map.map((r) => r.split('')) }
    goTo('editor')
  }

  /**
   * Try the room you are building. The draft is kept so that coming back lands
   * on the same half-finished room rather than a fresh one — a test that costs
   * you your work is not a test anybody runs twice.
   */
  function testPlay(draft: Draft, level: Level) {
    editDraft = draft
    returnTo = 'editor'
    practice = level
    slots = []
    goTo('play')
  }

  /** A copy is a fresh room with the same map: edits to one leave the other alone. */
  function copyRoom(id: string) {
    const room = rooms.find((r) => r.id === id)
    if (!room) return
    rooms = [...rooms, { ...room, id: `mine-${Date.now()}` }]
    saveRooms(rooms)
    sfx.select()
  }

  function deleteRoom(id: string) {
    rooms = rooms.filter((r) => r.id !== id)
    saveRooms(rooms)
    sfx.back()
  }
  const level = $derived(practice ?? chapter.levels[li])
  const isPractice = $derived(!!practice)
  const program = $derived(slots.map((s) => s.dir))
  const trace = $derived(simulate(level, program))
  const start = $derived(initialState(level))
  const shown = $derived(playhead >= 0 ? trace.frames[playhead].state : start)
  const frame = $derived(playhead >= 0 ? trace.frames[playhead] : null)
  /** Set while the two of them are bolting out of the room. */
  let leaving = $state<{ dx: number; dy: number } | null>(null)
  /** The rocket climbing away. It is a departure, not a celebration. */
  let launching = $state(false)
  let nav = $state<'fwd' | 'back'>('fwd')

  /** True from the first frame of the celebration, not after it. */
  const celebrating = $derived(frame?.event === 'win')
  const won = $derived(celebrating || (!running && playhead >= 0 && trace.outcome === 'win'))
  const stepMs = $derived(returning ? RETURN_MS : frame ? DUR[frame.event] : 380)
  const lastOfChapter = $derived(li === chapter.levels.length - 1)
  /**
   * Where a finished world hands over to. Never into rooms a child built —
   * those are not a next chapter, and an empty one crashed the hand-over
   * outright when the level index landed past the end of it.
   */
  const nextChapter = $derived.by(() => {
    for (let i = ci + 1; i < allChapters.length; i++) {
      const c = allChapters[i]
      if (c.id !== 'mine' && c.levels.length) return i
    }
    return null
  })
  /**
   * Only the worlds with a generator behind them offer an endless room. Asked
   * of `generate.ts` rather than restated here — the two lists disagreeing was
   * one unchecked cast away from reading an undefined seed list.
   */
  const canPractice = $derived(canGenerate(chapter.id))

  const placed = $derived(spend(program))
  const left = (d: Dir) => (level.tray[d] ?? 0) - placed[d]
  const isSolved = (id: string) => solved.includes(id)

  function clearTimer() {
    if (timer) clearTimeout(timer)
    timer = null
  }

  function add(d: Dir) {
    if (running || playhead >= 0 || left(d) <= 0) return
    slots = [...slots, { id: nextId++, dir: d }]
    blame = null
    sfx.token(d)
  }
  function removeAt(i: number) {
    if (running || playhead >= 0 || !slots[i]) return
    slots = slots.filter((_, n) => n !== i)
    blame = null
    sfx.remove()
  }

  function reset() {
    clearTimer()
    running = false
    returning = false
    playhead = -1
    zoom = 1
    focus = null
  }

  /**
   * Screen changes carry a direction so the incoming screen can animate the
   * right way round: going deeper pushes in, coming back pulls out.
   */
  /**
   * Put the board back to rest. Called on the way *in* to a room, never on the
   * way out: writing play state while leaving forces the outgoing board and
   * console to re-render after their effects have gone inert, which is what
   * Svelte's derived_inert warning is about. Arriving initialises; departing
   * only stops the clock.
   */
  function resetPlay() {
    running = false
    returning = false
    playhead = -1
    blame = null
    zoom = 1
    focus = null
    leaving = null
    launching = false
  }

  function goTo(screenTo: Screen, dir: 'fwd' | 'back' = 'fwd') {
    nav = dir
    clearTimer()
    if (screenTo === 'play') resetPlay()
    else practice = null
    screen = screenTo
    screenTo === 'play' ? sfx.select() : sfx.back()
  }

  /** Always returns a room: the roller falls back rather than coming back empty. */
  const rollPractice = (): Level | null =>
    canGenerate(chapter.id)
      ? generateFor(chapter.id, (Math.random() * 0xffffffff) >>> 0)
      : null

  let rolling = $state(false)

  /**
   * Roll a fresh practice room in the world you are standing in.
   *
   * The roll blocks for up to about half a second on World 2, so the tile is
   * given a frame to paint its rolling state first. Without that the tap looks
   * ignored, which is worse than the wait.
   */
  async function openPractice() {
    if (rolling) return
    rolling = true
    // one frame to paint the spinner, then a beat so it is actually seen: the
    // roll itself blocks the main thread, and a spinner that appears and
    // vanishes inside it reads as a stutter rather than as work being done
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await new Promise((r) => setTimeout(r, 240))
    practice = rollPractice()
    slots = []
    rolling = false
    goTo('play')
  }

  function openChapter(i: number) {
    practice = null
    ci = i
    goTo('rooms')
    sfx.select()
  }

  /** Load a room cold — used from the level select, so no camera trickery. */
  function openLevel(i: number) {
    returnTo = 'rooms'
    practice = null
    li = i
    slots = []
    goTo('play')
  }

  /**
   * Camera cut. We are already pushed in tight on the celebrating robot, so the
   * level swap happens inside that framing with transitions off — nothing to
   * see — and then the camera pulls back to reveal the new room.
   */
  /**
   * Leaving a room. Funke bolts off in some random direction and Robby chases
   * after her; only once they are both out of shot does the level swap happen.
   * It is the only thing joining one room to the next, so it runs before the
   * camera cut rather than during it.
   */
  /**
   * Leaving a room. Robby and Funke scamper out of shot — unless there is a
   * rocket, in which case they take it, which is the only sensible way to leave
   * a launch pad. The rocket used to fly off during the celebration and then
   * the pair of them would run out of a room they had already left in it.
   */
  async function nextLevel() {
    if (leaving || launching) return
    // practice never runs out: finishing one rolls the next
    if (isPractice) {
      await dashOut()
      practice = rollPractice()
      clearTimer()
      running = false
      returning = false
      playhead = -1
      blame = null
      slots = []
      leaving = null
      zoom = 1
      focus = null
      return
    }
    const byRocket = level.goal.type === 'exit'
    await (byRocket ? launchOut() : dashOut())

    /*
     * Put the run away *before* the level changes. `playhead` is an index into
     * the trace of the level it belongs to, so the moment `li` moves it points
     * into a fresh trace that has no frames — and anything reading
     * `frames[playhead].state` throws. Nothing rendered in between while these
     * two happened in the same batch; the intro's pause is what let it show.
     */
    clearTimer()
    running = false
    returning = false
    playhead = -1
    blame = null
    slots = []

    // the end of a world hands straight over to the start of the next one
    if (lastOfChapter) {
      if (nextChapter === null) return goTo('rooms', 'back')
      ci = nextChapter
      li = 0
      // ...by way of a card saying where they have landed. Arriving in a new
      // world mid-flight, with no pause, made four worlds feel like one long one.
      await showIntro(allChapters[ci])
    } else {
      li += 1
    }

    snap = true
    await Promise.resolve()
    focus = { ...initialState(chapter.levels[li]).pos }
    zoom = 2
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        snap = false
        zoom = 1
        focus = null
        leaving = null
        launching = false
      }),
    )
  }

  /** Which way this one goes up. Three, so a world's finale is never the same
      film twice. */
  let liftVariant = $state(1)

  const INTRO_MS = 3400

  /** Hold the card for a beat, or until it is tapped away. */
  function showIntro(next: Chapter) {
    introOf = next
    screen = 'intro'
    sfx.select()
    return new Promise<void>((resolve) => {
      const done = () => {
        if (!introOf) return
        clearTimeout(timer)
        // back to the board *before* the card is torn down, or the screen sits
        // on 'intro' with nothing to show and the component reads a null chapter
        screen = 'play'
        introOf = null
        skipIntro = null
        resolve()
      }
      skipIntro = done
      const timer = setTimeout(done, reduced() ? 200 : INTRO_MS)
    })
  }
  let skipIntro = $state<(() => void) | null>(null)

  const LAUNCH_MS = 3200
  function launchOut() {
    liftVariant = 1 + Math.floor(Math.random() * 3)
    launching = true
    setTimeout(() => sfx.launch(), 500) // they are already aboard: this is the burn
    return new Promise<void>((r) => setTimeout(r, reduced() ? 150 : LAUNCH_MS))
  }

  const DASH_MS = 760
  function dashOut() {
    // the eight directions, as offsets from nowhere in particular
    const ways = around({ x: 0, y: 0 })
    const { x: dx, y: dy } = ways[Math.floor(Math.random() * ways.length)]
    leaving = { dx, dy }
    sfx.dash()
    setTimeout(() => sfx.dash(), 200) // Robby, a beat behind her
    return new Promise<void>((r) => setTimeout(r, reduced() ? 120 : DASH_MS))
  }

  /**
   * Start again from nothing. Two taps, never one: the second tap is the whole
   * safeguard, since a child who wandered onto this screen will not read a
   * dialogue box.
   */
  function resetProgress() {
    wipeProgress()
    solved = []
    bits = 0
    owned = [...FREE_PARTS]
    kit = { ...DEFAULT_KIT }
    sfx.back()
  }

  const isOwned = (p: Part) => !p.price || owned.includes(p.id)
  const canAfford = (p: Part) => isOwned(p) || bits >= p.price

  /**
   * Buying and wearing are one action. A child who has just paid for a rotor
   * wants to see the rotor, not to be asked a second question about it.
   */
  function fit(slot: SlotId, part: Part) {
    if (!canAfford(part)) return
    if (!isOwned(part)) {
      bits -= part.price
      saveBits(bits)
      owned = [...owned, part.id]
      saveOwned(owned)
    }
    kit = { ...kit, [slot]: part.id }
    saveKit(kit)
    sfx.token('up')
  }

  function award() {
    // a practice room pays a token bit and is never ticked off: it would
    // otherwise be an endless supply of three-bit rooms to farm the shop with
    if (isPractice) {
      reward = 1
      return
    }
    const first = !solved.includes(level.id)
    if (first) {
      solved = [...solved, level.id]
      saveSolved(solved)
    }
    reward = first ? 3 : 1
  }
  function collectBit() {
    bits += 1
    saveBits(bits)
  }

  /**
   * A failed run cleans up after itself: the robot drives home, the wrong slot
   * keeps its red ring, the program is untouched. One tap fixes it — there was
   * never a reset step worth making a child perform.
   */
  function goHome() {
    blame = trace.blame
    returning = true
    playhead = -1
    timer = setTimeout(() => {
      returning = false
      running = false
    }, reduced() ? 160 : RETURN_MS)
  }

  function tick() {
    const next = playhead + 1
    if (next >= trace.frames.length) {
      if (trace.outcome === 'win') running = false
      else goHome()
      return
    }
    playhead = next
    const f = trace.frames[next]
    const cue = (sfx as unknown as Record<string, (() => void) | undefined>)[f.event]
    cue ? cue() : sfx.step()
    if (f.event === 'win') {
      award()
      if (level.goal.type === 'exit') setTimeout(() => sfx.launch(), 900)
      zoom = 2 // push in on the celebration
      focus = { ...f.state.pos }
    }
    timer = setTimeout(tick, reduced() ? 240 : DUR[f.event])
  }

  function play() {
    if (won) return nextLevel()   // checked before `running`: the button says
    if (running) return reset()   // "next" mid-celebration and means it
    sfx.press()
    blame = null
    running = true
    returning = false
    playhead = -1
    tick()
  }

  function skipCelebration() {
    if (running && frame?.event === 'win') {
      clearTimer()
      running = false
    }
  }

  return {
    get screen() { return screen },
    get ci() { return ci },
    get li() { return li },
    get chapter() { return chapter },
    get chapters() { return allChapters },
    get rooms() { return rooms },
    get editingId() { return editingId },
    get editDraft() { return editDraft },
    get returnTo() { return returnTo },
    get introOf() { return introOf },
    get skipIntro() { return skipIntro },
    get level() { return level },
    get isPractice() { return isPractice },
    get rolling() { return rolling },
    get canPractice() { return canPractice },
    get lastOfChapter() { return lastOfChapter },
    get program() { return program },
    get slots() { return slots },
    get leaving() { return leaving },
    get launching() { return launching },
    get liftVariant() { return liftVariant },
    get nav() { return nav },
    get playhead() { return playhead },
    get running() { return running },
    get returning() { return returning },
    get won() { return won },
    get celebrating() { return celebrating },
    get blame() { return blame },
    get solved() { return solved },
    get bits() { return bits },
    get owned() { return owned },
    get kit() { return kit },
    get reward() { return reward },
    get trace() { return trace },
    get shown() { return shown },
    get start() { return start },
    get frame() { return frame },
    get stepMs() { return stepMs },
    get zoom() { return zoom },
    get focus() { return focus },
    get snap() { return snap },
    left, isSolved, isOwned, canAfford, fit,
    add, removeAt, play, reset, nextLevel, resetProgress,
    openChapter, openLevel, openPractice,
    saveRoom, buildRoom, editRoom, copyRoom, deleteRoom, testPlay,
    goTo, skipCelebration, collectBit,
  }
}

export type Game = ReturnType<typeof createGame>
