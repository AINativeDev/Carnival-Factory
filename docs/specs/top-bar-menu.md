# Top bar menu

A small menu of places in the top bar, so the useful parts of the site are
one click away from anywhere, on a laptop and on a phone.

## Behaviour

- The bar has the brand ("Carnival Factory · Christmas edition") at its left,
  then the menu, then the GitHub link at its right.
- The browser tab shows the brand's icon, `public/favicon.svg`: a red and
  cream striped carnival tent with a gold pennant on snow, against the map's
  night blue, in the theme's colours. A phone's home screen gets the same
  picture as `public/apple-touch-icon.png` (enforced by: smoke/sharing.spec.ts).
- The menu's places, in order, each a Lucide-style line icon (`aria-hidden`)
  and a short label:
  - **Map**: `#/`, the North Pole's map.
  - **Booths**: opens the map's Booths panel ([Booths panel](booths-panel.md))
    with its search focused. From anywhere else, a square, a level or the
    factory's numbers, it goes to `#/` first, then opens the panel.
  - **Get a booth**: the booth form (`BOOTH_REQUEST_URL`), in a new tab.
  - **Feedback**: the feedback form (`FEEDBACK_URL`, `05-feedback.yml`), in a
    new tab.
  - **About**: opens the first-visit intro ([intro](intro.md)). It took the
    place of the banner's "What is this?".
- The Advent calendar, remixes and badges get no item yet: they wait behind
  feature flags for launch, and the place an Advent item would go is marked
  in `src/top-menu-items.ts`.
- The current place has `aria-current="page"`: only **Map** is ever current,
  on `#/` and the map's deep links, and the mark follows the address.
- Its links are plain hash links, so picking one while inside a square
  leaves the square the way every other link does.
- From 1024 pixels wide, each item shows its icon and label. From 720 to 1023,
  its icon alone, with the label kept for screen readers and as a tooltip,
  and the GitHub link shows its mark alone.
- Below 720 pixels the places fold behind one **Menu** button
  (`aria-expanded`, `aria-controls`). It opens the list below the bar, with
  focus on its first item. Escape, a second press of **Menu** or a pick closes
  it, with focus back on **Menu**; a click outside closes it too.
- The bar is at most 48 pixels high, never scrolls sideways, and covers none
  of the map's zoom buttons, "Show the whole island" or the Controls panel,
  at 1500 by 900 and at 390 by 844.
- Colours and fonts come from the theme's tokens in `src/style.css`.

## Rules

- Every label and address in the menu is the site's own, never a
  participant's text (enforced by: `src/top-menu-items.test.ts`).
- The forms open in a new tab with `rel="noopener"` (enforced by:
  `src/top-menu-items.test.ts`, `smoke/menu.spec.ts`).
- Every icon is hidden from screen readers; each item's name is its label
  (enforced by: `src/top-menu-items.test.ts`).
- The bar never scrolls sideways and covers no map control (enforced by:
  `smoke/menu.spec.ts`, `smoke/map.spec.ts`).

## Where it lives

- `src/top-menu-items.ts`: the places, their icons, the current place and the
  markup.
- `src/top-menu.ts`: building it into the banner, the phone's Menu, Escape and
  focus, and opening the Booths panel.
- `src/main.ts` starts it before the intro, whose About button it provides.
- `src/style.css`: the bar's layout at each width.

## Tested by

- `src/top-menu-items.test.ts`, `src/top-menu.test.ts`
- `smoke/menu.spec.ts`, `smoke/intro.spec.ts`
