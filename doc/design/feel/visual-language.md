# The visual language — two of them, held apart

## Deliberately unalike

The composition depends on the contrast:

- **The world** — illustrative, themed, continuous, alive. It changes completely
  between chapters: a lab, a forest, a scrapyard, a moon made of cheese.
- **The console and the status bar** — matte charcoal, flat, geometric, dead
  still. Identical in every world, forever. It is the remote control in the
  child's hands, not part of the fiction.

The world is framed between the two. The play button is the only circle on a
console of squares, and the only triangle in the app.

If a change makes the console more expressive, or the world more uniform, it is
working against this. Both directions have been tried and both flatten the
picture: the console becomes a thing to look at rather than a thing to use, and
the worlds stop being places.

## The path is the thing that glows

Walls are negative space — they are not drawn, they are what is left. The
walkable region is drawn as a single continuous ribbon:

- seams vanish where two path tiles meet
- only *outer* corners round off
- the whole floor layer carries **one** drop-shadow rather than one per tile

That last detail is what makes it read as a surface rather than a grid, and it
is the reason the floors layer sits under its own `filter` — which in turn is
why `--c` must be a whole number of pixels
([`../code/conventions.md`](../code/conventions.md)).

## Colour

| Meaning | Colour | Rule |
|---|---|---|
| power | orange `#ff7b45` | the battery, and the light in Robby when charged |
| go | teal `#17b9a0` | the play button |
| up / right / down / left | blue / green / yellow / red | canonical, everywhere |
| wrong | red ring | a marker *on* a slot, never a fill |

**Direction colours run through three places at once** — the tray token, the
filled slot, and the planning vector drawn on the board — so a pre-reader can
match a colour on the map to a colour under their thumb without decoding an
arrow. A child tracing directions in the air before reaching for a token is this
working ([`../game/playtest.md`](../game/playtest.md)).

**The blamed slot is a pulsing red ring, not a red fill**, because left is
already red. That is the whole reason, and it is the kind of constraint that
appears the moment colours are given single meanings: the palette runs out, and
you reach for shape instead. That is the correct move.

Orange and teal are never spent on anything else. Not on a highlight, not on a
button, not on a piece of decor. A world that wants a warm accent picks a
different warm.

## Every backdrop is seen from directly overhead

The board is a top-down view, so backdrops must match. This has been got wrong
twice and both times looked obviously wrong the moment it shipped:

- the city had a side-on **skyline** behind a top-down road → now rooftops
- the lab had a papered **wall** with lamps on cords → now floorboards and rugs

Light pools are the only legitimate trace of a ceiling: a pool of light on a
floor is exactly what you see from above.

## Where to go instead

- Who is themed and who is not: [`characters.md`](characters.md).
- How a palette is attached to a world, and the one-attribute rule that keeps
  the editor coloured: [`../code/conventions.md`](../code/conventions.md).
- Why "no text" is not negotiable: [`../game/audience.md`](../game/audience.md).
