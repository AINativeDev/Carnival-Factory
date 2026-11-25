# Levels

A level is a whole patch of the North Pole of a participant's own,
`carnival/levels/<login>/`, reached by sleigh from the sleigh station. The
North Pole has levels of its own too: The Factory,
`carnival/levels/the-factory/`, The Academy, `carnival/levels/the-academy/`,
and The Recording Studio, `carnival/levels/the-studio/`
([ADR 0035](../adr/0035-north-pole-levels.md)).

## Behaviour

- The sleigh station has one 2 by 2 platform per participant's level, 3 tiles
  apart, along the main path by the entrance, sorted by login. The North
  Pole's own levels have no platform: their landmark attraction is the way in
  ([ADR 0042](../adr/0042-attractions-stand-as-what-they-are.md)). E, Enter or a click on an
  open platform takes the sleigh there. A closed level's platform says
  "Closed for repairs" and has no sleigh.
- `#/level/<login>` walks the level's own world, with "Back to the North
  Pole" in the top-left corner, where "Back to the map" stands inside one of
  its squares. `#/level/<login>?square=<id>` puts the player in front of a
  square, and `#/level/<login>/<id>` inside it. The sleigh home goes back to
  `#/`.
- Beside the map stands the level's panel: the visit panel of a square (see
  [Visit panel and history](visit-panel-and-history.md)), on the right on a
  laptop and below the map on a phone. It stands beside the map, not over it:
  the map takes the space that's left, so the camera frames the level there
  and the way home stays clear. It shows the level's name (the map has no
  sign for it), "A level by @<login>" and its description, then **How it was
  built** from the level's own requests, then Share (the level's link,
  `#/level/<login>`), "Want one too? Get a level" (the
  level form) and **More**. A level has no Remix, no People's Choice vote and
  no Leave: the player walks on with the keys while it shows. Inside one of
  the level's squares, that square's panel takes its place, and it comes back
  on leaving.
- A link to a level that doesn't exist, or is closed, shows the North Pole
  with a note: "There's no level for @<login> yet." or "@<login>'s level is
  closed for repairs." A link to a square a level doesn't have says so too.
- Inside a level's square, the visit panel credits the level's owner, has no
  Remix link and no history, and its "See it in the level" and Share link
  open the level in front of the square.
- The theme (`dusk`, `aurora-night`, `candy-cane`, `frozen-lake`,
  `gingerbread`) tints the sky and colours the signs.
- Besides the scenery, the catalogue (`LEVEL_PROPS` in
  `src/northpole/level-props.ts`) has a show the map animates. Performers:
  `fire-breather` (1 by 1, an elf on a crate whose flame swells and dies
  away every 4 seconds or so), `juggler` (1 by 1, three balls, or four when
  its variant is over 0.5), `stilt-walker` (2 by 1, striding from one tile to
  the other and back), `acrobats` (1 by 1, the top elf swaying), `band` (1 by
  1, a drummer and a horn, notes rising and fading) and `strongman` (1 by 1,
  lifting a candy-cane barbell). Rides: `ferris-wheel` (3 by 3, about 40
  seconds a turn, its cars lit), `carousel` (3 by 3, six reindeer rising and
  falling, 12 seconds a turn) and `balloon` (2 by 2, tethered, bobbing).
  Factory dressing: `conveyor` (1 by 3, parcels sliding along), `cog` (1 by
  1, turning), `candy-pipe` (2 by 1, a striped arch puffing steam) and
  `lantern` (1 by 1, floating). Each blocks its tiles, but the lantern and
  the coaster's track, which people walk under, and each moves only from the
  time and its `variant`, which also picks its colours and offsets its loop,
  so two of a kind move out of step. Nothing flashes: lights shimmer and glows
  swell over seconds. They're drawn in `src/northpole/show.ts` and the files
  it calls (`performers.ts`, `troupe.ts`, `rides.ts`, `carousel.ts`,
  `workshop.ts`, `coaster.ts`), with `brushes.ts` and `elf.ts`. The starter
  level places a few of each.
- An indoor level ([ADR 0040](../adr/0040-indoor-levels.md)), with
  `indoor: true`, is a room instead of an island: a wooden `floor` wherever
  its ground says nothing else, the floor's cut edge in place of the snow
  slab, and two back walls along its upper left and upper right edges,
  papered above and panelled below, with a skirting board, a cornice and warm
  wall lamps, cut away so the visitor looks in over the front. It has no sky,
  northern lights, fence, string lights or snowfall: the room stands in the
  dark, tinted by its theme (`src/northpole/room.ts`,
  `src/northpole/map-backdrop.ts`). Any level may lay `floor` (boards) and
  `carpet` ground. The catalogue's furniture: `plant` (1 by 1), `shelf` (a
  bookshelf, 2 by 1), `rug` (2 by 2, flat), `sofa` (2 by 1), `desk` (1 by 1, a
  pupil's desk and chair, or the teacher's desk with an apple and books when
  its variant is over 0.5), `globe` (1 by 1, turning slowly), `spotlight` (1
  by 1, on a stand, with a pool of light) and `cable` (1 by 1, flat). The rug
  and the cable are drawn under everything and people walk over them; the
  rest block their tiles. What hangs on a back wall, `w` tiles along it:
  `acoustic-panel` (1), `wall-window` (1, snow falling past it),
  `blackboard` (3, chalk on it), `projector-screen` (2, a chart whose bars
  grow), `on-air-light` (1, glowing red, swelling and fading over 2.4
  seconds, never dark) and `wall-door` (2, double doors with a wreath). A wall
  prop on row 0 runs along the upper right wall; on column 0, down the upper
  left wall, its footprint turned. Each blocks its tiles (`furniture.ts`,
  `classroom.ts`, `studio-gear.ts`, `wall-things.ts`).
- A level's square or an attraction with `stall.display: true` stands as an
  item to discover: a low plinth with a cloth in its `roof` colour, its name
  on a gold plaque and its drawing on a framed card on top, facing its door,
  under a warm light (`src/northpole/display.ts`). A booth's display is
  ignored, and it keeps its stall.
- The roller coaster ([ADR 0039](../adr/0039-coaster-ridden-in-list-order.md)):
  `coaster` (1 by 1, a tile of candy-striped track on a post, high enough to
  walk under) and `coaster-loop` (1 by 1, a loop-the-loop on an A-frame,
  blocking its tile). A level's coaster is ridden in the order its pieces are
  listed: each piece joins the one before it side by side, and the track
  turns wherever the next piece does. A golden admission ticket, punched at
  each end with a tear-off stub and a `#`, rides it from the first piece to
  the last, 0.4 seconds a tile and 1.8 seconds round a loop, upside down at
  the top, then boards at the start again. Each piece draws the ticket while
  it's riding that piece, so it passes behind and in front of things at its
  depth (`src/northpole/coaster-ride.ts`, `src/northpole/coaster.ts`).
- More coaster pieces, each 1 by 1 and walked under
  (`src/northpole/coaster-pieces.ts`, `src/northpole/coaster-fittings.ts`):
  `coaster-lift` (a lift hill, with a chain up its middle, 0.9 seconds a
  tile), `coaster-drop` (on braced legs, 0.22 seconds a tile) and
  `coaster-station` (a platform under the rail and a striped canopy over it,
  0.4 seconds a tile). A piece's `variant` lifts its rail: at 0 it runs as
  high as ever, 24 pixels, and at 1 four times as high, on posts as tall,
  and the rail meets its neighbours halfway between their heights, so a run
  of rising variants climbs a hill and falling ones dip. Track stands on
  posts, so it may cross water and ice. A track whose last piece joins its
  first is a circuit: the ticket rides on from the last piece into the first.
- A ride level, `ride: true` ([ADR 0041](../adr/0041-ride-levels.md)), is
  ridden, not walked. Its track is a circuit that starts with a
  `coaster-station` where visitors arrive, with a station at every square's
  and every exit's door. The player sits in the golden ticket car, drawn in
  their berry coat with the gold marker over them, and the camera follows
  the car. It stands at the first station until the visitor rides on, then
  runs at the track's own calm pace to the next station and stops there:
  the stall's call to action shows ("Visit Letters"), and E, Enter, the
  call to action or a click on the stall opens its room and panel as in any
  level. Space, →, D, a click or tap on the ground, or the "Ride on" button
  at the foot of the map (it says "Start the ride" at the first station, by
  the sleigh home) rides on to the next. The walking keys do nothing, so
  nobody walks off the track. After the last station the car comes round to
  the first again, where E takes the sleigh back to the North Pole, or the
  visitor rides again. Opening a square from afar, or a link to one, puts
  the car at its station. For reduced motion the car goes straight to the
  next station and the camera with it. Inside a square the visitor walks its
  room as in any level. The Controls panel and the map's label say how to
  ride (`src/northpole/ride.ts`, `src/northpole/ride-map.ts`,
  `src/northpole/ride-draw.ts`).
- A level's pull request waits for a maintainer: the auto-merge gate only
  takes booth requests.
- A North Pole level (`NORTH_POLE_LEVELS` in
  `src/northpole/north-pole-levels.ts`) says "A level by the North Pole", and
  its squares' panels credit nobody. Its landmark is the attraction with the
  same id: opening it on the home map goes to `#/level/<id>`, and its room
  at `#/attraction/<id>` has a link to take the sleigh inside.
- The Factory, `#/level/the-factory`, is a ride level: the whole level is a
  roller coaster, ridden in the golden ticket car, the visitor's request.
  From the boarding station by the sleigh home the track climbs a lift hill,
  drops to the letter box, loops, climbs again after the assessment desk,
  runs high over the stream to the workshop, loops, climbs and drops to the
  inspection bench, loops to the gate and dips to the map, then climbs,
  drops and loops back over the stream to the start, about 50 seconds a lap.
  The car stops at a station at each stall's door, in the order of the build
  loop. Each stall's panel tells its step in two or three sentences, with a
  link to the real thing and to `#/factory`, from fixed text in
  `src/factory-tour.ts`.
- The Academy, `#/level/the-academy`, is a classroom indoors with a lesson
  on a display for each section of the Tessl Academy, in its order:
  Quickstart by the teacher's desk, Skill Foundations before the blackboard,
  Tuning Your Agent at the projector screen, Code Review Loops among the
  pupils' desks and Reference by the bookshelves. The Recording Studio,
  `#/level/the-studio`, is a studio room indoors with its gear on displays:
  the Microphone and the Headphones in the sound booth's corner, the Mixing
  desk, the Camera on the video set, the ON AIR light by the doors, the Guest
  sofa and the Episode wall.
- A North Pole level may link out: its links, from `NORTH_POLE_LINKS` in
  `src/northpole/north-pole-links.ts`, show as buttons under the description
  on the level's panel, its landmark's room and each of its squares' panels,
  and open in a new tab. The Academy has "Start the Academy"; The Recording
  Studio has "Listen to the podcast" and "Watch on YouTube"
  ([ADR 0038](../adr/0038-north-pole-links.md)).

## Rules

- `level.ts` is plain data, read by the page: `import type` of
  `NorthPoleLevel`, one `const level: NorthPoleLevel = { ... }` holding only
  objects, arrays, strings, numbers and booleans, and `export default level`
  (enforced by: ESLint level-data rules in eslint.config.js,
  scripts/square-lint.test.ts, Tessl Code Review, review-house-rules lens).
- Each square is `squares/<id>/square.ts`, built like a booth and run
  sandboxed like one, with the frame address `level/<login>/<id>` (enforced
  by: ESLint house rules, scripts/square-lint.test.ts,
  src/northpole/frame-protocol-address.test.ts, the CSP in square.html).
- `validateLevel` checks, before anything is drawn: the folder is a login and
  `id` matches it; name (up to 40 characters) and description (up to 160);
  a known theme; `indoor` missing or a boolean; `size` odd, 9 to 41; at most 200 ground areas, 200 blocked
  areas and 400 props; only known ground (`snow`, `ice`, `path`, `water`,
  `bridge`, `floor`, `carpet`) and catalogue props (`LEVEL_PROPS`), inside
  the level, prop variants 0 to 1, at most one pond; props that hang on a
  wall only in an indoor level, on row 0 or column 0; at most 8 squares, kebab-case ids, no
  duplicates, every placed square with a folder and every folder placed; at
  least one exit; nothing on water or ice or on top of anything else; each
  coaster piece joining the one listed before it, and each loop on a straight
  run of track; `ride` true or false, and in a ride level a circuit that
  starts with a station on the arrival tile, every station at a door and
  every door with a station; and, in a level that's walked, by pathfinding,
  every square and exit reachable from the arrival tile
  (enforced by: src/northpole/level.test.ts, which also runs it on every real
  level, src/northpole/coaster-rules.test.ts, src/northpole/level-check.test.ts
  and smoke/levels.spec.ts).
- In a ride level the walking keys never move the player, the car stops at
  every station and rides on only when asked, and walking levels walk as
  before (enforced by: src/northpole/ride.test.ts,
  src/northpole/ride-map.test.ts, src/northpole/map-pins-ride.test.ts, the
  walking pins in src/northpole/map-pins-level.test.ts and
  src/northpole/world-pin.test.ts, and smoke/the-factory.spec.ts).
- An indoor level draws its room, its floor and its walls, and never the sky,
  fence, string lights or snowfall, while outdoor levels and the North Pole
  draw exactly as before (enforced by: src/northpole/indoor-pins.test.ts,
  src/northpole/map-pins-indoor.test.ts, and the unchanged pins in
  src/northpole/map-pins-level.test.ts and src/northpole/render-pins-scene.test.ts).
- Only an attraction or a level's square stands on a display; a booth that
  asks for one keeps its stall, and `readStall` keeps `display` only when
  it's `true` (enforced by: src/northpole/display.test.ts,
  src/northpole/frame-protocol-stall.test.ts).
- A level that fails shows "Closed for repairs" on its platform, none of its
  squares run, and the reasons go to the console once (not enforced yet).
- The kill switch has a separate `levels` list; a switched-off level keeps
  its credit and runs none of its squares (enforced by:
  src/northpole/levels.test.ts, and the level list in smoke/levels.spec.ts
  skips them).
- The whole folder, squares included, is held to the size budget (enforced
  by: scripts/square-size.test.ts).
- A participant may change their own level folder, and nobody else's
  (enforced by: scripts/check-booth-ownership.ts, scripts/ownership.test.ts).
- A North Pole level's folder is the maintainers' only, even for someone
  whose login is its id (enforced by: scripts/ownership.ts,
  scripts/ownership.test.ts).
- Every stall of The Factory has its step of the tour, in the order the ride
  stops at them from the boarding station (enforced by:
  src/factory-tour.test.ts).
- A North Pole level's panel and its stalls' panels credit nobody, and its
  landmark's room takes the sleigh inside (enforced by: src/level-panel.test.ts,
  src/history.test.ts, src/visit-help.test.ts and smoke/the-factory.spec.ts).
- Only a North Pole level links out, only to https addresses, from
  maintainer code and never from level data; each link is built with DOM
  calls and opens in a new tab with `rel="noopener"` (enforced by:
  src/northpole/north-pole-links.test.ts, src/level-links.test.ts,
  src/visit-hud-links.test.ts, src/level-panel.test.ts and
  smoke/north-pole-places.spec.ts).
- A level's panel is the visit panel, with its name and description set only
  as text, steps aside inside a square and never covers the way home
  (enforced by: src/level-panel.test.ts, and the panel test at desktop and
  phone width in smoke/levels.spec.ts).
- A level's pull request waits for a maintainer (enforced by:
  scripts/merge-gate-requests.ts, which only takes booth requests, and
  scripts/auto-merge-booths-pulls.test.ts).

## Where it lives

`carnival/levels/`, `src/northpole/level.ts`, `src/northpole/level-check.ts`,
`src/northpole/level-check-places.ts`, `src/northpole/level-props.ts`,
`src/northpole/show.ts` (and the files it draws with), `src/northpole/coaster-ride.ts`,
`src/northpole/coaster-pieces.ts`, `src/northpole/coaster-rules.ts`,
`src/northpole/ride.ts`, `src/northpole/ride-map.ts`, `src/northpole/ride-draw.ts`,
`src/northpole/room.ts`, `src/northpole/display.ts`,
`src/northpole/levels.ts`,
`src/northpole/north-pole-levels.ts`, `src/northpole/north-pole-links.ts`,
`src/level-links.ts`, `src/factory-tour.ts`, `src/level-hud.ts`,
`src/level-panel.ts`,
`src/northpole/world-plots.ts` (`platformPlot`), `src/level-page.ts` (`renderLevel`),
`eslint.config.js`.

## Tested by

`src/northpole/level.test.ts` (runs `validateLevel` on every real level),
`src/northpole/level-props.test.ts` (the show's footprints and placement),
`src/northpole/coaster-ride.test.ts` (the ride's timing, heights and circuit,
and the ticket's way), `src/northpole/coaster-rules.test.ts` (the coaster's
and a ride level's rules), `src/northpole/coaster-pieces.test.ts`,
`src/northpole/coaster.test.ts` and `src/northpole/coaster-fittings.test.ts`
(the coaster, its fittings and its ticket pinned, and laid and checked in a
level), `src/northpole/ride.test.ts` (the car's stops, riding on and coming
round), `src/northpole/ride-map.test.ts` and
`src/northpole/map-pins-ride.test.ts` (riding on the map, pinned),
`src/northpole/show.test.ts` (each one pinned, moving, varied and in the theme),
`scripts/square-lint.test.ts` (level data held to plain data),
`smoke/levels.spec.ts` (walks every open level, or rides a ride level, to
each square and home), `smoke/the-factory.spec.ts` (from the landmark into
The Factory, riding to each stall's station and inside it, and round to the
sleigh home, at desktop and phone width, and from the landmark's room),
`smoke/north-pole-places.spec.ts` (the same for The Academy and The Recording
Studio, with their links out), `src/northpole/north-pole-levels.test.ts`,
`src/northpole/north-pole-links.test.ts`, `src/level-links.test.ts`,
`src/visit-hud-links.test.ts`, `src/northpole/north-pole-places-pins.test.ts`
(their squares' drawings pinned),
`src/factory-tour.test.ts`, `src/level-hud.test.ts`, `src/level-panel.test.ts`,
`src/northpole/levels.test.ts`,
each level square's `square.test.ts`.
