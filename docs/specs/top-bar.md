# Top bar

The banner across the top of every page: the brand, a small menu of the
places a visitor goes, and the way to the repository on GitHub.

## Behaviour

- The bar holds, in order, the brand (a link to `#/`), the menu, and the
  GitHub link at the right.
- The menu's items, each a line icon and a short label:
  - **Map**: `#/`;
  - **Booths**: opens the Booths panel ([Booths panel](booths-panel.md)) and
    puts focus in its search;
  - **Factory stats**: `#/factory` ([Factory numbers](factory-numbers.md));
  - **Advent**: `#/advent` ([Advent calendar](advent-calendar.md));
  - **People's Choice**: unfolds the list below the map
    ([People's Choice](peoples-choice.md)). A build without standings has no
    list, so it has no item either;
  - **Your booth**: the booth request form (`CLAIM_URL`), in a new tab;
  - **About**: the first-visit intro ([First-visit intro](intro.md)), as
    "What is this?" opened it before.
- Booths and People's Choice act on the North Pole's map. Anywhere else,
  inside a square, on a level, the factory's numbers or the advent calendar,
  they first go to `#/`, which leaves the square as Map and the other links
  do, then open their panel.
- The item for the page the address is on is marked with
  `aria-current="page"`: Map on the map (`#/`, with or without a `?booth=`
  or `?attraction=` focus), Factory stats on `#/factory` and Advent on
  `#/advent`. Inside a square, on a level, a season card or `#/keep-posted`,
  none is. Closing the factory's numbers or the advent calendar takes the
  address back to `#/` without a hashchange, so the mark follows the page's
  changes as well as the address's.
- Wide screens, from 1180 CSS pixels, show each item's icon and label. From
  720 to 1179 the items show their icons alone, each still named for screen
  readers and with its tooltip.
- At phone width, under 720, the items fold into one **Menu** button at the
  bar's left, with `aria-expanded`, which opens them as a list below the bar.
  Choosing an item, a click outside the menu, or Escape folds it; Escape gives
  focus back to the button, and the map behind never hears it, wherever in
  the page focus has gone. Choosing an item from the list gives focus back to
  the button too, so the intro About opens returns focus there when it closes.
- Booths or People's Choice chosen off the map wait for it to come back; a
  menu that is stopped first never opens them.

## Rules

- Icons are inline SVG line icons drawn in `currentColor`, never emoji, and
  hidden from screen readers; every item has an `aria-label` and a `title`
  (enforced by: src/top-menu.test.ts).
- The bar never scrolls sideways, on a laptop or at 390 pixels wide
  (enforced by: smoke/top-menu.spec.ts).
- Every item is reachable with Tab, and the phone's menu opens with Enter or
  Space and closes with Escape (enforced by: smoke/top-menu.spec.ts,
  src/top-menu.test.ts).
- The menu's colours come from the theme's custom properties in
  `src/style.css`, and its text is the menu's own, set as text (enforced by:
  review).
- `src/main.ts` starts the menu, and the menu starts the intro, so About is in
  the bar before the intro wires it (enforced by: src/top-menu.test.ts).

## Where it lives

`index.html` (the banner and its empty `nav.top-menu`), `src/top-menu.ts`
(building and wiring the menu), `src/top-menu-items.ts` (the items, their
icons and the current item), `src/style.css`, and its one call in
`src/main.ts`.

## Tested by

`src/top-menu.test.ts`, `src/top-menu-phone.test.ts`,
`src/top-menu-items.test.ts`, and `smoke/top-menu.spec.ts` at 1200 by 1000,
900 by 1000 (icons alone) and 390 by 844: every item opened from the bar, the
current item marked, the phone's menu by keyboard, focus back after About,
and no sideways scroll. The smoke build has no People's Choice standings, so
the browser test sees the item left out, and the unit tests open the list. `smoke/intro.spec.ts` opens the intro again from About.
