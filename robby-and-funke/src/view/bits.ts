/**
 * Bits: the reward currency. Each one is a coin that flips between 0 and 1,
 * which is the only joke in the game and also the only place a digit appears.
 * They arc out of the robot and land in the console counter.
 */
export function flyBits(from: DOMRect, n: number, onArrive: () => void) {
  const target = document.getElementById('bits')?.getBoundingClientRect()
  if (!target) return
  const x1 = target.left + target.width / 2
  const y1 = target.top + target.height / 2
  const x0 = from.left + from.width / 2
  const y0 = from.top + from.height / 2

  for (let i = 0; i < n; i++) {
    const coin = document.createElement('div')
    coin.className = 'bit'
    coin.innerHTML = '<span class="face"><b>0</b><b>1</b></span>'
    document.body.appendChild(coin)

    // Web Animations gives us arbitrary screen-space coordinates; without it
    // the bit still counts, it just doesn't fly.
    if (typeof coin.animate !== 'function') {
      setTimeout(() => { coin.remove(); onArrive() }, 300 + i * 110)
      continue
    }

    const spread = (i - (n - 1) / 2) * 54
    const anim = coin.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(.3)`, opacity: 0 },
        { transform: `translate(${x0 + spread}px, ${y0 - 92}px) scale(1.25)`, opacity: 1, offset: 0.32 },
        { transform: `translate(${x1}px, ${y1}px) scale(.45)`, opacity: 1 },
      ],
      { duration: 1150, delay: 260 + i * 110, easing: 'cubic-bezier(.36,.05,.28,1)', fill: 'both' },
    )
    anim.onfinish = () => {
      coin.remove()
      onArrive()
    }
  }
}

const BITS = 'robot.bits'
const OWNED = 'robot.owned'
const KIT = 'robot.kit'
const ROOMS = 'robot.rooms'
const SOLVED = 'robot.solved'

export const loadBits = () => {
  try { return Number(localStorage.getItem(BITS)) || 0 } catch { return 0 }
}
export const saveBits = (n: number) => {
  try { localStorage.setItem(BITS, String(n)) } catch { /* memory-only is fine */ }
}
export const loadSolved = (): string[] => {
  try { return JSON.parse(localStorage.getItem(SOLVED) ?? '[]') } catch { return [] }
}
export const saveSolved = (ids: string[]) => {
  try { localStorage.setItem(SOLVED, JSON.stringify(ids)) } catch { /* fine */ }
}

export const loadOwned = (): string[] => {
  try { return JSON.parse(localStorage.getItem(OWNED) ?? '[]') } catch { return [] }
}
export const saveOwned = (ids: string[]) => {
  try { localStorage.setItem(OWNED, JSON.stringify(ids)) } catch { /* fine */ }
}
export const loadKit = (): Record<string, string> | null => {
  try { return JSON.parse(localStorage.getItem(KIT) ?? 'null') } catch { return null }
}
export const saveKit = (kit: Record<string, string>) => {
  try { localStorage.setItem(KIT, JSON.stringify(kit)) } catch { /* fine */ }
}

export const loadRooms = (): unknown[] => {
  try { return JSON.parse(localStorage.getItem(ROOMS) ?? '[]') } catch { return [] }
}
export const saveRooms = (rooms: unknown[]) => {
  try { localStorage.setItem(ROOMS, JSON.stringify(rooms)) } catch { /* fine */ }
}

/** Wipe everything: bits earned, rooms solved, and the parts bought with them. */
export const wipeProgress = () => {
  try {
    // rooms a child built are theirs: wiping progress does not wipe those
    for (const k of [BITS, SOLVED, OWNED, KIT]) localStorage.removeItem(k)
  } catch { /* memory-only is fine */ }
}

/**
 * Coins flying from one place on screen to another. Earning sends them to the
 * purse; spending sends them out of it, which is the same animation run the
 * other way about.
 */
export function flyCoins(from: DOMRect, to: DOMRect, n: number, onArrive: () => void) {
  const x0 = from.left + from.width / 2
  const y0 = from.top + from.height / 2
  const x1 = to.left + to.width / 2
  const y1 = to.top + to.height / 2

  for (let i = 0; i < n; i++) {
    const coin = document.createElement('div')
    coin.className = 'bit'
    coin.innerHTML = '<span class="face"><b>0</b><b>1</b></span>'
    document.body.appendChild(coin)

    if (typeof coin.animate !== 'function') {
      setTimeout(() => { coin.remove(); onArrive() }, 200 + i * 90)
      continue
    }
    const lift = (i - (n - 1) / 2) * 40
    const anim = coin.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(.4)`, opacity: 0 },
        { transform: `translate(${(x0 + x1) / 2 + lift}px, ${(y0 + y1) / 2 - 70}px) scale(1.2)`,
          opacity: 1, offset: 0.4 },
        { transform: `translate(${x1}px, ${y1}px) scale(.4)`, opacity: 0 },
      ],
      { duration: 780, delay: i * 90, easing: 'cubic-bezier(.36,.05,.28,1)', fill: 'both' },
    )
    anim.onfinish = () => { coin.remove(); onArrive() }
  }
}
