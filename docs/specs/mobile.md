# Mobile

The map works on a phone: fingers drag and pinch the camera, taps visit
squares and play with them, and the panels move out of the way.

## Behaviour

- A viewport under 720 CSS pixels wide is framed as a phone's (`isPhone`). The
  camera follows the player close up at zoom 0.75, instead of fitting the
  carnival as it does on a laptop. "Show the whole island" still shows all of it.
- One finger drags the map round. The island moves with the finger and the
  camera stops where it would show past the island's bounds. The camera stays
  where the finger left it until the player walks, goes to a square, or the
  overview goes on or off.
- Two fingers pinch the zoom: nearer as they spread, farther as they close,
  never farther out than the whole island and never nearer than 1.5. What was
  under the fingers stays under them. When a finger lifts, the pinch goes on
  from the two fingers left, if there are two.
- Dragging and pinching only apply to touch pointers, and not while inside a
  square.
- On a touch screen the first tap on a structure shows its tag, the second
  opens it. A tap on the ground walks there. The call to action over a door
  says "Tap" instead of "E" on a coarse pointer.
- A press that moves more than 8 CSS pixels is a drag, not a click, so it
  doesn't open anything.
- A square gets taps through `pointer`: `presses` counts every press since its
  last frame, so a quick tap between two frames still counts, and a tap shows
  as `down` for at least 150 ms. After a finger lifts off, the square keeps
  seeing the pointer for 150 ms.
- Layout at `max-width: 719px`:
  - the banner's GitHub link shows only its mark, without the word "GitHub";
  - the visit panel sits below the room, across the bottom, at most 43% high;
  - "How was this built?" starts folded (by `matchMedia`).
- The Booths and Controls panels start folded when the map frame is phone width.
- Inside a square, or on the factory's numbers, "Back to the map" takes the
  top-left corner and "Built with Tessl" hides. Leave and Esc also work.
- On the map the page never scrolls: the diorama fills the window under the
  banner (`100dvh`), and the canvas has `touch-action: none`.
- With reduced motion, the prompt, tags and panels don't animate.

## Rules

- Squares never see the page's touch or pointer events, only the checked
  `{ x, y, down, presses }`, with `presses` capped at 20 a frame (enforced by:
  src/northpole/frame-protocol-draw.test.ts, the pointer tests in
  smoke/squares.spec.ts).
- Pinch zoom stays between the whole island and 1.5, and a drag never shows
  past the island (enforced by: src/northpole/camera.test.ts).
- A press that moves more than 8 CSS pixels is not a click (enforced by:
  src/northpole/pointer.test.ts).
- The map fits a 390 by 844 window with no scrolling, and `#/factory` fits
  its width (enforced by: smoke/squares.spec.ts).
- The phone width is one number, 720 in `src/northpole/camera.ts`, matched by
  the CSS breakpoint `max-width: 719px` (not enforced yet).
- Squares must open in Safari on an iPhone: the square worker is inlined into
  the frame's script, because Safari reads `script-src 'self'` in an
  opaque-origin frame as matching nothing (enforced by: smoke/safari.spec.ts
  in the `webkit` project).

## Where it lives

`src/northpole/camera.ts` (`isPhone`, `PHONE_ZOOM`, `MAX_PINCH_ZOOM`,
`dragCentre`, `pinchZoom`, `pinchCentre`), `src/northpole/map.ts` (touch,
tap and press tracking), `src/northpole/pointer.ts` (`TAP_SLOP`),
`src/style.css`, `src/map-page.ts` (`renderHud`), `src/visit-hud.ts`,
`src/northpole/frame.ts`.

## Tested by

`src/northpole/camera.test.ts`, `src/northpole/pointer.test.ts`,
`smoke/safari.spec.ts` (the `webkit` project in `playwright.config.ts`, as an
iPhone 13: the squares in view open and none is broken), and
`smoke/squares.spec.ts` at 390 by 844: deep links open the map on the square,
`#/factory` fits with no horizontal scroll, the map fits the window with no
scrolling, and inside a booth its drawing gets the pointer and taps by touch.
