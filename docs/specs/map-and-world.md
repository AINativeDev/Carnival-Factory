# Map and world

The North Pole is a small isometric world that visitors walk round. Every
square stands on a numbered plot, and the page's hash decides what is shown.

## Behaviour

- The world has a town square in the middle, an avenue off each side and lanes
  off the avenues. Attractions stand on 3 by 3 plots in rings round the town
  square, booths on 2 by 2 plots along the lanes.
- There are always 3 open plots ("For claim") on top of the booths and the
  construction sites. A click, E or Enter at an open plot opens the booth form.
- The player walks with WASD or the arrow keys, or by clicking a tile, and
  pathfinding finds the way. Walkers step diagonally only where no corner is cut.
- E, Enter or a click at a square goes inside it. From afar, the player is put
  at its door first. Esc on the map lets go of the picked square.
- On a touch screen the first tap on a structure shows its tag, the second
  opens it. One finger drags the map, two fingers pinch the zoom.
- "Claim a plot" walks the player to the nearest open plot. "Show the whole
  island" toggles the overview.
- Camera: a viewport under 720 CSS pixels wide is a phone. On a laptop the
  camera fits the carnival and comes in by up to 0.35 while the player walks,
  never nearer than 1.25. On a phone it follows the player at 0.75. A pinch
  goes no farther out than the whole island and no nearer than 1.5. The camera
  never shows past the island's bounds. A walk, or the overview, takes the
  camera back from where a finger left it.
- The Booths and Controls panels start open on a wide map and folded on a phone.
- Routes (`src/route.ts`): `#/` the map; `#/?booth=<login>` or
  `#/?attraction=<id>` the map showing that square; `#/booth/<login>` and
  `#/attraction/<id>` the map with the player inside it (opening a landmark
  from the map goes to its level instead, ADR 0035); `#/level/<login>`,
  `#/level/<login>?square=<id>` and `#/level/<login>/<id>` a level;
  `#/factory`; `#/advent`; `#/season/<login>` a season card; `#/keep-posted`
  a placeholder page; `#/plot/<id>`, a link from before booths were called
  plots, is replaced by `#/booth/<id>`. Anything else is the plain map.
- A deep link to a booth or attraction that isn't there says so in a note on
  the map, with a "Claim it!" link for a booth.
- Leaving a square goes back in history when the visit began from the map,
  otherwise it replaces the address with the map's.
- An open page checks `version.json` every 5 minutes and when it comes back
  into view. A page open under 10 seconds reloads to a new build; an older one
  offers "See what's new". It never reloads twice for the same build.

## Rules

- The world is built from a fixed seed (1225) and the list of squares only,
  never `Math.random()`, so the same squares always make the same world
  (enforced by: src/northpole/world.test.ts).
- A plot's number always means the same place. Adding a booth never moves an
  attraction or an existing booth, and every square on the map today is
  pinned (enforced by: src/northpole/world.test.ts).
- A booth's plot comes from, in order: its pin in `src/northpole/plots.json`,
  else its own `plot.json`, else the lowest free number. A pin wins over a
  `plot.json`. When two `plot.json`s claim one plot, the lower issue number
  keeps it and the other takes the next free plot. A `plot.json` plot that is
  pinned, taken, or at or past booths + 100, falls back to the next free plot
  (enforced by: src/northpole/plots.test.ts).
- Only maintainers change `plots.json` (enforced by:
  scripts/check-booth-ownership.ts).
- There are always open plots, and every plot is reachable from the town
  square (enforced by: src/northpole/world.test.ts).
- Route names are lower-cased and must match `[\w-]+`; anything malformed is
  the plain map (enforced by: src/route.test.ts). A name from the address is
  only ever set as text, capped in length (enforced by: the deep-link tests in
  smoke/deep-links.spec.ts and smoke/levels.spec.ts).
- An open page never reloads twice for the same build (enforced by:
  src/updates.test.ts).

## Where it lives

`src/main.ts`, `src/route.ts`, `src/updates.ts`, `src/northpole/world.ts`,
`src/northpole/world-plots.ts`, `src/northpole/world-build.ts`,
`src/northpole/world-town.ts`, `src/northpole/world-sights.ts`,
`src/northpole/groundwork.ts`, `src/northpole/walking.ts`,
`src/northpole/pathfinding.ts`, `src/northpole/plots.ts`,
`src/northpole/plots.json`, `src/northpole/camera.ts`, `src/northpole/camera-view.ts`,
`src/northpole/map.ts`, `src/northpole/visit.ts`, and the drawing:
`src/northpole/render.ts`, which hands each thing and plot to the small file
that draws it (`ground.ts`, `island.ts`, `sky.ts`, `pines.ts`, `houses.ts`,
`street-things.ts`, `midway.ts`, `entrance.ts`, `people.ts`, `faces.ts`,
`name-board.ts`, `stall.ts` with the `stall-*.ts` files, `pavilion.ts`,
`tower.ts`, `open-plot.ts`, `site.ts`, `platform.ts` and `plot-marks.ts`).

## Tested by

`src/route.test.ts`, `src/updates.test.ts`, `src/northpole/world.test.ts`,
`src/northpole/world-build.test.ts`, `src/northpole/world-plots.test.ts`,
`src/northpole/world-sights.test.ts`, `src/northpole/world-pin.test.ts`,
`src/northpole/walking.test.ts`, `src/northpole/pathfinding.test.ts`,
`src/northpole/plots.test.ts`, `src/northpole/camera.test.ts`,
`src/northpole/map.test.ts`, `src/northpole/visit.test.ts`,
`src/northpole/render-pins-plots.test.ts` and
`src/northpole/render-pins-scene.test.ts` (every drawing, pinned by its
fingerprint), `smoke/map.spec.ts` (walking, fitting the window),
`smoke/deep-links.spec.ts` and `smoke/claiming.spec.ts` (open plots).
