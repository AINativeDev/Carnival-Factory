# Squares and the sandbox

Every booth, attraction and level square draws through one contract, and the
page never runs a square's code: each runs in its own sandboxed frame and worker.

## Behaviour

- A square is a `NorthPoleSquare`: `id`, `name`, `description`, an optional
  `stall`, and `draw(ctx, size, time, pointer?, keys?)`. It paints a `size` by `size`
  square from the origin. `time` is milliseconds since the page loaded.
- `pointer` is `{ x, y, down, presses }` while the mouse or a finger is over
  the square, in the square's own coordinates, and `undefined` otherwise.
  `presses` counts presses since the square's last frame. On the map the square
  under the pointer gets it, and a click still goes inside. Inside, the
  drawing fills the screen beside the panel and gets the pointer and taps.
- `keys` lists the keys pressed since the square's last frame, in order, by
  plain names: `left`, `right`, `up`, `down`, `enter` and `space`. The map
  hears them only while the player is inside a square, where they no longer
  walk the player or scroll the page; Enter on the panel's own buttons and
  links stays theirs, and none carries over to the next square. At most 8 go
  with a frame, the rest with the next, and the frame and the worker keep only
  a list of those names (`readKeys` in `src/northpole/square-keys.ts`,
  [ADR 0064](../adr/0064-keys-inside-a-square.md); enforced by:
  src/northpole/square-keys.test.ts, src/northpole/map-input.test.ts,
  src/northpole/sandbox-messages-edges.test.ts,
  src/northpole/frame-protocol-draw.test.ts,
  src/northpole/square-worker-draw.test.ts).
- `ask()`, optional, is called after each frame: `{ open: n }` asks the page
  to open the square's `n`th link out, a whole number from 0 to 7, checked in
  the worker and again on the page (`readLinkAsk`). The page opens it only
  for a North Pole place with links (`northPoleLinks`) and only within 1.5
  seconds of a tap on the page, one tab a tap, so a booth, or a square asking
  on its own, opens nothing. What opens is the list's own copy of the address
  (`allowedLinkOut`), so nothing from the page's address reaches a new tab.
  `{ visit: '<place id>' }` asks the page to go to another North Pole place,
  an id of up to 40 lower-case letters, digits and dashes (`readVisitAsk`).
  The page goes there under the same rules, and only to a place on its own
  list, the Factory, the Academy, the Studio and AI DevCon
  (`visitablePlace`), with the list's copy of the id, by `squareLink`
  ([ADR 0063](../adr/0063-factory-and-academy-explain.md)). When an ask names
  both, the link wins (`src/visit-link-out.ts`; enforced by:
  src/northpole/square-ask.test.ts, src/visit-link-out.test.ts,
  src/northpole/square-worker.test.ts, src/northpole/frame-protocol.test.ts).
- `stall` is `{ shape, roof, trim?, landmark?, letters?, scene? }`: shape one of
  `STALL_SHAPES` (`stall`, `shed`, `tent`, `cabin`, `kiosk`, `igloo`,
  `gazebo`, `chalet`, `treehouse`, `windmill`, `lighthouse`, `food-truck`,
  `carousel`, `turret`, `barn`, `pagoda`); roof and trim the names of `theme`
  colours. The map draws the stall, with the square's drawing on its front.
  A square that sets no `stall` gets a shape and colours picked from its id,
  the same every time (`src/northpole/stall-default.ts`). `landmark` and
  `letters` are for attractions only (see attractions.md); the map drops them
  from a booth's or a level's square (`stallFor`). `scene`, any square's
  choice, is the mood round its drawing while someone is inside it, one of
  `SCENES`: `glow` (the default, a soft glow of its own colours) or
  `chiaroscuro` (darkness all round, with one warm pool of light from the
  upper left); a mood never shades the drawing itself (`src/northpole/visit-scenes.ts`; enforced by:
  src/northpole/visit-scenes.test.ts, src/northpole/frame-protocol-stall.test.ts).
- Each square's frame starts on its first draw. Until a frame arrives it shows
  "Opening…". A frame not drawn for 20 seconds is released and restarts when
  drawn again. At most 24 frames run at once; the least recently drawn goes.
- A square that doesn't say it's ready within 10 seconds, errors 3 times in a
  row, or errors while loading, is broken and shows "Under construction".
- Inside the frame, the square's code gets 1000 ms to load and 1000 ms per
  frame, or the worker is terminated. The map counts a frame not answered
  within 2000 ms as an error.
- A square in the kill switch, `src/northpole/disabled.json`, shows "Closed for
  repairs" and gets no frame at all, so its code never loads.

## Rules

- Security: each square runs in `<iframe sandbox="allow-scripts">` loading
  `square.html`, with an opaque origin and no referrer, under the CSP
  `default-src 'none'; script-src 'self'; img-src 'self' data: blob:;
connect-src 'none'; worker-src blob:; frame-src 'none'; form-action 'none';
base-uri 'none'`. No network, storage or access to the page (enforced by:
  the CSP in square.html, the sandbox test in smoke/squares-play.spec.ts).
- The worker is built into the frame's own script and started from a `blob:`
  URL, so it keeps the frame's CSP and loads nothing from a URL (enforced by:
  smoke/safari.spec.ts).
- The map checks every message from a frame: name capped at 60 characters,
  description at 200, a bitmap only at the size it asked for; anything else is
  ignored (enforced by: src/northpole/frame-protocol.test.ts).
- The frame sends only to the map's own origin, and hears only messages from
  its parent window at that origin (`MAP_ORIGIN`, the frame's address, since
  its own origin is opaque). The map sends to the frame with `'*'`: an opaque
  origin has nothing else to name, and a draw request carries nothing private
  (enforced by: src/northpole/frame.test.ts).
- The frame checks every draw request (size up to 2048) and pointer: finite
  `x`, `y` within `0..size`, boolean `down`, `presses` a whole number from 0
  to 20. Only those four fields reach the square (enforced by:
  src/northpole/frame-protocol-draw.test.ts).
- `readStall` keeps only a known shape, theme colour names, a known landmark
  and one to six capitals of letters; anything else draws the stall the id
  picks. Only an attraction keeps its landmark (enforced by:
  src/northpole/frame-protocol-stall.test.ts, src/northpole/stall-default.test.ts,
  the stall tests in smoke/stall-shapes.spec.ts).
- Messages from any window but the frame's own, or of the wrong shape, are
  ignored by the map (enforced by: src/northpole/sandbox-messages.test.ts);
  worker messages the frame isn't waiting for are ignored too (not enforced
  yet: no test).
- A square that hangs is stopped: 10 seconds to open, 2 seconds to answer a
  draw request, and 3 errors in a row (a good frame forgives them), or one
  before it opens, and it shows "Under construction" (enforced by:
  src/northpole/sandbox-frames.test.ts, src/northpole/sandbox-messages.test.ts);
  1000 ms to load or draw a frame in the worker (not enforced yet: no test).
- A square's frame starts only when the map draws it, so only squares in view
  wake. At most 24 frames run at once, and one not drawn for 20 seconds is
  released; a released square keeps its name and last picture, and a broken
  one stays broken (enforced by: src/northpole/sandbox.test.ts,
  src/northpole/sandbox-frames.test.ts).
- A tap made while a frame is busy drawing is kept for its next draw request,
  at most 20 presses at a time (enforced by:
  src/northpole/sandbox-messages.test.ts).
- Registries freeze each square, refuse an id that isn't a lower-case login
  (booths) or kebab-case (attractions), and refuse duplicates (enforced by:
  src/northpole/square.test.ts).
- A square's code reaches nothing outside its square by the plain ways
  (enforced by: ESLint house rules, scripts/square-lint.test.ts,
  scripts/square-code.ts for booths, Tessl Code Review, review-house-rules
  lens).
- Size budget: 50 KB of code gzipped (`.ts` files, tests left out) and 200 KB
  of other files (README left out), per booth, attraction or whole level
  (enforced by: scripts/square-size.test.ts).
- The kill switch has separate lists for booths, attractions and levels, and
  a switched-off square's draw never runs (enforced by:
  src/northpole/square.test.ts, src/northpole/booths.test.ts,
  src/northpole/attractions.test.ts). Only maintainers change it (enforced by:
  scripts/check-booth-ownership.ts).

## Where it lives

`src/northpole/square.ts`, `src/northpole/sandbox.ts` (the stand-in square and
its frame's lifecycle), `src/northpole/sandbox-schedule.ts` (which frames run),
`src/northpole/sandbox-frame.ts` (the frame element and the placeholders),
`src/northpole/sandbox-messages.ts` (what passes between the map and a frame),
`src/northpole/sandbox-run.ts` (what the map knows of a running square),
`src/northpole/frame.ts`,
`src/northpole/square-worker.ts`, `src/northpole/frame-protocol.ts`,
`src/northpole/pointer.ts`, `square.html`, `scripts/square-size.ts`,
`src/northpole/disabled.json`.

## Tested by

`src/northpole/square.test.ts`, `src/northpole/sandbox.test.ts`,
`src/northpole/sandbox-frames.test.ts` and `src/northpole/sandbox-messages.test.ts`
(in happy-dom, with the fake frames in `src/northpole/sandbox-fakes.ts`),
`src/northpole/frame-protocol.test.ts` (a frame's messages),
`src/northpole/frame-protocol-draw.test.ts` (draw requests and the pointer),
`src/northpole/frame-protocol-address.test.ts`,
`src/northpole/frame-protocol-stall.test.ts`, `src/northpole/pointer.test.ts`,
`scripts/square-size.test.ts`, `smoke/squares-play.spec.ts` (the sandbox keeps a
square from the network, storage and the page; every square opens and draws
within budget), `smoke/safari.spec.ts`.
