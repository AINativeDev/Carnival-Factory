# 0038. The North Pole's own levels link out, from maintainer code

- Status: Accepted
- Date: 2026-11-25
- Spec: [levels.md](../specs/levels.md), [attractions.md](../specs/attractions.md)

## Context

Two more North Pole levels join The Factory ([0035](0035-north-pole-levels.md)):
The Academy, a stall for each section of the Tessl Academy, and The Recording
Studio, for the podcast and the YouTube channel. Both are only worth visiting
if a visitor can go on to the real thing. A square can't link anywhere: it
runs sandboxed, with no network and no access to the page. A level's
`level.ts` is plain data a participant writes ([0011](0011-levels-are-plain-data.md)),
so a link field there would let anyone put any address on our page.

## Decision

- The links live in maintainer code, `NORTH_POLE_LINKS` in
  `src/northpole/north-pole-links.ts`, keyed by a North Pole level's id. A
  level that isn't in `NORTH_POLE_LEVELS` gets none, whatever the list holds,
  and only https addresses pass.
- They show as buttons right under the description, on the level's own
  panel, on its landmark's room and on each of its squares' panels. Each is
  built with DOM calls, never as HTML, and opens in a new tab with
  `rel="noopener"`.
- `NorthPoleLevel` gets no link field: participant level data can't link out.

## Alternatives considered

- **A `links` field in `NorthPoleLevel`, allowed only for North Pole ids.**
  The data would sit with the level, but the level checks, the ESLint
  plain-data rules and the review lens would all need a field only some
  levels may use, and one mistake in that gate puts a participant's address
  on the page.
- **Text in each square's drawing**, such as a printed web address. Nobody can
  click a drawing, and a phone can't copy it.
- **The Factory's tour pattern** (`src/factory-tour.ts`), a story and a link
  per stall. Worth it for a walk through a process; these levels need the
  same few links everywhere, so one list per level is simpler.

## Consequences

- Adding or changing a link is a maintainer's change to one file, with a
  unit test that participant levels never get one.
- The links aren't checked for being live: a moved page needs a change here.
