# Levels

A level is a whole patch of the North Pole of a participant's own,
`carnival/levels/<login>/`, reached by sleigh from the sleigh station. The
North Pole has levels of its own too, such as The Factory,
`carnival/levels/the-factory/` ([ADR 0035](../adr/0035-north-pole-levels.md)).

## Behaviour

- The sleigh station has one 2 by 2 platform per level, 3 tiles apart, along
  the main path by the entrance, sorted by login. E, Enter or a click on an
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
- A level's pull request waits for a maintainer: the auto-merge gate only
  takes booth requests.
- A North Pole level (`NORTH_POLE_LEVELS` in
  `src/northpole/north-pole-levels.ts`) says "A level by the North Pole", and
  its squares' panels credit nobody. Its landmark is the attraction with the
  same id: opening it on the home map goes to `#/level/<id>`, and its room
  at `#/attraction/<id>` has a link to take the sleigh inside.
- The Factory, `#/level/the-factory`, walks the build loop: from the arrival
  point up one lane past the letter box, the assessment desk and the
  workshop, across, and down the other past the inspection bench, the gate
  and the map, to the sleigh home. A roller coaster runs beside the path, up
  the first lane, over it across the top and down the second, with a loop
  just past each stall's door, and the golden ticket, the visitor's request,
  rides it from the first loop to the last in about 26 seconds. Each stall's panel tells its step in two
  or three sentences, with a link to the real thing and to `#/factory`, from
  fixed text in `src/factory-tour.ts`.

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
  a known theme; `size` odd, 9 to 41; at most 200 ground areas, 200 blocked
  areas and 400 props; only known ground (`snow`, `ice`, `path`, `water`,
  `bridge`) and catalogue props (`LEVEL_PROPS`), inside the level, prop
  variants 0 to 1, at most one pond; at most 8 squares, kebab-case ids, no
  duplicates, every placed square with a folder and every folder placed; at
  least one exit; nothing on water or ice or on top of anything else; each
  coaster piece joining the one listed before it, and each loop on a straight
  run of track; and,
  by pathfinding, every square and exit reachable from the arrival tile
  (enforced by: src/northpole/level.test.ts, which also runs it on every real
  level, and smoke/levels.spec.ts).
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
- Every stall of The Factory has its step of the tour, in the order the path
  passes their doors from the arrival point (enforced by:
  src/factory-tour.test.ts).
- A North Pole level's panel and its stalls' panels credit nobody, and its
  landmark's room takes the sleigh inside (enforced by: src/level-panel.test.ts,
  src/history.test.ts, src/visit-help.test.ts and smoke/the-factory.spec.ts).
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
`src/northpole/levels.ts`,
`src/northpole/north-pole-levels.ts`, `src/factory-tour.ts`, `src/level-hud.ts`,
`src/level-panel.ts`,
`src/northpole/world-plots.ts` (`platformPlot`), `src/level-page.ts` (`renderLevel`),
`eslint.config.js`.

## Tested by

`src/northpole/level.test.ts` (runs `validateLevel` on every real level),
`src/northpole/level-props.test.ts` (the show's footprints and placement),
`src/northpole/coaster-ride.test.ts` (the ride's timing, the ticket's way and
the coaster's rules), `src/northpole/coaster.test.ts` (the coaster and its
ticket pinned, and laid and checked in a level),
`src/northpole/show.test.ts` (each one pinned, moving, varied and in the theme),
`scripts/square-lint.test.ts` (level data held to plain data),
`smoke/levels.spec.ts` (walks every open level to each square and home),
`smoke/the-factory.spec.ts` (from the landmark into The Factory and past each
stall, at desktop and phone width, and from the landmark's room), `src/northpole/north-pole-levels.test.ts`,
`src/factory-tour.test.ts`, `src/level-hud.test.ts`, `src/level-panel.test.ts`,
`src/northpole/levels.test.ts`,
each level square's `square.test.ts`.
