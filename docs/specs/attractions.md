# Attractions

Attractions are the North Pole's own squares round the town square, such as
the ferris wheel. Nobody owns them, and only maintainers change them.

## Behaviour

- Every folder in `carnival/attractions/` with an `attraction.ts` is an
  attraction. It stands on a 3 by 3 plot in the rings round the town square.
  Today's plots are pinned in `src/northpole/plots.json`.
- It opens at `#/attraction/<id>`, and the map shows it at
  `#/?attraction=<id>`. Each attraction stands on the home map as what it is,
  the `landmark` its own `stall` asks for (`LANDMARKS` in
  `src/northpole/stall-style.ts`, drawn by `src/northpole/landmarks.ts` and
  the `landmark-*.ts` files, [ADR 0042](../adr/0042-attractions-stand-as-what-they-are.md)):
  - Ferris Wheel: `big-wheel`, a big wheel turning slowly with lit cars on an A-frame;
  - Reindeer Carousel: `merry-go-round`, reindeer going round under a striped canopy;
  - Santa's Big Top: `big-top`, a tall striped tent with two peaks and flags;
  - Sleigh-Ride Coaster: `coaster`, a hill of track on supports with a sleigh running it;
  - Frozen Pond: `ice-rink`, an oval of ice with a low rail and skaters;
  - Gingerbread Fun House: `gingerbread-house`, icing, gumdrops and a wonky roof;
  - Gift Shop: `shopfront`, a display window, an awning and presents outside;
  - Hot Cocoa Stand: `cocoa-hut`, a round hut with a giant steaming mug on its roof;
  - Snowball Toss: `game-stall`, a counter, targets and a snowball pile;
  - The Academy: `schoolhouse`, with a bell tower and lit windows;
  - The Recording Studio: `studio`, with a glowing ON AIR sign, a dish and an antenna;
  - The Factory: `tower`, a tall brick tower with its `letters`, TESSL, down
    the front in gold, lit windows, a turning cog and chimney smoke
    (`src/northpole/tower.ts`).

  Every landmark still shows the attraction's own drawing, framed in gold
  under its name board, because the map opens a square's frame only when it
  paints it (`src/northpole/landmark-parts.ts`). An attraction with no
  `stall` stands as a pavilion with its drawing on the front. A booth's or a
  level square's `landmark` is dropped (`stallFor`), and a level's square
  stands as its stall, signed by nobody. Its hover tag names no owner, and inside, the North Pole's emblem
  (a gold star on a red disc) stands where a booth shows its owner's portrait.

- Inside, the visit panel has no Remix link. It says attractions belong to the
  North Pole and offers "Get a booth" beside it.
- The ferris wheel is the Booths panel's Featured square.
- The Factory, The Academy and The Recording Studio are landmarks: opening
  one from the map, by a click, E or Enter, takes the sleigh into the North
  Pole's level of the same id rather than into a room. `#/attraction/<id>`
  still shows its room, whose panel has a link to take the sleigh inside
  ([ADR 0035](../adr/0035-north-pole-levels.md)). The Academy (plot 10) is a
  schoolhouse with a swinging bell, and The Recording Studio (plot 11) a
  studio with a glowing ON AIR sign. Neither has a platform at the sleigh
  station: the landmark is the way in. Their rooms
  show their level's links out as buttons ([ADR 0038](../adr/0038-north-pole-links.md)).
- The Gift shop shows the gifts of `plugins/north-pole-gifts/`: small factory
  loops anyone can install on their own repository.

## Rules

- The id is kebab-case and the same as the folder name. The registry refuses
  anything else and duplicates (enforced by: src/northpole/square.test.ts,
  src/northpole/attractions.test.ts).
- Every attraction has a name, a description and a README, and draws at any
  size and time without throwing (enforced by:
  src/northpole/attractions.test.ts).
- An attraction is built exactly like a booth: the same contract, sandbox,
  house rules and size budget, see [squares](squares-and-sandbox.md)
  (enforced by: ESLint house rules, scripts/square-lint.test.ts,
  scripts/square-size.test.ts, Tessl Code Review, review-house-rules lens).
- It lives outside `carnival/booths/`, so only maintainers, or a factory pull
  request for a maintainer-approved issue, may change it (enforced by:
  scripts/check-booth-ownership.ts, .github/workflows/booth-ownership.yml).
- The kill switch keeps a separate `attractions` list (enforced by:
  src/northpole/attractions.test.ts).
- The Gift shop's `GIFTS` and the plugin's skills stay in step: every gift
  skill is on the shelf, and no other (enforced by: scripts/gift-shelf.test.ts).

## Where it lives

`carnival/attractions/`, `src/northpole/attractions.ts`,
`src/northpole/plots.json`, `plugins/north-pole-gifts/`.

## Tested by

`src/northpole/attractions.test.ts`, `scripts/gift-shelf.test.ts`, each
attraction's own `attraction.test.ts`, `smoke/squares-play.spec.ts`,
`smoke/flashing.spec.ts`, `smoke/the-factory.spec.ts`,
`smoke/north-pole-places.spec.ts`, `src/route.test.ts` (a landmark opens its
level), `src/visit-help.test.ts`, `src/visit-hud-links.test.ts`,
`src/northpole/north-pole-places-pins.test.ts`, `src/northpole/landmarks.test.ts`
(each landmark pinned, its drawing painted once under its name),
`src/northpole/frame-protocol-stall.test.ts`, `src/northpole/sandbox-messages.test.ts`
(only an attraction keeps its landmark), `src/map-page.test.ts` (no platform
for the North Pole's own levels).
