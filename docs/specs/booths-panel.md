# Booths panel

The Booths panel over the map helps visitors find a square: search, a few
short lists, every booth A to Z, and a way to say which booth is theirs.

## Behaviour

- Sections, each with a count and folding: Featured (the ferris wheel), Near
  you (the 5 nearest squares, updated every second), Recently added (the 5
  newest booths, hidden when no dates are known), Attractions, and All booths
  A to Z, 20 at a time with "Show more".
- Search matches a name or login, ignoring case and accents and a leading
  `@`. Results that start with the search come first, then A to Z.
- `/` focuses the search, except in a text field or inside a square. The
  arrow keys move through the results and wrap, Enter jumps to one, Esc clears.
- A click on a name glides the map to the square and highlights it; a second
  click lets go. Shift-click or the walk icon walks the player there.
- "This is me" picks the visitor's own booth, which the map marks as theirs.
  "Share it as yours" in a visit panel sets it too.
- The panel starts open on a wide map and folded on a phone.

## Rules

- Names come from the build (read from each square's source), so the panel
  can sort and search before frames open; a frame's own name replaces it once
  ready (enforced by: scripts/share-pages.test.ts for reading the name).
- Search folds case, accents and a leading `@`; starts-with results come
  first; All booths shows 20 at a time; Recently added leaves out booths with
  no date (enforced by: src/booth-panel.test.ts, scripts/booth-dates.test.ts).
- Security: "This is me" and the folded sections are kept in the page's local
  storage only, never given to a square, and a stored login must match
  `[\w-]{1,39}` (enforced by: src/booth-panel.test.ts for reading it back,
  src/booths-hud-memory.test.ts). Every name and login is set as text
  (enforced by: src/booths-hud.test.ts).

## Where it lives

`src/booths-hud.ts` (with its markup, lists, keys and memory in
`src/booths-hud-*.ts`), `src/booth-panel.ts`, `scripts/booth-dates.ts`,
`vite.config.ts` (`__SQUARE_NAMES__`, `__BOOTH_ADDED__`).

## Tested by

`src/booth-panel.test.ts`, `src/booths-hud.test.ts`, `src/booths-hud-keys.test.ts`,
`src/booths-hud-memory.test.ts`, `scripts/booth-dates.test.ts`,
`smoke/squares.spec.ts` (picking, shift-click to walk, finding a login).
