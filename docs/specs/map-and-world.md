# Map and world

The North Pole is a small isometric world that visitors walk round. Every
square stands on a numbered plot, and the page's hash decides what is shown.

## Behaviour

- The banner names the site, "Carnival Factory", with this edition's tag,
  "Christmas edition", beside it (left out on a screen under 480 pixels), and
  the page's title is "Carnival Factory – Christmas edition". Both come from
  `src/edition.ts`, which the build writes into `index.html`, so a future
  edition changes one constant (enforced by: src/edition.test.ts). The North
  Pole is the place inside this edition, not the site's name. The words
  visitors read follow the [glossary](../glossary.md).

- The world has a town square in the middle, an avenue off each side and lanes
  off the avenues. Attractions stand on 3 by 3 plots in rings round the town
  square, booths on 2 by 2 plots along the lanes. Each attraction stands as
  its landmark, and each booth as its stall shape, the one it chose or the
  one its id picks, so no two neighbours need look alike (ADR 0042).
- There are always 3 open plots on top of the booths and the construction
  sites, which visitors see as free spots: each has a "Free spot" sign, its
  tag says "Free spot", and the call to action at it says "Build your booth
  here". A click, E or Enter at one opens the booth form.
- The player walks with WASD or the arrow keys, or by clicking a tile, and
  pathfinding finds the way. Walkers step diagonally only where no corner is cut.
- E, Enter or a click at a square goes inside it. From afar, the player is put
  at its door first. Esc on the map lets go of the picked square.
- The call to action over a door sits above its square, kept on the map, and
  steps below "Back to the North Pole" or "Built with Tessl" in the top-left
  corner rather than cover it, so the way home can always be clicked
  (`src/northpole/prompt-spot.ts`).
- On a touch screen the first tap on a structure shows its tag, the second
  opens it. One finger drags the map, two fingers pinch the zoom.
- With a mouse, a press of the primary button that moves past a tap's slop
  (`TAP_SLOP` in `src/northpole/pointer.ts`) drags the map the same way, on the
  North Pole and on levels, ride levels too: the camera follows the mouse,
  the cursor turns to `grabbing` while it does, and letting go is not a click,
  so the player neither walks nor opens a square. A press that barely moves
  still walks, opens or rides on as a click. Inside a square's room the mouse
  is the square's to play with and never drags the camera. The map's
  label says dragging it looks around (`src/northpole/map-touch.ts`).
- A roadside billboard, high on braced steel legs with a catwalk and
  spotlights, stands in open snow beside the main road east, in the opening
  view, and says what's on next: AI DevCon, next in London, 7–8 June 2027 at The
  Brewery. A click on it opens the tickets page in a new tab, and the pointer
  turns to a hand over it (`src/northpole/billboard.ts`).
- "Get a booth" walks the player to the nearest free spot. "Show the whole
  island" toggles the overview.
- Zoom, on every device and on levels too: a "+" and "−" pair of buttons
  ("Zoom in", "Zoom out") to the left of "Show the whole island", above "Get
  a booth" on a phone, and in the bottom-right corner on a level; the `+` or
  `=` and `-` keys, unless typing in a field or with Ctrl, Cmd or Alt; and the
  wheel over the map, or a trackpad's pinch (the wheel with Ctrl), round the
  pointer, which keeps the page from scrolling under the map. Each button
  turns off at its limit. The zoom the visitor chooses, by any of these or by
  pinching, stays while the player walks, and the overview going on or off
  lets go of it. Inside a square nothing zooms, and the wheel scrolls the page.
  The Controls hint says "+ / − to zoom".
- Camera: a viewport under 720 CSS pixels wide is a phone. On a laptop the
  camera fits the carnival and comes in by up to 0.35 while the player walks,
  never nearer than 1.25. On a phone it follows the player at 0.75. A pinch,
  the zoom buttons, the keys and the wheel go no farther out than the whole
  island and no nearer than 1.5; a walk that has taken the camera nearer than
  1.5 never makes zooming in take it farther. The camera
  never shows past the island's bounds. A walk, or the overview, takes the
  camera back from where a finger, or the mouse, left it.
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
  the map, with a "Get a booth" link for a booth.
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
- There are always open plots (free spots), and every plot is reachable from the town
  square (enforced by: src/northpole/world.test.ts).
- Route names are lower-cased and must match `[\w-]+`; anything malformed is
  the plain map (enforced by: src/route.test.ts). A name from the address is
  only ever set as text, capped in length (enforced by: the deep-link tests in
  smoke/deep-links.spec.ts and smoke/levels.spec.ts).
- An open page never reloads twice for the same build (enforced by:
  src/updates.test.ts).
- The visitor's zoom stays between the whole island and 1.5, whatever zooms
  it (enforced by: src/northpole/camera-view.test.ts,
  src/northpole/map-zoom.test.ts, smoke/zoom.spec.ts).

## Where it lives

`src/main.ts`, `src/router.ts`, `src/page.ts`, `src/map-page.ts`,
`src/map-page-markup.ts`, `src/map-notes.ts`, `src/dom.ts`, `src/route.ts`,
`src/updates.ts`, `src/northpole/world.ts`,
`src/northpole/world-plots.ts`, `src/northpole/world-build.ts`,
`src/northpole/world-town.ts`, `src/northpole/world-sights.ts`,
`src/northpole/groundwork.ts`, `src/northpole/walking.ts`,
`src/northpole/pathfinding.ts`, `src/northpole/plots.ts`,
`src/northpole/plots.json`, `src/northpole/camera.ts`, `src/northpole/camera-view.ts`
(the zoom's maths: `zoomBy`, `wheelZoom`),
`src/northpole/map.ts` (starting the map and wiring it to the page) with its
parts in `src/northpole/map-*.ts`, which share one `MapRun`
(`map-state.ts`; the zoom buttons, wheel and keys are `map-zoom.ts` and
`map-zoom-buttons.ts`), `src/northpole/draw-square.ts`, `src/northpole/visit.ts`,
and the drawing:
`src/northpole/render.ts`, which hands each thing and plot to the small file
that draws it (`ground.ts`, `island.ts`, `sky.ts`, `pines.ts`, `houses.ts`,
`street-things.ts`, `midway.ts`, `entrance.ts`, `people.ts`, `faces.ts`,
`name-board.ts`, `stall.ts` with `stall-catalogue.ts`, `stall-default.ts` and
the `stall-*.ts` files, `pavilion.ts`, `landmarks.ts` with `landmark-parts.ts`
and the `landmark-*.ts` files, `tower.ts`, `open-plot.ts`, `site.ts`, `platform.ts` and `plot-marks.ts`).

## Tested by

`src/route.test.ts`, `src/router.test.ts`, `src/router-levels.test.ts`,
`src/page.test.ts`, `src/map-page.test.ts`, `src/dom.test.ts`,
`src/updates.test.ts`, `src/northpole/world.test.ts`,
`src/northpole/world-build.test.ts`, `src/northpole/world-plots.test.ts`,
`src/northpole/world-sights.test.ts`, `src/northpole/world-pin.test.ts`,
`src/northpole/walking.test.ts`, `src/northpole/pathfinding.test.ts`,
`src/northpole/plots.test.ts`, `src/northpole/camera.test.ts`,
`src/northpole/draw-square.test.ts`, `src/northpole/map-*.test.ts` (the
map running in happy-dom through `src/test-support/map-harness.ts`, with
`map-pins-*.test.ts` pinning what it draws frame by frame),
`src/northpole/visit.test.ts`,
`src/northpole/render-pins-plots.test.ts` and
`src/northpole/render-pins-scene.test.ts` (every drawing, pinned by its
fingerprint), `smoke/map.spec.ts` (walking, fitting the window),
`smoke/zoom.spec.ts` (the zoom buttons, the wheel and the keys, at 1500 by 900
and 390 by 844, and on a level),
`smoke/deep-links.spec.ts` and `smoke/claiming.spec.ts` (open plots).
