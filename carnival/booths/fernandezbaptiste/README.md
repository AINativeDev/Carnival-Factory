# Elves' Card Table

Owned by [@fernandezbaptiste](https://github.com/fernandezbaptiste).

Snap at a lantern-lit card table on a snowy slab at dusk, with a pine and a
string of slowly shimmering lights on either side. Tap the drawing to play
against the elf on the left: you play the elf on the right.

## Playing

- The first tap deals a new game: the 20-card deck (ranks 1 to 5, shown as pips
  in one of four colours) shared out into two face-down stacks.
- Cards flip onto the pile in turn: the elf flips its own after a moment, then
  yours flips when you tap. Each card turns over in the air on the way.
- When the card flipped matches the one under it (the same number of pips, in
  any colour), it's a snap. Tap to slap the pile. The elf slaps too, a short,
  slightly random moment after the card lands. Whoever slaps first wins the
  pile: a "SNAP!" bubble pops up, and the pile slides under the winner's stack.
  A tap when there's no snap does nothing.
- The score in the top left corner counts the piles won, "You" against "Elf",
  and gold chips on the table count them too. The first to 10 wins: the winner
  hops and cheers, the other sulks, and a tap starts a new game.
- When someone runs out of cards on their turn, the whole deck is dealt again.
- Every tap counts, even two quick ones between frames. The game is kept in
  memory for your visit only, and with no tap for 20 seconds the elves go back
  to playing each other.

## When nobody plays

The two elves play each other, a round every 12 seconds: they deal, flip in
turn, both slap the snap on the fifth flip, the quicker one cheers and pulls
the pile over, and gold chips count the rounds won in a game of five. Every
round is a new shuffle, the same every time for that round. Hovering over the
table shows "Tap to play Snap".

## The rules

The game's rules are plain functions, each file tested beside it: the deck
(`makeDeck`, `shuffle`, `deal`, `isSnap`) in `deck.ts`; the elves' own rounds
(`playUntilSnap`, `roundAt`, `tally`) in `rounds.ts`, and where a round stands
at any time (`momentAt`, `flipsAt`, `stacksAt`) in `round-clock.ts`; and the
visitor's game (`newGame`, `flip`, `elfDelay`, `press`, `advance`, `play`) in
`visitor-game.ts`. The elf's delay is a seeded function of the time, so the
tests stay deterministic. Everything moves from `time`.

## The drawing

`booth.ts` joins the parts for the map. `table-view.ts` turns either game into
what the table shows at one moment, `poses.ts` works out the elves' hands and
the card in the air, and `table-scene.ts` paints it all back to front, from the
table and lantern in `card-table.ts`, the cards in `cards.ts`, the elves in
`elves.ts` and the strokes in `brush.ts`.

Preview it at `#/booth/fernandezbaptiste`.
