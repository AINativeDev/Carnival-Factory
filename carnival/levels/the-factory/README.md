# The Factory

The North Pole's own level, not a participant's: only maintainers change it
([ADR 0035](../../../docs/adr/0035-north-pole-levels.md)). It takes visitors
through how a booth gets built, one stall per step of the loop, in the
`aurora-night` theme, 25 tiles each way. Its landmark on the home map is the attraction
[`the-factory`](../../attractions/the-factory/), and it has a platform at the
sleigh station like every level.

You don't walk The Factory: you ride it. The whole level is a roller coaster
([ADR 0041](../../../docs/adr/0041-ride-levels.md)), and visitors sit in the
golden ticket car, the visitor's request, from the boarding station by the
sleigh home. The car stops at a station at each stall's door, in the order a
booth gets built: E opens the stall, and Space, →, D, a tap or the "Ride on"
button rides on to the next. After the map it comes round to the boarding
station, where E takes the sleigh back to the North Pole.

The ride: a lift hill climbs on its chain at the start, crests and drops to
the letter box; a loop on the way to the assessment desk; another lift hill
up to the high run over the stream, which drops and loops on to the
workshop; a loop, a climb and a drop to the inspection bench; a loop to the
gate and a dip to the map; then a last lift hill, a drop and a loop back over
the stream to the start, about 50 seconds a lap. The track is the `coaster`,
`coaster-lift`, `coaster-drop`, `coaster-loop` and `coaster-station` props in
`level.ts`, listed in the order the car rides them; each one's variant lifts
its rail.

Inside the track is the factory floor, conveyor belts, turning cogs and
candy-striped pipes under floating lanterns, and the fair the coaster swoops
round: a carousel, a ferris wheel, a band, a juggler, a fire-breather,
acrobats and a balloon.

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
   a new booth springs up on its spot after each deploy.
