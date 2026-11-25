# 0042. Built-in attractions stand as what they are

- Status: Accepted
- Date: 2026-11-25
- Spec: [attractions.md](../specs/attractions.md), [booths.md](../specs/booths.md),
  [levels.md](../specs/levels.md), [map-and-world.md](../specs/map-and-world.md),
  [squares-and-sandbox.md](../specs/squares-and-sandbox.md)

## Context

Every attraction on the home map stood as the same striped pavilion with its
drawing on the front; only The Factory differed, as a tower asked for with
`stall.tower`. The maintainer wants each one "visually different on the map
and appropriate in shape for the attraction": a Ferris wheel that is a wheel,
an ice rink that is ice. They also want the same variety for the booths and
levels' squares people make, "otherwise it gets boring": five stall shapes,
and the market stall for everyone who named none, made the lanes look alike.

The North Pole's own levels also showed up twice on the home map: as their
landmark attraction and as a platform at the sleigh station. "For the
built-in ones they are attractions."

## Decision

- An attraction asks for a **landmark** in its own `stall`, as plain data:
  `stall: { shape, roof, trim?, landmark, letters? }`, `landmark` one of
  `LANDMARKS` (`big-wheel`, `merry-go-round`, `big-top`, `coaster`,
  `ice-rink`, `gingerbread-house`, `shopfront`, `cocoa-hut`, `game-stall`,
  `schoolhouse`, `studio`, `tower`), and `letters` the tower's capitals. It
  replaces `stall.tower`: The Factory asks for `landmark: 'tower', letters:
'TESSL'` and draws exactly as before. `shape` and `roof` still dress the
  attraction's room inside.
- `readStall` checks it like the rest of the option, and `stallFor` drops
  `landmark` and `letters` from any square that isn't an attraction, before
  the map ever sees them: a booth or a level's square can't stand as one.
- Each landmark is drawn by the map in its own small file at the 3 by 3
  plot's size (`landmark-*.ts`, looked up in `landmarks.ts`), and still shows
  the attraction's own drawing framed in gold under its name board
  (`landmark-parts.ts`), because the map opens a square's sandboxed frame
  only when it paints it, and the smoke and flashing checks play that drawing.
- Booths and levels' squares get eleven more **stall shapes**: `igloo`,
  `gazebo`, `chalet`, `treehouse`, `windmill`, `lighthouse`, `food-truck`,
  `carousel`, `turret`, `barn` and `pagoda`, each planned in one row of
  `stall-catalogue.ts` (its height, outline, the room's material inside and
  its sign board) and drawn in its own `stall-*.ts`.
- A square that names no `stall` gets a shape and colours **picked from its
  id** (`stall-default.ts`), the same every time. The factory's skills tell
  it to choose a shape that suits each booth unless the request names one.
- Only participants' levels have a platform at the sleigh station. The North
  Pole's own levels are reached by their landmark only.

## Alternatives considered

- **Keep `tower` and add a field per landmark.** Every new landmark would be
  another field and another branch in `drawPlot`; one name looked up in a
  table is one entry and one file.
- **A landmark chosen by the map from the attraction's id.** No data in the
  attraction, but the map would hard-code the attractions it knows, and a
  new attraction couldn't choose. The attraction's own data says what it is.
- **The market stall as the default for a square that names none.** Familiar,
  but it is what made the lanes look alike. A pick from the id is as stable,
  and a booth that wants a particular shape still names it.

## Consequences

- The map is varied without any request, and every existing booth that named
  no shape changed its look once, on purpose (its pins were updated).
- A new landmark or stall shape is one name, one row or entry, and one small
  drawing file, pinned with `drawingOf` and `fingerprint`.
- A landmark is drawn by the map, never by the attraction's code, so it stays
  within the house rules and the flashing limit like everything else the map
  draws.
- Visitors reach The Factory, The Academy and The Recording Studio only from
  their landmarks, which smoke/the-factory.spec.ts and
  smoke/north-pole-places.spec.ts walk.
