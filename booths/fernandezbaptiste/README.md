# Elves' Card Table

Owned by [@fernandezbaptiste](https://github.com/fernandezbaptiste).

Two elves play Snap at a lantern-lit card table on a snowy slab at dusk, with a
pine and a string of slowly shimmering lights on either side. Visitors can't
play yet, because booths can't react to clicks or keys, so the elves play each
other. A round lasts 12 seconds:

- **Deal**: the 20-card deck in the middle of the table is dealt out, one card
  at a time, into two face-down stacks.
- **Flip**: the elves take turns flipping their top card onto the pile in the
  middle. Each card turns over in the air on the way, showing its pips: 1 to 5
  of them, in one of four colours.
- **Snap**: when the card flipped matches the one under it (the same number of
  pips, in any colour), both elves slap the pile. The quicker one's hand lands
  first, a "SNAP!" bubble pops up over them and they cheer with a hop, arms in
  the air.
- **Collect**: the winner pulls the pile over to their stack, earns a gold chip
  for the score, and the cards are gathered back to the middle for the next
  round. The chips count the rounds won in a game of five, then start again.

Every round is a new shuffle, the same every time for that round, and its snap
always comes on the fifth flip.

The game's rules are plain functions in `booth.ts`, tested in `booth.test.ts`,
so a playable version can reuse them: the deck (`makeDeck`, `shuffle`,
`deal`), turns and matching (`playUntilSnap`, `isSnap`), each round and who wins
it (`roundAt`, `tally`), and where the round stands at a moment (`momentAt`,
`flipsAt`, `stacksAt`). Everything is drawn from `time`.

Preview it at `#/booth/fernandezbaptiste`.
