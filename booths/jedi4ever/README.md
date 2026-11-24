# Santa's Toy Factory

Owned by [@jedi4ever](https://github.com/jedi4ever).

A busy little workshop that acts out how this map gets built, as a loop that
repeats every 12 seconds:

- **Letters arrive**: an envelope drops through the mail slot on the left and
  lands on the pile on a crate, every 3 seconds.
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
- **Cosy details**: a fireplace with gently flickering flames, snow falling past
  the window, a string of lights along the ceiling beam that twinkles slowly,
  and the big "Santa's Toy Factory" sign.
- **Penguins**: four penguins stand on the workshop floor. They shuffle from
  side to side with a little waddle and blink now and then. Hover over one and
  it waves a flipper at you; tap one and it does a little hop.
- **Snow globe**: a small globe with a tiny reindeer sits on a shelf near the
  front. Tap it and its snow swirls, then settles again over about 4 seconds.
- **On the map**: the stall is a log cabin with a berry red roof and gold trim.

Everything is drawn from `time`. The one thing the booth remembers is when
each penguin and the snow globe were last tapped, so they can react. The timing and movement of the
loop (`letterAt`, `placeOf`, `buildOf`, `lampAt`, `jingleAt`, `sacksFilled`)
and of the penguins (`shuffleOf`, `blinking`, `hopHeight`, `penguinAt`) are
plain functions in `booth.ts`, tested in `booth.test.ts`.

Preview it at `#/booth/jedi4ever`.

By the door hangs a small wooden sign, "toys today", whose number ticks up by one every 3 seconds with a little bounce.
