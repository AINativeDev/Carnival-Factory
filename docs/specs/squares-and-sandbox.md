# Squares and the sandbox

Every booth, attraction and level square draws through one contract, and the
page never runs a square's code: each runs in its own sandboxed frame and worker.

## Behaviour

- A square is a `NorthPoleSquare`: `id`, `name`, `description`, an optional
  `stall`, and `draw(ctx, size, time, pointer?)`. It paints a `size` by `size`
  square from the origin. `time` is milliseconds since the page loaded.
- `pointer` is `{ x, y, down, presses }` while the mouse or a finger is over
  the square, in the square's own coordinates, and `undefined` otherwise.
  `presses` counts presses since the square's last frame. On the map the square
  under the pointer gets it, and a click still goes inside. Inside, the
  drawing fills the back wall and gets the pointer and taps.
- `stall` is `{ shape, roof, trim? }`: shape one of `stall`, `shed`, `tent`,
  `cabin`, `kiosk`; roof and trim the names of `theme` colours. The map draws
  the stall, with the square's drawing on its front.
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
  the CSP in square.html, the sandbox test in smoke/squares.spec.ts).
- The worker is built into the frame's own script and started from a `blob:`
  URL, so it keeps the frame's CSP and loads nothing from a URL (enforced by:
  smoke/safari.spec.ts).
- The map checks every message from a frame: name capped at 60 characters,
  description at 200, a bitmap only at the size it asked for; anything else is
  ignored (enforced by: src/northpole/frame-protocol.test.ts).
- The frame checks every draw request (size up to 2048) and pointer: finite
  `x`, `y` within `0..size`, boolean `down`, `presses` a whole number from 0
  to 20. Only those four fields reach the square (enforced by:
  src/northpole/frame-protocol.test.ts).
- `readStall` keeps only a known shape and theme colour names; anything else
  draws the usual stall (enforced by: src/northpole/frame-protocol.test.ts,
  the stall tests in smoke/squares.spec.ts).
- Messages from any window but the frame's own, and worker messages the frame
  isn't waiting for, are ignored (not enforced yet: no test).
- A square that hangs is stopped: 1000 ms to load or draw a frame in the
  worker, 10 seconds to open, 3 errors in a row and it shows "Under
  construction" (not enforced yet: no test).
- At most 24 frames run at once, and one not drawn for 20 seconds is
  released (enforced by: src/northpole/sandbox.test.ts).
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

`src/northpole/square.ts`, `src/northpole/sandbox.ts`, `src/northpole/frame.ts`,
`src/northpole/square-worker.ts`, `src/northpole/frame-protocol.ts`,
`src/northpole/pointer.ts`, `square.html`, `scripts/square-size.ts`,
`src/northpole/disabled.json`.

## Tested by

`src/northpole/square.test.ts`, `src/northpole/sandbox.test.ts`,
`src/northpole/frame-protocol.test.ts`, `src/northpole/pointer.test.ts`,
`scripts/square-size.test.ts`, `smoke/squares.spec.ts` (the sandbox keeps a
square from the network, storage and the page; every square opens and draws
within budget), `smoke/safari.spec.ts`.
