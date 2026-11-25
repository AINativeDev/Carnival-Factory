# Hot Cocoa Stand

An attraction of the North Pole: it belongs to the map, not to a participant.

A little diorama at dusk, in the [diorama style](../../../docs/style.md): a
wooden stand on a slab of snow, its planked front facing the lower left, with
a red and yellow scalloped awning and a gold sign of three cocoa drops on its
snowy roof. A lantern glows warm in the serving hatch, and a gold and cream
urn on the counter reaches its spout over an empty cup.

## How to play

Step inside the stand and make your own cocoa, with a mouse or a finger:

1. **Hold** to pour. The cocoa rises in the cup while you hold, and stops when
   you let go.
2. Once the cup is full, steam rises from it. **Tap** to drop in the toppings,
   one a tap: marshmallows, then a swirl of cream, then a candy cane.
3. The candy cane serves the cup: it slides away along the counter, and a
   fresh one takes its place.

A line over the stand says what to do next, and the chalkboard on the snow
counts the cups served this visit. Nothing is kept once you leave.

The game's rules are plain functions in `cocoa.ts`, tested in
`attraction.test.ts`; `cup.ts` draws the cup and the urn, and `sign.ts` the
words.

Preview it at `#/attraction/cocoa-stand`.
