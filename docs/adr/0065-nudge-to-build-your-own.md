# 0065. A well-timed nudge to build your own, and the Academy's ticket as a real request

- Status: Accepted
- Date: 2026-11-28
- Spec: [map-and-world.md](../specs/map-and-world.md),
  [attractions.md](../specs/attractions.md),
  [squares-and-sandbox.md](../specs/squares-and-sandbox.md)

## Context

A visitor already meets "Get a booth" in the intro, the top bar, every
booth's panel and the free spots' signs. The maintainer wants to guide
newcomers to building their own better, "without getting annoying". The ask
is everywhere at once, so it is easy to stop seeing; what's missing is the
right moment, and a first step that is less work.

## Decision

- **One nudge, at the right moment.** On the North Pole's map, when the
  player comes out of a square, a small line slides in over the map's foot:
  "Liked that one? There's a free spot nearby for a booth of your own." "Show
  me →" walks the player to the nearest free spot (the same walk as "claim the
  spot next door"), and "Not now" closes it for good, remembered in the page's
  own storage. It shows only:
  - a minute or more after the page opened;
  - after 20 seconds inside one square, or a third square visited;
  - once a page load, going by itself after 15 seconds;
  - never for a visitor who said which booth is theirs, or who is already
    claiming a spot (`src/nudge.ts`).
- **The Academy's ticket becomes the real request.** The Academy's game has
  the visitor write a pretend ticket: a booth and a look. Its "Ask for a booth"
  now opens the booth form filled in with that idea: the title, the name, and
  what the booth shows in that look. The nine combinations are fixed
  addresses in maintainer code (`src/northpole/booth-ideas.ts`), added to the
  Academy's links after its five ways on. The game asks for one by number,
  and the page opens only the list's own copy. These links stay off the
  panel, which keeps its one "Ask for a booth" (`panel: false`). A place may
  now have up to 16 links.

## Consequences

The ask comes once, when a visitor has just enjoyed something, and points at
a real place on the map rather than a form. Someone who played the Academy
starts their request half written. Nothing new reaches a square, and no
address a square names is ever opened.
