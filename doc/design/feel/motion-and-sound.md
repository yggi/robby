# Motion and sound

## Idle life runs on periods that do not divide

Robby glances about every **11s** and shifts his weight every **17s**. Funke
twitches an ear every **7.3s** and looks around every **13s**.

The numbers are deliberately non-matching so nothing ever syncs into a
metronome. Two characters idling on periods with a common factor read as a
machine within about a minute of watching, which is precisely the thing a
companion animation exists to prevent. If you add a fifth cycle, do not pick a
round number.

## Celebrations vary; feedback does not

Celebrations draw at random from **four flourishes each**, so winning the same
room twice does not play the same clip. The smoke suite plays twelve of them and
asserts the variety is real — a check that would otherwise pass forever on one
flourish.

Idle tics, bonks and pickups play identically every time. That looks like an
oversight and is carded as one (`doc/BOARD.md` [R-011]), but the counter-argument is
live and in `doc/NOTES.md`: **a bonk is feedback**, and feedback that varies is
harder to learn from than feedback that does not. The current best guess is that
variety belongs to the things that reward you and sameness to the things that
tell you what happened. It is untested.

## Three numbers that survived contact

The **380ms step**, the **bonk shudder** and **one-tap slot removal** were
guesses. All three were watched in the hands of a five-year-old and none of them
needs revisiting on current evidence
([`../game/playtest.md`](../game/playtest.md)).

## The walk and the hold are two clocks

`DUR` is how long a frame is **held**; `walkMs` is how long the robot takes to
**cross a tile**. They were one number, and it cost two things.

A frame held so that something could be *watched* spent that time on the
movement instead: he crawled into the battery over 1150ms and never once stood
on it. Held frames exist so the bubble ticking a part off, or the rocket
shuddering him away, can be seen — which needs him standing still.

And an ordinary step was a **race**: the walk was 380ms and the frame was held
380ms, so the transition ended at the instant it was retriggered. On a straight
run — four tiles bought by one instruction, no pause between them — that race
runs every frame, and a transition that loses it restarts from where it began,
which is drawn a tile back and then snapped forward.

So the rule is stated rather than hoped for: **the walk always finishes before
the frame does**, reduced motion included, where the walk used to be longer than
the hold and so lost every time. A belt is the one thing quicker than a walk,
because he is not walking, he is being carried.

## The camera is punctuation

Winning **pushes in** on the celebration. Pressing Next swaps the level *inside*
that tight framing, with transitions off, and then **pulls back** to reveal the
new room.

The change happens where it cannot be seen. That is the whole trick, and it
means no loading state, no fade, and no moment where the screen is nothing.

`prefers-reduced-motion` is honoured properly throughout, which for a camera
means the framing still changes and the journey between framings does not.

## The rocket is a departure, not a reward animation

Winning an exit level just celebrates on the pad. Then Robby and Funke climb
aboard at the end of the cheering, and you can see them through the porthole —
his orange eyes, her violet ones with little ear triangles. The ship sits there
**loaded, breathing, with a pilot flame**, until you press Next. Only then does
it burn.

The distinction matters: a reward animation is something the game does *to* you
when you win, and a departure is something the characters do, which you are
waiting for and then release. The second one is worth pressing a button for.

Between worlds, an arrival card names where they have landed. It is the only
story beat in the game, and the only step so far toward connecting thirty-two
rooms into a journey (`doc/NOTES.md`).

## Sound is a machine

Square waves throughout, plus filtered white noise for servo whirr and relay
clack. No samples, no external assets — for the same reason as everything else:
it works on a plane.

- **Each direction has its own pitch.** The tray is learnable by ear before it
  is learnable by symbol, and a child can hear that they have placed the same
  arrow twice.
- **Steps are a servo tick, not a note.** A note would make walking musical, and
  a run's length would start to sound like a melody rather than a distance.

## Where to go instead

- Who is doing the moving: [`characters.md`](characters.md).
- What the colours in the celebration mean:
  [`visual-language.md`](visual-language.md).
- Why the view can be retimed without touching a rule:
  [`../code/architecture.md`](../code/architecture.md).
- Why animation testing needed a Web Animations shim before any of this could be
  checked at all: [`../testing/harness.md`](../testing/harness.md).
