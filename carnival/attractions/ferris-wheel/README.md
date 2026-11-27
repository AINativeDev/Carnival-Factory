# Ferris Wheel

An attraction of the North Pole: it belongs to the map, not to a participant.

A little diorama at dusk, in the [diorama style](../../../docs/style.md): a
ferris wheel on a wooden A-frame, standing on a low base on a slab of snow,
with its far rim and legs in the shade behind. Eight bauble cars in red, gold,
mint and violet hang from it, open at the top, between lantern lights that
shimmer gently. Two faint ribbons of northern lights ripple across the sky, and
a lamp glows warm on the snow. At the wheel's foot, a queue of elves in red
hats waits on a wooden boarding deck behind a rope line.

## Boarding Time

The wheel turns, and each car swings past the gate at the bottom, where a
dashed ring marks the spot. Tap, anywhere on the square, to send the next elf
in the queue hopping into the car in the ring.

- **The ring** glows gold while an empty car is in it, and berry while a full
  one is. Its middle dot is the perfect moment.
- **A good boarding** scores 10, and a **perfect** one 25. The elf rides on in
  the car, its head and hat over the rim.
- **A miss** sends the elf off to sulk on the snow under a little grey cloud: a
  tap with no car in the ring ("Too early!", "Too late!"), a tap on a car that
  is already full, or an empty car let go round. One mistake never costs two.
- **Fill every car** for a lap bonus of 100 times the lap: "Full wheel!", the
  lights turn gold and the wheel whirls a victory lap while its riders hop off
  and walk away. Then it turns quicker, up to 2.4 times its first pace.
- **Guests** in violet hats climb aboard during the victory lap, one more each
  lap up to three. Their car must not be boarded: let it pass the gate, they
  hop off, and it comes round empty next time.
- **Three misses** close the ride. The card shows the score and the best of the
  visit; tap to go again.

A new game waits for its first boarding before an empty car going round counts
as a miss. With nobody playing, the attendant shows the game, boarding every
car perfectly and filling the wheel on a loop, under a sign that says how to
play. The score and the best are kept for one visit only, and nothing flashes.

The wheel's turning and where each car is are in `ride.ts`, the game's rules in
`game.ts`; the wheel is drawn in `view.ts`, the elves in `elves.ts` and the
signs in `hud.ts`.

Preview it at `#/attraction/ferris-wheel`.
