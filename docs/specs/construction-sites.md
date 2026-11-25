# Construction sites

While an accepted booth request is being built, the map shows a construction
site on the plot held for it, so the booth lands where its site stood.

## Behaviour

- Every deploy reads the open issues labelled `booth-request` and `tessl`
  from the API and writes `pending.json` beside the page. A build without it,
  such as a preview or a local build, writes `[]`.
- Each entry is `{ login, issue, plot, stage }`. The stages, in words on the
  sign and tag:
  - `building` ("Building"): no pull request yet.
  - `checks` ("Checks running"): its pull request's checks are running, or one
    failed, since the factory fixes it and runs them again.
  - `almost` ("Almost there"): every check passed, only reviews are left.
  - `maintainer` ("Waiting for a maintainer"): `needs-human` is on the issue
    or its pull request.
- A request whose login already has a booth is an update, shown on that
  booth, not as a site.
- The site's tag says "Being built for @<login>: <stage>". E or a click opens
  the request's issue.
- The page reads `pending.json` with a fresh query on load and every 2
  minutes. A booth that replaces a site the browser saw sparkles once. The
  browser remembers up to 100 site logins in local storage for this.
- An issue labelled, unlabelled or closed with `booth-request`, and
  `needs-human` going on or off a pull request, run the deploy, so a site
  appears or moves on within minutes.
- When the factory builds a new booth, it reads the live site's
  `pending.json` and writes that entry's `plot` and `issue` to the booth's
  `plot.json`. With no entry, it writes none.

## Rules

- Nothing about a site is committed: every deploy works the plots out again
  (enforced by: scripts/write-pending.ts, .github/workflows/pages.yml).
- One entry per login, its latest request, ordered by issue number, at most 100. New booths' sites take the next free plots after every booth's, in
  order of issue number, so two requests never share a plot. An existing
  booth's request names that booth's plot (enforced by: scripts/pending.ts,
  scripts/pending.test.ts, src/northpole/plots.test.ts).
- Stages: `maintainer` when `needs-human` is on the issue or its pull request,
  else `building` without a pull request, `almost` once every check passed,
  `checks` otherwise (enforced by: scripts/pending.test.ts).
- On the page, a site whose held plot a booth took meanwhile, or that is at
  or past booths + 100, moves to the next free plot (enforced by:
  src/northpole/plots.test.ts).
- Security: only the author's login, the issue number, labels and the pull
  request's check states are read, never a request's title or body. The page
  drops any entry with an invalid login, issue, plot or stage, and any other
  field (enforced by: scripts/pending.test.ts, src/northpole/plots.test.ts,
  the construction-site test in smoke/claiming.spec.ts).
- A new booth's `plot.json` comes from the live `pending.json`, and a change
  to an existing booth never adds or changes it (enforced by: the
  implement-booth instructions in tessl.json, scripts/square-code.ts in the
  gate).

## Where it lives

`scripts/pending.ts`, `scripts/write-pending.ts`, `src/pending.ts`,
`src/northpole/plots.ts`, `vite.config.ts` (`pendingFile`),
`src/northpole/visit.ts` (`tagText`).

## Tested by

`scripts/pending.test.ts`, `src/northpole/plots.test.ts`,
`src/northpole/visit.test.ts`, `smoke/claiming.spec.ts` (an accepted request
shows a site, its stage and a link, never its text).
