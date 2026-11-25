# Attractions

Attractions are the North Pole's own squares round the town square, such as
the ferris wheel. Nobody owns them, and only maintainers change them.

## Behaviour

- Every folder in `carnival/attractions/` with an `attraction.ts` is an
  attraction. It stands on a 3 by 3 plot in the rings round the town square.
  Today's plots are pinned in `src/northpole/plots.json`.
- It opens at `#/attraction/<id>`, and the map shows it at
  `#/?attraction=<id>`. The map draws it as a pavilion with its drawing on
  the front. Its hover tag names no owner, and inside, the North Pole's emblem
  (a gold star on a red disc) stands where a booth shows its owner's portrait.
- Inside, the visit panel has no Remix link. It says attractions belong to the
  North Pole and offers to claim a booth beside it.
- The ferris wheel is the Booths panel's Featured square.
- The Factory is a landmark: opening it from the map, by a click, E or Enter,
  takes the sleigh into the North Pole's level of
  the same id rather than into a room. `#/attraction/the-factory` still shows
  its room, whose panel has a link to take the sleigh inside
  ([ADR 0035](../adr/0035-north-pole-levels.md)).
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
attraction's own `attraction.test.ts`, `smoke/squares.spec.ts`,
`smoke/flashing.spec.ts`, `smoke/the-factory.spec.ts`, `src/route.test.ts`
(a landmark opens its level), `src/visit-help.test.ts`.
