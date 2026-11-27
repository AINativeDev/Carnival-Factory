# Gingerbread Fun House

An attraction of the North Pole: it belongs to the map, not to a participant.

A little diorama at dusk, in the [diorama style](../../../docs/style.md): a
crooked gingerbread house on a slab of snow, lit on its left and shaded on its
right, with a chocolate roof edged in icing and gumdrop lights chasing slowly
along its eaves. It leans and sways a little, as a fun house should. An elf
strolls along the snow in front of it, there and back, and as it passes the
two round fun-house mirror windows its reflection shows in them, stretched tall
and thin in the left one and squashed short and wide in the right.

## Icing Echo

The house is a memory game. Its notes are its features, each with a colour and
a musical symbol of its own on an iced badge: the left mirror window (mint, a
quaver), the candy-cane door (berry, a crotchet), the right mirror window
(violet, two beamed quavers) and a big gumdrop on the roof (gold, a minim).

1. **Watch.** Tap anywhere to play. The house plays a tune by lighting its
   notes in turn: each one swells with a soft halo of its colour and fades.
2. **Echo.** When the banner says **Your turn**, tap the notes back in the same
   order. A tap near a feature counts for it. Each right note lights up, its
   symbol floats away, a dot fills in under the banner, and a treat (a gumdrop,
   an icing swirl or a wrapped candy, in turn) sticks on the rim of the feature
   you tapped. A tap between the notes only ripples the icing.
3. **Rounds.** Echo the whole tune and the house cheers ("Sweet! Round 3
   iced"); the next round's tune is the same with one more note, played a
   little quicker each round. A fifth note (ice blue, a semiquaver) joins in
   round 5 and a sixth (peach, a semibreve) in round 8, at first on a second
   roof gumdrop and the round attic window in the gable, which wait as plain
   icing until then. Each is played as the new note the first time.
4. **The fun-house mirrors.** From round 4, once the house has played its
   tune, the mirrors swap two notes' places: the two float across the house on
   arcs, stretching and squashing as they go, and settle in each other's place.
   Echo by colour and symbol, not by where a note was. The notes stay where the
   mirrors leave them.
5. **A wrong note** cracks the icing: the house wobbles hard and settles, the
   note you should have tapped breathes slowly so you can see it, and a card
   gives the rounds you echoed, the best of the visit and **Tap to go again**
   (after a moment, so a late tap doesn't skip it).

The score is the rounds echoed; the best of the visit stays while the square is
open and is never saved. A game left alone for 30 seconds goes back to the demo.

With nobody playing, the house plays its own demo: it plays a tune, echoes it
perfectly, cheers and goes on for five rounds, mirror swap included, then
starts again, so it's alive on the map too.

Nothing flashes: every note swells in and fades out over hundreds of
milliseconds, the cards fade in, and the halos stay small on the square.

## On the map

The fun house stands on the map as a gingerbread house with a wonky roof. Its
drawing hangs on the front under a tall gold sign. Two elves queue at its door
and a third waves a ticket, a candy-cane lamp glows beside it, gumdrop string
lights shimmer along its eaves, a pennant flies from its crooked ridge and
smoke curls from its chimney.

## The code

- `attraction.ts`: the attraction, the game it keeps for the visit, and the
  order it draws in.
- `echo.ts`: Icing Echo's rules: rounds, the echo, the swap, losing and the
  demo; `tune.ts`: how many notes, how fast, and the steady picks.
- `light.ts`: how lit each note is, and where a swapped note is on its way.
- `slots.ts`: the six places on the house, the notes' colours, which place a
  tap lands on and where its treat sticks.
- `house.ts`: the house itself and its chasing gumdrop lights;
  `fixtures.ts`: the windows, door and gumdrops in their notes' colours;
  `notes.ts`: the musical symbols, badges and halos.
- `hud.ts` and `lettering.ts`: the banner and the card; `sparkle.ts`: the
  ripple and the floating note on every tap.
- `decorating.ts`: the lean, the wobble and the treats; `mirrors.ts` and
  `stroller.ts`: the elf's stroll, its reflections and drawing the treats.

Preview it at `#/attraction/gingerbread-fun-house`.
