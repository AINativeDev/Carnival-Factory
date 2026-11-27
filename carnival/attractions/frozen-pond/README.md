# Frozen Pond

An attraction of the North Pole: it belongs to the map, not to a participant.

A little diorama at dusk, in the [diorama style](../../../docs/style.md), seen
a little closer than most: a long oval pond of ice sunk into a slab of snow,
with snowy pines round the back, a lamp throwing a warm pool across the near
end and a shine drifting over the ice. A curling sheet is laid along the pond,
with its hack at the near end and the house, its rings in violet, white and
berry, at the far end. Three skaters in red, green and violet scarves glide to
and fro along the far side of the pond, and cheer when you win an end.

## Curling

Get one of your gold stones nearest the button, the middle of the house.

- **Throw**: press, on the stone or anywhere on the square, drag back towards
  the near end and let go, like a slingshot. How far back sets the power; up or
  down aims it the other way. A dotted line shows where the stone would stop
  on still air: gold, or berry once it would slide past the back line. It
  works with a finger on a phone, and a tap that doesn't drag shows how.
- **Sweep**: while the stone slides, tap fast. A sweeper with a broom skates
  beside it, and each tap makes the ice easier for a moment, so the stone
  slides further and the wind pushes it less.
- **Wind**: each end the wind blows across the sheet, from either side and
  stronger each end. The arrow at the top shows which way, and snow drifts
  over the ice with it. Aim into it.
- **Knocks**: stones knock each other on, so you can clear a rival out of the
  house, or knock your own in.
- **Rivals**: berry stones wait on the sheet at the start of each end: one in
  the house on the first end, a guard in front on the second, and one nearer
  the button on the third.
- **Scoring**: five stones an end. When they've all stopped, the stone nearest
  the button takes the end. If it's yours it scores 3 touching the inner ring,
  2 the middle ring and 1 the outer; if it's a rival's, the end scores
  nothing. A stone over a side or past the back line is out of play.
- **Three ends** make a game. The final card shows each end's points, the total
  and the best of the visit; tap to play again.

With nobody playing, the skip plays the ends itself, pulling each stone back,
aiming into the wind and sweeping a stone that would stop short, under a sign
that says how to play. The score and the best are kept for one visit only, and
nothing flashes.

The sheet, the scoring and each end's wind and rivals are in `sheet.ts`, how
stones slide, sweep and knock in `stones.ts`, the game's rules in `game.ts` and
the skip in `skip.ts`; the pond is drawn in `pond.ts`, the stones and skaters
in `rink-drawing.ts` and the signs in `hud.ts`.

Preview it at `#/attraction/frozen-pond`.
