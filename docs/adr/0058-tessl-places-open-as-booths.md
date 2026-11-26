# 0058. The Tessl places and AI DevCon open as booths

- Status: Accepted
- Date: 2026-11-26
- Spec: [attractions.md](../specs/attractions.md),
  [map-and-world.md](../specs/map-and-world.md),
  [visit-panel-and-history.md](../specs/visit-panel-and-history.md)
- Replaces the link-out part of [ADR 0055](0055-levels-and-year-in-review-behind-flags.md)

## Context

While levels wait behind their flag, the Factory, the Academy and the Studio
opened their own sites in a new tab, and the AI DevCon billboard opened its
tickets page. A click took the visitor off the map before they had seen
anything. The maintainer wants each to "act as a booth too", with its link
out working from inside: the Factory about skills and loops, then signing
up; the Studio about recording, speaking and listening; the Academy a
multiple-choice quiz; AI DevCon a conference room of speakers and
attendees, its billboard kept as it is.

## Decision

- Opening the Factory, the Academy or the Studio from the map, while `levels`
  is off, goes inside its own attraction, `#/attraction/<id>`, like any
  booth (`squareLink(kind, id, levels)` in `src/route.ts`). With `levels` on
  it takes the sleigh into the level, as before.
- Each one's drawing is its own small interactive piece, and its panel shows
  its links out: the Factory's "Sign up for Tessl", the Academy's "Start the
  Academy", the Studio's podcast and YouTube (`NORTH_POLE_LINKS`).
- AI DevCon is an attraction with no stall of its own: the billboard stays
  where it is and is its way in. A click on it opens `#/attraction/ai-devcon`,
  whose panel has "Get tickets" (`src/northpole/off-map.ts`).
- Each game opens its links from inside too: a square's optional `ask()`
  returns `{ open: n }` on the frame a tap hits its button, and the page
  opens that place's `n`th link, only for the North Pole's own places and
  only just after a real tap (`src/visit-link-out.ts`).
- `landmarkLinkOut` and the billboard's own tickets link are removed.

## Consequences

Every way in from the map now stays on the map first, and the link out is
one tap further, inside what the place has just shown. A square still can't
open anything itself: it asks, and the page decides.
