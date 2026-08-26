/**
 * A one-off element that flies between two places on screen. Used for the
 * arrow travelling from the tray into its slot, so a tap has somewhere to
 * land rather than just making a square light up somewhere else.
 */
export function flyBetween(from: DOMRect, to: DOMRect, html: string, colour: string, duration = 300) {
  const el = document.createElement('div')
  el.className = 'flying'
  el.style.setProperty('--dc', colour)
  el.innerHTML = html
  document.body.appendChild(el)

  const place = (r: DOMRect, scale: number) =>
    `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) translate(-50%, -50%) scale(${scale})`

  if (typeof el.animate !== 'function') {
    el.remove()
    return
  }
  const anim = el.animate(
    [
      { transform: place(from, 1), opacity: 1 },
      { transform: place(to, 1.25), opacity: 1, offset: 0.7 },
      { transform: place(to, 1), opacity: 0 },
    ],
    { duration, easing: 'cubic-bezier(.32,.86,.4,1)', fill: 'both' },
  )
  anim.onfinish = () => el.remove()
}
