# Auto-merge gate

A factory pull request for one participant's booth merges on its own once
every check passes on its head commit. Any doubt sends it to a person.

## Behaviour

- The gate runs on CI and Preview build finishing, on labels and pushes to a
  pull request, when the Tessl Reviewer's check finishes, every 10 minutes,
  and by hand. It looks at every open pull request by `tessl-app[bot]` from a
  `tessl/` branch of this repository whose linked issue is a `booth-request`
  written by a person. Level requests never merge on their own.
- It keeps one checklist comment (`<!-- booth-gate -->`) on the pull request,
  saying what each step checks, where it stands, and what happens next.
- Decision: **merge** when every step passes; **wait** when a step is still
  running or a soft step failed; **human** when a hard step failed.
- On merge it labels the pull request `auto-merged`, merges pinned to the head
  sha, comments on the request and closes it as completed.
- When the map is behind an auto-merge, or `needs-human` went on a pull
  request since the last Pages run, it dispatches the Pages workflow.
- Once a day the digest opens an issue listing the pull requests labelled
  `auto-merged` that merged in the last 24 hours, with a note on how to
  switch a booth off. Titles are stripped of Markdown and @mentions.

## Rules

The steps, all on the current head commit (enforced by: scripts/booth-gate.ts,
scripts/auto-merge-booths.ts, scripts/booth-gate.test.ts):

1. **Request accepted** (hard): the linked issue is open and has
   `booth-request` and `tessl`. A superseded request is closed, so it fails.
2. **Only the booth's own folder** (hard): every changed file, renames'
   old paths included, is in `carnival/booths/<owner>/`, and there is at
   least one.
3. **Code stays in its square** (hard): the static check parses and
   type-checks the booth without running it and finds no banned globals or
   other ways out. Only `.ts` and `.md` files and `plot.json` may be in the
   folder, no symlinks, at most 40 files, 100 KB each, 300 KB in all.
   `plot.json` holds only a plot and maybe an issue number, and only a new
   booth's first pull request may add or change it (enforced by:
   scripts/square-code.ts and its rule families in scripts/square-code/,
   scripts/square-code.test.ts, scripts/square-code/*.test.ts).
4. **No hidden instructions** (hard): no text aimed at an AI, hidden
   characters or encoded blobs in the issue's title and body, the pull
   request's title, or the code (enforced by: scripts/injection-scan.ts,
   scripts/injection-scan.test.ts).
5. **Checks pass** (soft): `check`, `ownership`, `build` and `smoke` succeed
   (enforced by: .github/workflows/ci.yml, booth-ownership.yml,
   preview-build.yml).
6. **Code review approves** (soft): the latest `tessl-reviewer[bot]` review
   with a result, on the head commit, says `approved=true` (enforced by:
   Tessl Code Review, .tessl-code-review.yml).
7. **Risk and taste check** (hard): the verdict comment by `tessl-app[bot]`
   for this exact sha says `low-risk` (enforced by: assess-booth-risk skill,
   tessl.json).
8. **No one has asked to hold it** (hard): no `needs-human` label.
9. **One at a time** (soft): at most one booth merges on its own per person
   per hour.

- The gate puts `needs-human` on for its own hard failures only (steps 1 to
  4), never over a maintainer who just took it off (enforced by:
  scripts/auto-merge-booths.ts).
- Security: the workflow runs main's own code on every trigger, never checks
  out or runs the pull request's code, and reads its files as text through
  the API. The token is kept out of `.git/config` (enforced by:
  .github/workflows/auto-merge-booths.yml).
- The merge is pinned to the head sha, and if it fails and the pull request
  is not merged, `auto-merged` comes off (enforced by:
  scripts/auto-merge-booths.ts).
- Level requests never merge on their own: the gate only takes
  `booth-request` issues (enforced by: scripts/auto-merge-booths.ts).

## Where it lives

`scripts/booth-gate.ts`, `scripts/auto-merge-booths.ts`,
`scripts/square-code.ts`, which runs the code check's rule families in
`scripts/square-code/`: `banned-names.ts` and `reach.ts` (banned globals,
properties, strings and computed keys), `names.ts` (names that are not
references), `imports.ts` (the import allow-list), `loading.ts` (nothing runs
while a square loads), `syntax.ts` (`with`, `debugger`, tagged templates and
canvases of its own), `text-checks.ts` (hidden characters and injection),
`plot-file.ts` (`plot.json`), `square-program.ts` (the program the rules ask for types and declarations, whose compiler errors are not read)
and `problems.ts` (what a problem is). Then `scripts/injection-scan.ts`,
`.github/workflows/auto-merge-booths.yml`,
`.github/workflows/auto-merge-digest.yml`,
`plugins/north-pole/skills/assess-booth-risk/SKILL.md`.

## Tested by

`scripts/booth-gate.test.ts`, `scripts/square-code.test.ts` (the check as a
whole, and every real booth and attraction), one test file per rule family
in `scripts/square-code/` (`banned-names.test.ts`, `imports.test.ts`,
`loading.test.ts`, `syntax.test.ts`, `text-checks.test.ts`,
`plot-file.test.ts`, sharing the made-up booth in `test-booth.ts`), and
`scripts/injection-scan.test.ts`.
