# Levels

A level is a whole patch of the North Pole of a participant's own,
`carnival/levels/<login>/`, reached by sleigh from the sleigh station.

## Behaviour

- The sleigh station has one 2 by 2 platform per level, 3 tiles apart, along
  the main path by the entrance, sorted by login. E, Enter or a click on an
  open platform takes the sleigh there. A closed level's platform says
  "Closed for repairs" and has no sleigh.
- `#/level/<login>` walks the level's own world, with its name, owner,
  description over the map, and "Back to the North Pole" in the top-left
  corner, where "Back to the map" stands inside one of its squares.
  `#/level/<login>?square=<id>` puts the player in front of a square, and
  `#/level/<login>/<id>` inside it. The sleigh home goes back to `#/`.
- A link to a level that doesn't exist, or is closed, shows the North Pole
  with a note: "There's no level for @<login> yet." or "@<login>'s level is
  closed for repairs." A link to a square a level doesn't have says so too.
- Inside a level's square, the visit panel credits the level's owner, has no
  Remix link and no history, and its "See it in the level" and Share link
  open the level in front of the square.
- The theme (`dusk`, `aurora-night`, `candy-cane`, `frozen-lake`,
  `gingerbread`) tints the sky and colours the signs.
- A level's pull request waits for a maintainer: the auto-merge gate only
  takes booth requests.

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
  least one exit; nothing on water or ice or on top of anything else; and,
  by pathfinding, every square and exit reachable from the arrival tile
  (enforced by: src/northpole/level.test.ts, which also runs it on every real
  level, and smoke/levels.spec.ts).
- A level that fails shows "Closed for repairs" on its platform, none of its
  squares run, and the reasons go to the console once (not enforced yet).
- The kill switch has a separate `levels` list (enforced by: the level list
  in smoke/levels.spec.ts skips them; no unit test).
- The whole folder, squares included, is held to the size budget (enforced
  by: scripts/square-size.test.ts).
- A participant may change their own level folder, and nobody else's
  (enforced by: scripts/check-booth-ownership.ts, scripts/ownership.test.ts).
- A level's pull request waits for a maintainer (enforced by:
  scripts/merge-gate-requests.ts, which only takes booth requests, and
  scripts/auto-merge-booths-pulls.test.ts).

## Where it lives

`carnival/levels/`, `src/northpole/level.ts`, `src/northpole/levels.ts`,
`src/northpole/world.ts` (`platformPlot`), `src/main.ts` (`renderLevel`),
`eslint.config.js`.

## Tested by

`src/northpole/level.test.ts` (runs `validateLevel` on every real level),
`scripts/square-lint.test.ts` (level data held to plain data),
`smoke/levels.spec.ts` (walks every open level to each square and home),
each level square's `square.test.ts`.
