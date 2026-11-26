# 0057. A visit is the booth, not a room

- Status: Accepted
- Date: 2026-11-26
- Spec: [visit-panel-and-history.md](../specs/visit-panel-and-history.md),
  [squares-and-sandbox.md](../specs/squares-and-sandbox.md)

## Context

Going inside a square showed a small room: side walls matched to its stall, a
window, a sign with its name, a pinboard of how it was built, the player
walking on the floor, and the square's drawing on the back wall at a fixed
480 pixels. Booths are more and more games, and on the back wall they were
small. A Full screen button tried the drawing on its own, as big as the space
beside the panel allows, and the maintainer found it more immersive: "fill
the booth square with the content, no more of the room part".

## Decision

Inside a square there is no room. On a laptop its drawing is the biggest
square left of the panel, from top to bottom and flush against it, at the screen's own
pixels; on a phone held upright it fills the width above the panel's sheet.
The rest of the screen is a soft, dimmed glow of the drawing's own colours,
so the page blends into it; a square may choose another mood instead,
`stall.scene`, such as `chiaroscuro`: darkness and one warm pool of light
from the upper left. A mood never shades the drawing itself, which would dim
a game's own score; a square that wants drama lights its own drawing. Nobody walks inside: a click or a drag is the
square's. The panel is a full-height column flush against the drawing, the
two reading as one: its head names the square and its maker, with Share and
Full screen beside them. The way back to the map is a round arrow. The room's code, its walls,
pinboard and walking, is removed.

## Consequences

- Booths need no change: each draws to whatever size it's given, up to
  `MAX_SIZE`, and games get the space they need.
- The build story is told once, in the panel; the pinboard's notes are gone.
- Leaving is Esc, Leave or Back, never walking out of a doorway.
- Drawing bigger costs more per frame on a large screen; `MAX_SIZE` caps it.
