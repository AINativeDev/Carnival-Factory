# Checks and tests

What runs on every pull request, and what each check guarantees.

## Behaviour

- `npm run check` runs `lint` (ESLint, markdownlint, the JSON check, Knip),
  Prettier's check, `typecheck` (`tsc --noEmit` and the strict baseline) and
  Vitest with coverage. CI runs it and `npm run build` on every pull request
  and push to main.
- Vitest runs `{src,carnival,scripts,lint}/**/*.test.ts` in Node, configured in
  `vitest.config.ts`.
- The workflows run scripts with plain `node`, which never guesses a file's
  extension, so every file a workflow's script reaches imports its relative
  files with their extension (enforced by: scripts/node-imports.test.ts).
- Each plugin under `plugins/` lists every skill folder it has in its
  `.tessl-plugin/plugin.json`, and every `file:` skill an action in
  `tessl.json` runs is listed there. Tessl resolves an action's skill through
  that manifest when it syncs `tessl.json`, and one skill it can't find fails
  the whole sync, so no Loop runs (enforced by: scripts/plugin-manifests.test.ts).
- On a pull request, CI checks that 99% of the lines it adds to `src/`,
  `scripts/` and `lint/`, and of the branch arms on them, ran under the unit tests, and runs ShellCheck and
  actionlint.
- The smoke run in CI records the page's own JavaScript coverage
  (`smoke/coverage.ts`, `COVERAGE=1`) and adds it to the unit tests' line by
  line (`npm run coverage:combined`), listing the files with the most untested
  lines ([ADR 0032](../adr/0032-browser-coverage-counts.md)).
- Mutation testing (Stryker, `stryker.config.mjs`,
  [ADR 0061](../adr/0061-mutation-testing.md)): on a pull request, CI mutates
  the code files it changes in `src/`, `scripts/` and `lint/`, and each needs
  90% of the changes its tests run caught. Older files below that are frozen
  at their debt in `lint/mutation-baseline.json`, which only shrinks. The
  whole of it runs weekly in `.github/workflows/mutation.yml`, and
  `npm run mutation` runs it locally (enforced by: scripts/mutation-score.test.ts,
  scripts/mutation-check.ts, scripts/baselines-shrink.ts).
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
  pointer cursor, since a click there opens it) nor under anything over the
  map, such as the call to action or the Controls panel, so a door the camera
  doesn't show yet is still reached. Its time limit grows with the level's
  squares: a minute, plus 20 seconds a stop.
- `smoke/flashing.spec.ts` plays every booth and attraction inside it, as
  big as it shows there, and measures flashes.
- Feature flags ([ADR 0046](../adr/0046-launch-behind-feature-flags.md)): the unit tests build with every flag off, as the live
  site does, and `switchFlags` in `src/test-support/feature-flags.ts` switches
  one on for a `describe`, so each gate is tested on and off. The smoke test
  reads the same `FEATURE_FLAGS` setting as its build (`smoke/support/feature-flags.ts`):
  it leaves out an attraction a flag holds back, skips a check for a hidden
  feature, and `smoke/feature-flags.spec.ts` checks each hidden feature is gone.
- Check scope: when every changed file is inside one booth's folder or one
  level's, CI's `check` job runs `scripts/square-check.ts` on that folder
  instead of `npm run check`: the house rules, format and Markdown on the
  folder, the whole project's types, strict types, JSON and Knip, and the
  folder's tests with the tests every square of its kind must pass. Anything
  else, and every push to `main`, runs the full check. A scoped run skips the
  coverage of changed lines, since it records none and changes no lines it
  measures. ESLint always runs
  with `--config eslint.config.js`, so a config file inside a folder can't
  change the rules ([ADR 0053](../adr/0053-square-only-check.md); enforced
  by: scripts/square-check.ts, scripts/square-check.test.ts,
  .github/workflows/ci.yml).
- Smoke scope: when every changed file is inside one booth's folder, CI sets
  `SMOKE_ONLY=booth/<login>` and runs only the specs that play that booth
  (`BOOTH_ONLY_SPECS`: `squares-play` for its screenshot, frame budget and the
  map with it on, and `flashing`), in Chromium, with no page coverage and no
  combined coverage step. A booth runs sandboxed and can't change the site, so
  nothing else needs to run for it ([ADR 0051](../adr/0051-booth-only-smoke.md)).
  Anything else runs the whole suite in both browsers.

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
- The smoke test plays only the changed booth, in its own specs, when nothing
  else changes, and the whole suite otherwise (enforced by:
  scripts/smoke-scope.ts, scripts/smoke-scope.test.ts, playwright.config.ts,
  .github/workflows/preview-build.yml).
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
