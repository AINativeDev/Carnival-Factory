# The Factory

An attraction of the North Pole: it belongs to the map, not to a participant.

It's the landmark for The Factory, the North Pole's own level
([`carnival/levels/the-factory/`](../../levels/the-factory/)). On the home map
it stands as a tall tower with **TESSL** down its front. Its own page,
`#/attraction/the-factory`, is a game: **Feed the Loop**.

## Feed the Loop

A diorama at dusk, in the [diorama style](../../../docs/style.md): the TESSL
tower at the back, and in front of it the build loop, a round belt with four
arches over it, **REQUEST**, **BUILD**, **REVIEW** and **MERGE**, round a hopper
with four skill gems circling it. A sleigh waits at the slab's left corner.

- A parcel rides the belt from station to station, built up as it goes: a blank
  slip, a written request, a crate rising as it's built, then a wrapped booth.
- A bubble over the station ahead says which skill it **needs**, SPECS, TESTS,
  REVIEW or DOCS, with a bar running down as the parcel nears it.
- Tap that skill's card, down the left, before the parcel gets there: it scores
  10 to 20 points, more for a quick answer, times the level.
- The wrong card, or none in time, **jams** the belt: it stops for a moment in
  a puff of smoke, and costs one of three hearts.
- A booth through merge flies into the sleigh for 25 points times the level, and
  lights the next letter of TESSL. With all five lit, the tower glows and gifts
  tumble off its top. Every third booth is a new level, and the loop speeds up.
- The third jam ends the round: **LOOP COMPLETE**, with the score, the booths
  shipped and the best of the visit, a big **Sign up for Tessl** button, and a
  tap anywhere else to play again.

A small **Sign up for Tessl** button sits under the scoreboard the whole time.
A tap on either button asks the page, through the square's `ask()`, to open the
Factory's first link out (Sign up for Tessl) in a new tab; the drawing itself
never opens anything.

With nobody playing, a demo rides the loop, answers every station itself,
ships booths and never jams, with **TAP TO PLAY** in the top right. The first
tap on the drawing starts a round. The score and the best last for the visit
only, never in storage.

## Files

- `attraction.ts`: the square, drawing the scene in depth order, and `ask()`.
- `game.ts`: the game's rules and state, moved on each frame by `advance`.
- `rules.ts`: the skills, the cards and buttons and where taps land on them,
  the stations, and the floating words.
- `track.ts`, `stations.ts`, `tower.ts`: the belt and parcel, the arches and
  the need bubble, the tower.
- `hud.ts`, `effects.ts`, `text.ts`: the cards, scoreboard and last card; the
  sparkles, points, jams and the sleigh; lettering and small shapes.
