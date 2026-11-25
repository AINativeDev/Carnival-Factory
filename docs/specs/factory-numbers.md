# Factory numbers

`#/factory` shows how much the factory has built, over the map, so visitors
see the loop behind the booths.

## Behaviour

- Reached from "Built with Tessl" on the map, the history panel and
  `share/factory.html`.
- Always shows the build's own counts: booths on the map, attractions, and
  people with a booth.
- With the deploy's numbers it also shows: factory builds and how many
  merged, on their own or with a maintainer; booth requests and how many were
  accepted, asked a question or declined; review findings and how many were
  fixed; and, when any request merged, the fastest and median minutes from
  accepted request to merge. A line says when they were read.
- Without them (a preview or `npm run dev`), it says the rest appear on the
  live map.
- Esc or Leave goes back to the map. While it is open the map takes no keys.

## Rules

- A factory build is a pull request from a `tessl/` branch of this
  repository. Auto-merged ones carry `auto-merged`. A request is accepted the
  first time it got `tessl` (enforced by: scripts/factory-stats.ts,
  scripts/factory-stats.test.ts).
- Security: only numbers and an ISO time reach the page. `readFactoryStats`
  keeps whole numbers of at least 0 and a well-formed time, and drops the
  whole set if any count is missing (enforced by: src/factory.test.ts).
  Every number is set as text (not enforced yet).

## Where it lives

`src/factory.ts`, `scripts/factory-stats.ts`,
`scripts/write-square-history.ts`, `scripts/share-pages.ts`.

## Tested by

`src/factory.test.ts`, `scripts/factory-stats.test.ts`,
`smoke/factory-page.spec.ts` (`#/factory` at 390 and wider, Esc goes back).
