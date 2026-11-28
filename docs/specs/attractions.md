# Attractions

Attractions are the North Pole's own squares round the town square, such as
the ferris wheel. Nobody owns them, and only maintainers change them.

## Behaviour

- Every folder in `carnival/attractions/` with an `attraction.ts` is an
  attraction. It stands on a 3 by 3 spot in the rings round the town square.
  Today's spots are pinned in `src/northpole/spots.json`.
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
  - Gingerbread Fun House: `gingerbread-house`, icing, gumdrops and a wonky roof,
    its name on a tall board that wraps onto two lines, with elves queueing and
    waving a ticket, a candy-cane lamp, gumdrop string lights, a pennant and
    chimney smoke (`src/northpole/landmark-gingerbread-life.ts`);
  - Gift Shop: `shopfront`, a display window, an awning and presents outside;
  - Hot Cocoa Stand: `cocoa-hut`, a round hut with a giant steaming mug on its roof;
  - Snowball Toss: `game-stall`, a counter, targets and a snowball pile, with an
    elf throwing at the targets, two more queueing with tickets, pennants,
    candy-cane prizes and a lamp under the hood;
  - The Academy: `schoolhouse`, with a bell tower and lit windows;
  - The Recording Studio: `studio`, with a glowing ON AIR sign, a dish and an antenna;
  - The Year in Review: `gallery`, a cream museum with columns, '26 → '27 on
    its frieze under a pediment, lit windows and a gold dome;
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
- Inside, every attraction is a mini game: a score, a challenge that rises,
  an end card with the best of the visit, a tap to play again, and a demo that
  plays itself while nobody does, which is what the map shows. Each one's
  README says how it plays:
  - Santa's Big Top, Juggling Elf: tap each falling bauble to toss it back up;
    a ringside elf throws in another every 5 catches; a drop ends the act.
  - Hot Cocoa Stand, Cocoa Rush: build each elf's order from five topping
    buttons, in order, before their patience runs out; three walk-offs end the
    shift.
  - Ferris Wheel, Boarding Time: tap as an empty car passes the gate to board
    the next elf; a full wheel earns a lap bonus; three misses close the ride.
  - Frozen Pond, Curling: drag back and let go to throw, tap to sweep; five
    stones an end, three ends, wind each end.
  - Gingerbread Fun House, Icing Echo: tap back the tune the house lights on
    its windows, door and gumdrop; it grows each round, and the mirrors swap
    notes from round 4. Each right note sticks a treat on the house.
  - Reindeer Carousel, Ring Grab: tap as your reindeer passes the brass arm to
    grab its ring, silver or gold; three misses end the ride.
  - Sleigh-Ride Coaster, Boost & Brake: hold to push, let go to coast; too
    fast over a crest flies the sleigh off the rails; catch presents in the air.
  - Snowball Toss: three rounds of eight snowballs at the sliding tin snowmen,
    with wind, combos and a gold snowman.
  - The Factory, the Recording Studio, the Academy and AI DevCon have their own
    games, which open their links from inside
    ([ADR 0058](../adr/0058-tessl-places-open-as-booths.md)).
- The Factory, The Academy, The Recording Studio and The Year in Review are landmarks: with
  `levels` on, opening one from the map, by a click, E or Enter, takes the
  sleigh into the North Pole's level of the same id rather than into a room.
  With `levels` off, as on the live site, the Factory, the Academy and the
  Studio open their own rooms like any booth, each an interactive piece whose
  panel has its links out ([ADR 0058](../adr/0058-tessl-places-open-as-booths.md)). `#/attraction/<id>`
  still shows its room, whose panel has a link to take the sleigh inside
  ([ADR 0035](../adr/0035-north-pole-levels.md)). The Academy (spot 10) is a
  schoolhouse with a swinging bell, and The Recording Studio (spot 11) a
  studio with a glowing ON AIR sign, and The Year in Review (spot 12) a
  gallery ([year-in-review.md](year-in-review.md)). None has a platform at the sleigh
  station: the landmark is the way in. Their rooms
  show their level's links out as buttons ([ADR 0038](../adr/0038-north-pole-links.md)).
  Each link out to another site is tagged `utm_source=carnival-factory`,
  `utm_campaign=christmas-edition` and `utm_medium=<the place's id>`, such as
  `the-studio`; the Year in Review's GitHub form is left as it is
  (`northPoleLinks` in `src/northpole/north-pole-links.ts`). The Factory's
  panel has "Sign up for Tessl" and the Academy's "Start the Academy", each
  followed by the same ways on: "Ask for a booth", "Get AI DevCon tickets",
  "Read the Tessl blog" and "Listen to the podcast"
  ([ADR 0063](../adr/0063-factory-and-academy-explain.md)). AI DevCon's room
  has "Get tickets".
- AI DevCon is an attraction with no stall: the billboard by the road is its
  way in, and a click on it opens its room (`src/northpole/off-map.ts`).
- The Gift shop shows the gifts of `plugins/north-pole-gifts/`: small factory
  loops anyone can install on their own repository. It waits behind the
  `giftShop` feature flag ([ADR 0046](../adr/0046-launch-behind-feature-flags.md)), off on the live site: until then the
  registry leaves it out (`attractionShown` in `src/feature-flag-names.ts`),
  so it isn't on the map, in the Booths panel's Attractions, at
  `#/attraction/gift-shop` (which says it isn't there) or among the share
  pages, and its pinned spot stays empty.

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
`src/northpole/spots.json`, `plugins/north-pole-gifts/`.

## Tested by

`src/northpole/attractions.test.ts`, `scripts/gift-shelf.test.ts`, each
attraction's own `attraction.test.ts`, `smoke/squares-play.spec.ts`,
`smoke/flashing.spec.ts`, `smoke/the-factory.spec.ts`,
`smoke/north-pole-places.spec.ts`, `smoke/square-pointer.spec.ts` (a tap inside the
Sleigh-Ride Coaster starts a run), `src/route.test.ts` (a landmark opens its
level), `src/visit-help.test.ts`, `src/visit-hud-links.test.ts`,
`src/northpole/north-pole-places-pins.test.ts`, `src/northpole/landmarks.test.ts`
(each landmark pinned, its drawing painted once under its name),
`src/northpole/landmark-gingerbread.test.ts`, `smoke/square-pointer.spec.ts`
(playing the fun house with a mouse and a finger),
`src/northpole/frame-protocol-stall.test.ts`, `src/northpole/sandbox-messages.test.ts`
(only an attraction keeps its landmark), `src/map-page.test.ts` (no platform
for the North Pole's own levels).
