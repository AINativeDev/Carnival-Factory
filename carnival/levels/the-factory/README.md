# The Factory

The North Pole's own level, not a participant's: only maintainers change it
([ADR 0035](../../../docs/adr/0035-north-pole-levels.md)). It walks visitors
through how a booth gets built, one stall per step of the loop, in the
`aurora-night` theme, 21 tiles each way. Its landmark on the home map is the attraction
[`the-factory`](../../attractions/the-factory/), and it has a platform at the
sleigh station like every level.

Visitors arrive at the foot of the first lane. The path runs up it, across the
top, and down the second lane to the sleigh home, past the six stalls in order.

It's a roller coaster ride. Candy-striped track on posts runs beside the path,
up the first lane, over the path across the top and down the second lane, with
a loop-the-loop just past each stall's door. A golden admission ticket, the
visitor's request, rides it from the letter box's loop to the map's, upside
down at the top of each loop, in about 26 seconds, then boards again at the
foot of the first lane. The track is the `coaster` and `coaster-loop` props in
`level.ts`, listed in the order the ticket rides them.

Between the lanes is the factory floor, conveyor belts, turning cogs and
candy-striped pipes, and the fair: a carousel, a fire-breather, a juggler,
acrobats and a band, under floating lanterns. Over the stream to the east are a
ferris wheel and a balloon.

Each stall's panel tells its step in two or three sentences, with a link to
the real thing, from the page's own text in `src/factory-tour.ts`:

1. **The Letter Box** (`squares/letter-box/`): a red post box with three
   letters flying into its slot in turn.
2. **The Assessment Desk** (`squares/assessment-desk/`): a lamp-lit desk where
   a stamp presses onto the green, gold and red trays in turn: accepted, asked
   about, declined.
3. **The Workshop** (`squares/workshop/`): a workbench where a little booth is
   built part by part, floor, walls, counter and roof, while a hammer taps.
4. **The Inspection Bench** (`squares/inspection-bench/`): a lens sweeps over
   a booth while five checks on the board light up one by one.
5. **The Gate** (`squares/gate/`): a gate that swings open when the lamps are
   green, and for every other change stays shut with red lamps and a ringing
   bell, waiting for a person.
6. **The Map** (`squares/map/`): a table with a little North Pole on it, where
   a new booth springs up on its plot after each deploy.
