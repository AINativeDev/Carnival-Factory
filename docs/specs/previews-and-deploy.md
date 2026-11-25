# Previews and deploy

GitHub Pages serves the live map at the root and a preview of every open pull
request at `previews/pr-<number>/`. All live data is read at build time, so
the page never calls GitHub.

## Behaviour

- **Preview build** runs on a pull request from this repository: one job
  builds `dist/` and uploads it, another runs the smoke test and uploads its
  screenshots. Pull requests from forks get no preview.
- **Deploy to GitHub Pages** runs on a push to main, a successful Preview
  build, a pull request closed unmerged or `needs-human` going on or off one,
  an issue event on a `booth-request` or `advent-done` issue, and by hand. It
  skips with a note when Pages is off.
- Its steps, from main's own code: read every square's history and the
  factory's numbers; list the booths being built (`pending.json`); download
  the booth owners' avatars; list the Elf Engineer badge holders; count the
  season; count the accepted advent challenges; count the People's Choice
  votes; read the Year in Review's accepted answers; build main into the root;
  reconcile the previews; push `gh-pages`;
  deploy; comment on each pull request whose preview was placed.
- Each data step that fails or times out (2 minutes) warns and publishes
  without that data: no timelines, no sites, the elf fallback, no pins, an
  empty season, no decorations, no standings, no Year in Review answers.
- Built files are kept for a week after they were last part of a build, so a
  cached page still finds its files.
- An open pull request's preview is the successful Preview build of its head
  commit. A closed pull request's preview becomes a page that redirects to the
  live map, keeping the hash.
- The Preview comment (`<!-- pr-preview -->`) links the preview, the map's
  screenshot, and each changed square with its screenshot.
- Share links from a preview point at the live site's share page.
- The build writes `version.json`, `pending.json` (`[]` without data),
  `share/<kind>-<id>.html` for every booth and attraction, `share/factory.html`
  and `badges/index.html`.

## Rules

- Security: the Preview build runs the pull request's code with a read-only
  token and no secrets, and only for pull requests from this repository.
  Publishing runs only main's code and only copies the built files. Only
  PNGs with plain names are copied from screenshots (enforced by:
  .github/workflows/preview-build.yml, .github/workflows/pages.yml).
- Every workflow checkout keeps the token out of `.git/config` (enforced by:
  each workflow's `persist-credentials: false`; no check guards new
  workflows, not enforced yet).
- The page and its squares make no request to another origin: avatars are
  bundled, and history, badge holders, advent counts, the season and People's
  Choice are baked in. The page fetches only its own `version.json` and
  `pending.json` (enforced by: the request check in smoke/support/carnival.ts and
  smoke/levels.spec.ts, the CSP in square.html for squares).
- Share pages have no scripts: a meta refresh into the square, with a plain
  link. They name the site from `src/edition.ts`: "<name> at Carnival
  Factory", with "Carnival Factory – Christmas edition" as `og:site_name`. Switched-off squares say "Closed for repairs." (enforced by:
  scripts/share-pages.test.ts).
- A data step that fails or times out publishes the map without that data
  (enforced by: .github/workflows/pages.yml).
- One deploy at a time, and none is dropped: runs queue at the `update` and
  `deploy` jobs, not the workflow, so a run the `check` job turns away, such as
  an issue event that changes nothing, never takes a merge's place in the queue
  (enforced by: the `pages-update` and `pages-deploy` concurrency groups in
  .github/workflows/pages.yml).
- Asset paths are relative, so the build works on any fork's Pages address
  (not enforced yet).

## Where it lives

`.github/workflows/pages.yml`, `.github/workflows/preview-build.yml`,
`vite.config.ts`, `scripts/write-square-history.ts`, `scripts/write-pending.ts`,
`scripts/download-avatars.ts`, `scripts/badge-holders.ts`,
`scripts/season-data.ts`, `scripts/write-advent.ts`,
`scripts/write-peoples-choice.ts`, `scripts/write-year-in-review.ts`,
`scripts/share-pages.ts`, `src/updates.ts`.

## Tested by

`scripts/share-pages.test.ts`, `scripts/avatars.test.ts`,
`src/updates.test.ts`, `scripts/square-history.test.ts`. The workflows have
no automated test.
