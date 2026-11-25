# First-visit intro

A short intro for someone who lands on the map with no idea what it is: what
the North Pole is and how a booth gets built, in three beats, shown once and
easy to skip.

## Behaviour

- It opens as the page loads on a first visit to the map itself (`#/`, or no
  hash at all), over the map.
- It never opens on its own for a shared or deep link (`#/booth/<login>`,
  `#/attraction/<id>`, `#/?booth=…`, `#/level/…`, `#/factory`, `#/advent`,
  `#/season/…`, `#/keep-posted`): those visitors came for something specific.
- Once closed, it stays closed on that browser: the page keeps
  `north-pole-intro-seen` in `localStorage`, read and written inside
  `try`/`catch`, so a browser without storage shows it on every first load of
  `#/`.
- "What is this?" at the left of the banner opens it again at any time, on
  any page. On a phone it shows just a question mark, with the same name for
  screen readers.
- It is a dialog (`role="dialog"`, `aria-modal`, labelled by its title,
  "Welcome to Carnival Factory – Christmas edition", from `src/edition.ts`).
  Focus moves to **Explore the North Pole** as it opens, Tab and Shift+Tab go
  round its buttons and links, and when it closes focus goes back where it
  was, or to the map's canvas when that was nowhere. While it is open the map
  behind hears no keys, and as it opens the map lets go of any key it was
  walking with, so nobody walks on behind it.
- If the route changes while it is open, as with the browser's Back, it
  closes as a skip and leaves focus where the new page put it.
- Its scenes only decorate: it wires every way of closing before it draws
  them, and a scene that can't draw leaves them blank and the intro working.
- Three beats, each a small diorama drawn on a canvas in the dusk palette
  from `theme`, nothing loaded from the network, with one short line:
  **Write an issue** (an elf holds up a letter that writes itself),
  **The factory builds it** (a workshop with a lit window, a turning gear and
  smoke), and **It lands on the map** (a stall pops up on a free spot).
- Then **Explore the North Pole**, which closes it, and **Get a booth**,
  which opens the booth form (`BOOTH_REQUEST_URL`) in a new tab and
  closes it too.
- It closes with Skip, Esc, a click outside it, or either button. Closing
  marks it seen.
- On a phone each beat is a row, its scene beside its line, and nothing is
  wider than a 390-pixel screen.
- With `prefers-reduced-motion: reduce`, each scene is drawn once, still, at
  the moment the letter is written and the stall stands, and the backdrop
  doesn't fade in.

## Rules

- The intro opens on its own only on `#/` (or no hash), and only until it has
  been closed once (enforced by: src/intro.test.ts, smoke/intro.spec.ts).
- Every way of closing it marks it seen and gives focus back, except a route
  change, which leaves focus with the new page (enforced by:
  src/intro.test.ts, src/intro-modal.test.ts, smoke/intro.spec.ts).
- It stays a modal: the map stops walking as it opens, and a scene that can't
  draw never keeps it open (enforced by: src/intro-modal.test.ts).
- It tells analytics `intro_opened` and `intro_closed` with `how`: `skip`
  (Skip, Esc or a click outside), `explore` or `build`, through the page
  event `north-pole-intro`, and nothing else
  ([analytics](analytics.md); enforced by: src/analytics-events.test.ts,
  src/analytics.test.ts).
- `index.html` loads `src/analytics.ts` before `src/main.ts`, so analytics is
  listening when the intro opens on a first visit (enforced by:
  src/analytics.test.ts).
- Its scenes use `theme` colours and the diorama helpers only, and its text is
  set with `textContent` (enforced by: review).
- The rest of the smoke test starts with the intro seen, through
  `storageState` in `playwright.config.ts`, so it never stands between a test
  and the map; only `smoke/intro.spec.ts` starts without it (enforced by:
  smoke/intro.spec.ts).

## Where it lives

`src/intro.ts` (when it opens, and opening and closing it),
`src/intro-dialog.ts` (the dialog's elements), `src/intro-scene.ts` (the
three scenes and their lines), `src/style.css`, the banner in `index.html`, and its
one call in `src/main.ts`.

## Tested by

`src/intro.test.ts`, `src/intro-modal.test.ts`, `src/intro-scene.test.ts`,
`smoke/intro.spec.ts`.
