# 0063. The Factory and the Academy explain, and send the visitor on

- Status: Accepted
- Date: 2026-11-28
- Spec: [attractions.md](../specs/attractions.md),
  [squares-and-sandbox.md](../specs/squares-and-sandbox.md)
- Builds on [ADR 0058](0058-tessl-places-open-as-booths.md)

## Context

The Factory and the Academy each had a small game and one link out, and
neither said what a software factory is or how a request becomes a booth.
The maintainer wants the Factory to explain the why and the high-level how
(skills, loops, the factory itself), and the Academy the how: first in this
carnival, from a booth request to a booth on the map, then in a Tessl factory
on your own repository. After the Factory, a visitor should be nudged to ask
for a booth or to go to the Academy to learn more, and both should nudge
toward AI DevCon, the blog and the podcast to keep in touch.

## Decision

- Each place's game is a short walkthrough that ends in a game, then an end
  card with its ways on, all drawn in its sandboxed square.
- Both places' links out, in the order their games ask for them: their own
  first ("Sign up for Tessl", "Start the Academy"), then "Ask for a booth"
  (the booth form), "Get AI DevCon tickets", "Read the Tessl blog" and
  "Listen to the podcast" (`NORTH_POLE_LINKS`). The blog's address joins
  `SETTINGS.tessl`.
- A square's `ask()` may also return `{ visit: '<place id>' }`, to send the
  visitor on to another North Pole place, such as from the Factory to the
  Academy. The worker and the page each keep only a plain id (`readVisitAsk`);
  the page goes there only for a North Pole place with links, only to a place
  on its own list (`visitablePlace`: the Factory, the Academy, the Studio and
  AI DevCon), only within 1.5 seconds of a real tap, and with the list's own
  copy of the id (`src/visit-link-out.ts`). The sandbox passes both kinds of
  ask to the page through one listener, `onAsk`.

## Consequences

A square still can't navigate or open anything itself: it asks, and the page
decides, from fixed lists in maintainer code. A booth's ask, or an ask with
no tap behind it, does nothing. Going to another place is a change of the
page's hash, so the back button returns to the place the visitor came from.
