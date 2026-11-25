# 0035. The North Pole has levels of its own, opened from a landmark

- Status: Proposed
- Date: 2026-11-25
- Pull requests: #180
- Spec: [levels.md](../specs/levels.md), [attractions.md](../specs/attractions.md)

## Context

Issue #180 asks for The Factory: a level that walks visitors through how a
booth gets built, one stall per step, owned by the North Pole rather than a
participant, with a landmark on the home map that takes the sleigh into it.
Until now a level was a participant's: `carnival/levels/<login>/`, which the
ownership check gives to that login ([0011](0011-levels-are-plain-data.md)).
The map, the router, the sleigh station, the sandbox's frame address and the
level checks all key a level by that folder name.

## Decision

- A North Pole level is a folder in `carnival/levels/` like any other,
  `carnival/levels/the-factory/`, plain data plus sandboxed squares, checked by
  `validateLevel`. It has no platform at the sleigh station: its landmark is
  the way in ([ADR 0042](0042-attractions-stand-as-what-they-are.md)). Its id is in
  `NORTH_POLE_LEVELS` in `src/northpole/north-pole-levels.ts`.
- The ownership check gives a North Pole level's folder only to maintainers,
  even to someone whose GitHub login is the level's id: that person keeps
  their booth folder, never the level.
- Its landmark is an attraction with the same id,
  `carnival/attractions/the-factory/`. On the home map, opening it (a click,
  E or Enter) goes to `#/level/<id>` rather than
  its room. Its own `#/attraction/<id>` still shows its room, like every
  attraction's, so the smoke and flashing checks play its drawing, and that
  room's panel offers the sleigh inside.
- Its panels credit the North Pole, not a login. Each of The Factory's stalls
  tells its step of the loop from fixed text in the page's own code
  (`src/factory-tour.ts`), with its link to the real thing, so no square's
  code carries a link.

## Alternatives considered

- **A folder of its own**, such as `carnival/north-pole-levels/<id>/`. It
  needs no reserved names, but every part that finds, routes, frames and
  checks levels would need a second source and a second address form. Not
  worth it for one level; this decision can move to it if more come.
- **The level inside the attraction's folder.** Ownership would come for
  free, but an attraction folder holding a level breaks the one-folder,
  one-square shape both kinds rely on.
- **A landmark drawn by the map** rather than an attraction. It would need its
  own drawing, hover tag and plot kind in `render.ts` and `map.ts`, which are
  already past the size limit; an attraction gets all of that already.

## Consequences

- A level id in `NORTH_POLE_LEVELS` is reserved: a participant whose login
  matches it can't have a level. Pick North Pole level ids that read as names,
  not as anyone's login.
- The squares' frames still address the level as `level/<id>/<square>`, so
  the sandbox and its checks are unchanged.
- The level's numbers, such as requests and builds, are not drawn by its
  squares, which can't read the build's data; the panel links to the
  factory's numbers page instead. Baking them into a square is left for later.
