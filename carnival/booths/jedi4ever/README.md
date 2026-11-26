# Santa's Toy Factory

Owned by [@jedi4ever](https://github.com/jedi4ever).

A busy little workshop that acts out how this map gets built, as a loop that
repeats every 12 seconds:

- **Letters arrive**: an envelope drops through the mail slot on the left and
  lands on the pile on a crate, every 3 seconds. A ginger cat sleeps curled up
  on top of the crate: each time a letter lands, its ear twitches and its tail
  flicks once, then it settles back to sleep.
- **Sorting**: an elf with a magnifying glass looks each letter over and
  stamps it. Three letters a round get a green stamp and go on to the belt; one
  gets a red stamp and floats up to the "maybe later" tray, where it fades
  before the next one comes.
- **The workbench**: along the conveyor belt one elf hammers the letter into a
  toy, with sparks, and the next paints it, with dabs of paint. The toys take
  turns: a train, a teddy and a rocket.
- **Quality check**: at the end of the belt an elf with a clipboard checks the
  toy, a tick appears over it and the lamp on the wall goes from amber to green.
- **Into the sleigh**: the toy hops into the sack on the sleigh at the right.
  When the round's third toy lands, the sleigh's bells wiggle and the counter on
  the wall ticks up.
- **A waving snowman**: a small snowman with a carrot nose and a red scarf stands
  beside the sleigh, slowly waving one stick arm back and forth. Beside it a small lantern hangs on a
  post, its flame flickering gently and its glow breathing with it.
- **Cosy details**: a fireplace with gently flickering flames, snow falling past
  the window, a string of lights along the ceiling beam that twinkles slowly,
  and the big "Santa's Toy Factory" sign.
- **Penguins**: four penguins stand on the workshop floor. They shuffle from
  side to side with a little waddle and blink now and then. Hover over one and
  it waves a flipper at you; tap one and it does a little hop.
- **Snow globe**: a small globe with a tiny reindeer sits on a shelf near the
  front. Tap it and its snow swirls, then settles again over about 4 seconds.
- **The logo**: the owner's logo, a white cube of interlocking blocks on a dark
  plaque, hangs on the back wall to the right of the toy sign. Press it and it
  spins for as long as you hold; let go and it slows to a stop.
- **On the map**: the stall is a log cabin with a berry red roof and gold trim.

Everything is drawn from `time`. The one thing the booth remembers is when
each penguin and the snow globe were last tapped, so they can react.

The code is split by what each part is in the scene, each with its tests
beside it:

- `booth.ts` puts the workshop together, back to front, and keeps the taps.
- `letters.ts` is the loop itself: each letter's trip (`letterAt`,
  `lettersAt`, `placeOf`, `buildOf`).
- `tallies.ts` is the check lamp and the "toys today" sign (`lampAt`,
  `toysMade`, `bounceOf`); `snowman.ts` is the waving snowman beside the sleigh; `lantern.ts` is the flickering lantern on a post beside it (`flameAt`); `sleigh.ts` is the sleigh, its bells and the sacks
  counter (`jingleAt`, `sacksFilled`).
- `cat.ts` is the ginger cat asleep on the crate: it wears a red collar with a tiny gold bell, which glints once at each tail flick; its ear twitches and its tail flicks
  once each time a letter lands on the pile.
- `room.ts` is the room behind it all, with the window's snow and the lights
  (`snowflake`, `twinkle`).
- `elves.ts`, `belt.ts` and `toys.ts` draw the elves, the belt with
  everything on it, and the letters and toys.
- `penguins.ts` is the penguins (`shuffleOf`, `blinking`, `hopHeight`,
  `penguinAt`), and `snow-globe.ts` the globe (`swirlOf`, `onGlobe`,
  `globeFlake`).
- `motion.ts` and `brushes.ts` are the easing and the shapes and words they
  all share.

Preview it at `#/booth/jedi4ever`.

By the door hangs a small wooden sign, "toys today", whose number ticks up by one every 3 seconds with a little bounce.
