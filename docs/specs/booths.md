# Booths

A booth is one participant's square on the map: the folder
`carnival/booths/<login>/`, which only its owner's requests change.

## Behaviour

- Every folder in `carnival/booths/` with a `booth.ts` is a booth. The build
  finds it, so a new booth needs no change anywhere else.
- A booth's sign shows `@<login>` and the owner's avatar, or an elf's
  silhouette when the build has none. Elf Engineer pins, People's Choice
  trophies and advent decorations are drawn on the stall by the map.
- A booth's stall stands in the shape its `stall` names, one of 16
  (`STALL_SHAPES`), with the drawing on its front and the name board over it.
  A booth with no `stall` gets a shape and colours picked from its login, the
  same every time, so the lanes are varied without any request
  (`src/northpole/stall-default.ts`). The factory picks a shape that suits
  each booth unless the request names one.
- Inside a booth, the visit panel offers Remix this booth, Ask for a change,
  Share it as yours and the owner's season card (see
  [visit panel](visit-panel-and-history.md)).
- A remix starts from "Start from @<login>'s <name>". The factory copies
  `carnival/booths/<login>/` into the author's folder, except `plot.json`, sets
  `id` to the author's login and credits the original at the top of the
  README. It never touches `carnival/booths/<login>/`.

## Rules

- `booth.ts` default-exports a `NorthPoleSquare` whose `id` is the folder
  name, a GitHub login in lower case, with a name and a description (enforced
  by: src/northpole/booths.test.ts, src/northpole/square.test.ts).
- Ownership (security): a pull request may only change
  `carnival/booths/<owner>/` and `carnival/levels/<owner>/`. The owner is the
  pull request's author, or, for the factory's pull request
  (`tessl-app[bot]`), the person who wrote the issue it links with a
  `tessl-factory:issue` marker or a single `Closes #n`. Any other bot's pull
  request has no owner and fails (enforced by: scripts/check-booth-ownership.ts,
  scripts/ownership.test.ts, .github/workflows/booth-ownership.yml).
- Maintainers, matched by numeric user id in `MAINTAINERS`, may change any
  file. So may a factory pull request for an issue where the latest `tessl`
  label was added by a maintainer (enforced by: scripts/ownership.ts,
  scripts/ownership.test.ts).
- The ownership check runs on `pull_request_target` from the default
  branch's code, only reads the changed files from the API, fails a pull
  request whose files GitHub could not list in full, and counts a rename's
  old path too (enforced by: .github/workflows/booth-ownership.yml,
  scripts/check-booth-ownership.ts).
- House rules: imports only from `src/northpole/` and its own folder; no
  network, storage, other windows, page address, Node, `eval`,
  `new Function`, `.constructor`, `import()` or string timers (enforced by:
  ESLint house rules in eslint.config.js, scripts/square-lint.test.ts,
  scripts/square-code.ts, Tessl Code Review, review-house-rules lens).
- Colours and fonts come from `theme` and `canvasFont`, and the README stays
  true to the code (enforced by: Tessl Code Review, review-house-rules lens).
- A test beside a booth may import `vitest` and its own folder, nothing else
  (enforced by: ESLint house rules, scripts/square-lint.test.ts).
- `plot.json`, if present, holds only `{ "plot": <number> }` and maybe
  `"issue": <number>`, and only a new booth's first pull request writes it
  (enforced by: scripts/square-code.ts in the gate,
  scripts/square-code.test.ts).
- Pull requests from outside the repository are closed with a pointer to the
  issue forms, unless the author has write access; the factory's `tessl/`
  branches are left alone (enforced by:
  .github/workflows/outside-pull-requests.yml).

## Where it lives

`carnival/booths/`, `src/northpole/booths.ts`, `scripts/ownership.ts`,
`scripts/check-booth-ownership.ts`, `.github/workflows/booth-ownership.yml`,
`.github/workflows/outside-pull-requests.yml`, `eslint.config.js`,
`src/northpole/links.ts` (`remixUrl`).

## Tested by

`src/northpole/booths.test.ts`, `scripts/ownership.test.ts`,
`scripts/square-lint.test.ts`, `src/northpole/links.test.ts`,
`src/northpole/stall-default.test.ts` (a shape picked from the id),
`src/northpole/render-pins-plots.test.ts` (every stall shape pinned),
`smoke/stall-shapes.spec.ts`, each booth's own `booth.test.ts`.
