# Checks and tests

What runs on every pull request, and what each check guarantees.

## Behaviour

- `npm run check` runs `lint` (ESLint, markdownlint, the JSON check, Knip),
  Prettier's check, `typecheck` (`tsc --noEmit` and the strict baseline) and
  Vitest with coverage. CI runs it and `npm run build` on every pull request
  and push to main.
- Vitest runs `{src,carnival,scripts,lint}/**/*.test.ts` in Node, configured in
  `vitest.config.ts`.
- On a pull request, CI checks that 99% of the lines it adds to `src/`,
  `scripts/` and `lint/`, and of the branch arms on them, ran under the unit tests, and runs ShellCheck and
  actionlint.
- The smoke run in CI records the page's own JavaScript coverage
  (`smoke/coverage.ts`, `COVERAGE=1`) and adds it to the unit tests' line by
  line (`npm run coverage:combined`), listing the files with the most untested
  lines ([ADR 0032](../adr/0032-browser-coverage-counts.md)).
- Claude Code hooks (`.claude/settings.json`) check each file an agent edits,
  and run types, Knip and the tests before it finishes. When the installed packages
  don't match `package-lock.json`, the Stop hook says only that, and asks for
  `npm install`, since a stale install fails the checks for reasons that aren't
  the code's (enforced by: scripts/hooks/install-drift.test.ts).
- **Booth ownership** runs on every pull request (see [booths](booths.md)).
- `npm run smoke` is Playwright against the built site on port 4173, one
  worker. Projects: `chromium` at 1200 by 1000 (or the local Chrome with
  `PLAYWRIGHT_CHANNEL=chrome`), and `webkit` as an iPhone 13, which runs only
  `smoke/safari.spec.ts`. Every test starts with the first-visit intro seen
  (`storageState`), except `smoke/intro.spec.ts`, which tests it.
- The smoke test plays every booth and attraction not switched off: it opens,
  draws within budget (slowest frame after 5 warm-up frames: 16 ms on CI,
  8 ms locally) and stays quiet (no console errors, uncaught errors or
  requests to another origin). It also checks the sandbox keeps a square from
  the network, storage and the page, the map's own frame budget (25 ms on CI),
  deep links, stall shapes, Share, the season card, badges, `#/factory`,
  walking, visiting and leaving, construction sites, the Booths panel, fitting
  the window, the pointer, and history layout. Each part of the map has its
  own spec file, and what they share (the squares, the budgets, the request
  check, reading the map's camera and stage) is in `smoke/support/`.
- `smoke/levels.spec.ts` walks every open level from its arrival to each
  square, inside each one, and to the sleigh home. `smoke/level-walk.ts`
  walks to each door in steps, each a click on the furthest tile of the way
  that is on the canvas and not under a structure (where the map shows the
  pointer cursor, since a click there opens it), so a door the camera doesn't
  show yet is still reached.
- `smoke/flashing.spec.ts` plays every booth and attraction on the back wall
  of its room and measures flashes.
- Feature flags ([ADR 0046](../adr/0046-launch-behind-feature-flags.md)): the unit tests build with every flag off, as the live
  site does, and `switchFlags` in `src/test-support/feature-flags.ts` switches
  one on for a `describe`, so each gate is tested on and off. The smoke test
  reads the same `FEATURE_FLAGS` setting as its build (`smoke/support/feature-flags.ts`):
  it leaves out an attraction a flag holds back, skips a check for a hidden
  feature, and `smoke/feature-flags.spec.ts` checks each hidden feature is gone.
- Smoke scope: when every changed file is inside one booth's folder, CI sets
  `SMOKE_ONLY=booth/<login>` and plays only that booth one by one; the
  map-wide tests still run. Anything else plays every square.

## Rules

- Flashing (after WCAG's three flashes rule): a flash is a pair of opposite
  changes in relative brightness of at least 0.1. The square is sampled as an
  8 by 8 grid, and at most a quarter of its cells may flash more than 3 times
  in any one second (enforced by: smoke/flashing.spec.ts, scripts/flashing.ts,
  scripts/flashing.test.ts). Level squares are not in the flashing check
  (not enforced yet).
- Every booth and attraction opens, draws within the frame budget and stays
  quiet, and every open level walks from arrival to each square and home
  (enforced by: smoke/squares-play.spec.ts, smoke/levels.spec.ts).
- The house rules reach every square: every `.ts` and `.js` file under
  `carnival/booths`, `carnival/attractions` and each level's `squares/` runs
  with `no-restricted-globals`, `no-restricted-imports` and `no-eval` at error,
  and `fetch` is flagged in each. Every level's `level.ts` is held to plain
  data. So if squares move and the rules don't, the check fails (enforced by:
  scripts/square-lint-reach.test.ts).
- Every booth, attraction and level fits the size budget, and every real
  level passes `validateLevel` (enforced by: scripts/square-size.test.ts,
  src/northpole/level.test.ts).
- The smoke test plays only the changed booth when nothing else changes, and
  every square otherwise (enforced by: scripts/smoke-scope.ts,
  scripts/smoke-scope.test.ts, .github/workflows/preview-build.yml).
- The factory's sandbox can't start a browser, so agents there never run the
  smoke test; CI runs it (enforced by: the instructions in tessl.json).
- No native dependencies: `npm ci` is the whole setup for `npm run check`
  (not enforced yet).
- A code file has at most 200 lines, with no exceptions and no baseline
  ([ADR 0036](../adr/0036-no-oversize-files.md); enforced by: ESLint
  `max-lines`, lint/file-size.js, scripts/file-size.test.ts).
- No unused files, exports or dependencies (enforced by: Knip, `knip.json`).
- Markdown is linted and JSON parses (enforced by: markdownlint-cli2,
  scripts/check-json.ts).
- Shell scripts and workflows pass ShellCheck and actionlint (enforced by: the
  `shell` job in .github/workflows/ci.yml).
- Workflow patterns that find squares start from `carnival/` (enforced by:
  scripts/workflow-paths.test.ts).
- Strict TypeScript: new code has no strict compiler errors or strict lint
  findings, and the baselines for older code only shrink, except that carnival
  files only have to stay within theirs (enforced by: tsconfig.strict.json,
  scripts/strict-types.ts, `strictTypeChecked` with eslint-suppressions.json).
- Baselines only shrink: a pull request may lower a number in a baseline or
  drop an entry, never raise one, add one or add a baseline file (enforced
  by: scripts/baselines-shrink.ts, the "Baselines only shrink" step in
  .github/workflows/ci.yml).
- Coverage: 99% of added lines, and of the branch arms on them, in `src/`,
  `scripts/` and `lint/` ([ADR 0031](../adr/0031-changed-branches-too.md)), and
  every file there holds 99% of its lines, branches, functions and statements,
  file by file, with no exceptions and no floor to raise; squares in
  `carnival/` count in the combined browser and unit coverage instead
  ([ADR 0044](../adr/0044-coverage-per-file.md)) (enforced by:
  scripts/diff-coverage.ts, the per-file thresholds in vitest.config.ts).
- The docs name only files that exist, and the ADR index lists every record
  (enforced by: scripts/docs-paths.test.ts). Whether the prose is still true,
  names say why, and changes are tested first and end to end (enforced by:
  the review-craft lens; not on carnival pull requests).

## Where it lives

`package.json`, `.github/workflows/ci.yml`,
`.github/workflows/preview-build.yml`, `playwright.config.ts`, `smoke/`,
`scripts/smoke-scope.ts`, `scripts/flashing.ts`, `eslint.config.js`,
`lint/`, `knip.json`, `.markdownlint-cli2.jsonc`, `tsconfig.strict.json`,
`vitest.config.ts`, `scripts/diff-coverage.ts`, `scripts/strict-types.ts`,
`scripts/check-json.ts`, `scripts/docs-paths.ts`, `scripts/hooks/`,
`.claude/settings.json`, `plugins/north-pole/skills/review-craft/`.

## Tested by

`scripts/smoke-scope.test.ts`, `scripts/flashing.test.ts`,
`scripts/square-lint.test.ts`, `scripts/square-lint-reach.test.ts`,
`scripts/square-size.test.ts`, `src/northpole/level.test.ts`,
`scripts/file-size.test.ts`, `scripts/diff-coverage.test.ts`,
`scripts/strict-types.test.ts`, `scripts/check-json.test.ts`,
`scripts/docs-paths.test.ts`, `scripts/workflow-paths.test.ts`,
`scripts/hooks/hooks.test.ts`, `scripts/hooks/install-drift.test.ts`.
`scripts/e2e-coverage/convert.test.ts`, `scripts/e2e-coverage/floor.test.ts`.
