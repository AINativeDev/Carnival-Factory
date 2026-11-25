# 0040. Indoor levels: a room with back walls, furniture and items on displays

- Status: Accepted
- Date: 2026-11-25
- Spec: [levels.md](../specs/levels.md)

## Context

The maintainer asked for The Recording Studio and The Academy to feel like
being inside: a studio with gear you walk up to and find out about, and a
classroom. Until now every level was an island of snow under the sky, with a
fence and string lights round it, and its squares stood on market stalls. A
level is plain data ([ADR 0035](0035-north-pole-levels.md)), so a room has to
be something the engine draws from data, with no code in the level, and
without changing how any outdoor level looks.

## Decision

- A level may say `indoor: true`. The engine then draws a room in place of
  the island: a wooden floor everywhere its own ground doesn't say otherwise,
  the floor's cut edge where the snow slab was, and two papered and panelled
  walls with a skirting board, a cornice and warm wall lamps along its two
  back edges, cut away like a doll's house. There is no sky, northern lights,
  fence, string lights or snowfall; the room stands in the dark, tinted by
  the level's theme. Outdoor levels and the North Pole draw exactly as before.
- Two new ground tiles, `floor` and `carpet`, may be laid in any level.
- The catalogue gains furniture: `plant`, `shelf`, `rug`, `sofa`, `desk` (a
  teacher's desk when its variant is over a half), `globe`, `spotlight` and
  `cable`, the rug and the cable flat on the floor for people to walk over.
  And things that hang on a back wall: `acoustic-panel`, `wall-window`,
  `blackboard`, `projector-screen`, `on-air-light` and `wall-door`. A wall
  prop stands on the wall's own row of tiles: on row 0 it runs along the upper
  right wall, on column 0 down the upper left one, its footprint turned to
  match. Only an indoor level may place one, and `validateLevel` says so.
- A square may ask for `stall: { ..., display: true }`. A level's square or an
  attraction then stands as an item to discover: a low plinth with a cloth in
  its `roof` colour, its name on a gold plaque, and its drawing on a framed
  card on top. Like a tower, a booth's display is ignored and it keeps its
  stall, so a booth can't stand out from the others on the map.

## Alternatives considered

- **A theme called `indoor`.** Turned down: the theme picks the tint and the
  signs' colour, and a room should be able to pick those too.
- **Walls as props a level places tile by tile.** Turned down: a level would
  need a line per wall tile, and the walls belong to the room's shape, which
  the engine already knows.
- **Separate left and right kinds of each wall prop.** Turned down: which
  wall a prop hangs on already follows from where it stands, so one kind is
  enough and a level can't put one on the wrong wall.
- **A new stall shape, `display`, in `STALL_SHAPES`.** Turned down: booths
  choose from that list, and a small plinth is meant for the North Pole's own
  rooms; a flag beside `tower` keeps it out of the booths' choices.

## Consequences

The Recording Studio and The Academy are rooms now, and a participant's level
can be one too. Wall props block their tiles, so a room's back row is
furniture, not floor. The cached ground layer of an indoor level is taller,
to hold its walls.

Because a tall display hides the floor just behind it from a click, each
item's door keeps a clear tile on its east that no other display stands in
front of on screen, so a visitor can click their way to it. On a phone's close
camera a furnished room is a long walk of short steps, so the end-to-end test
walks to every item on a laptop and opens each by its own link on a phone.
