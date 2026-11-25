# Auto-merge gate

A factory pull request for one participant's booth, or their level, merges on
its own once every check passes on its head commit. Any doubt sends it to a
person ([ADR 0031](../adr/0031-levels-through-the-gate.md) brought levels in).

## Behaviour

- The gate runs on CI and Preview build finishing, on labels and pushes to a
  pull request, when the Tessl Reviewer's check finishes, every 10 minutes,
  and by hand. It looks at every open pull request by `tessl-app[bot]` from a
  `tessl/` branch of this repository whose linked issue is a `booth-request`
  or a `level-request` written by a person. The request's label decides its
  folder: `carnival/booths/<owner>/` or `carnival/levels/<owner>/`.
- It keeps one checklist comment (`<!-- booth-gate -->`) on the pull request,
  saying what each step checks, where it stands, and what happens next, and
  saying "booth" or "level" to match the request.
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
   `booth-request` or `level-request`, not both, and `tessl`. A superseded
   request is closed, so it fails.
2. **Only the booth's own folder**, or **the level's** (hard): every changed
   file, renames' old paths included, is in `carnival/booths/<owner>/` for a
   booth or `carnival/levels/<owner>/` for a level, and there is at least
   one. A level request that also changes its owner's booth fails.
3. **Code stays in its square** (hard): the static check parses and
   type-checks the booth without running it and finds no banned globals or
   other ways out. Only `.ts` and `.md` files and `plot.json` may be in the
   folder, no symlinks, at most 40 files, 100 KB each, 300 KB in all.
   `plot.json` holds only a plot and maybe an issue number, and only a new
   booth's first pull request may add or change it (enforced by:
   scripts/square-code.ts, scripts/square-code.test.ts). For a level, the
   same limits hold with no `plot.json`; its `level.ts` holds only
   `import type` of its level type, one object of plain data and its export;
   every `squares/<id>/` goes through the same check as a booth, from its
   own folder; and nothing else but Markdown is in it (enforced by:
   scripts/level-code.ts, scripts/gate-request.ts and their tests).
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
   for this exact sha says `low-risk`, having looked at the booth's
   screenshot, or a level's from its arrival point and each of its squares'
   (enforced by: assess-booth-risk skill, tessl.json,
   smoke/levels.spec.ts).
8. **No one has asked to hold it** (hard): no `needs-human` label.
9. **One at a time** (soft): at most one booth or level merges on its own
   per person per hour.

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
- A level request merges on its own exactly like a booth request, and waits
  for a person exactly when a booth's would (enforced by:
  scripts/booth-gate.test.ts, scripts/gate-comment.test.ts).

## Where it lives

`scripts/booth-gate.ts`, `scripts/gate-comment.ts`,
`scripts/gate-request.ts`, `scripts/auto-merge-booths.ts`,
`scripts/square-code.ts`, `scripts/level-code.ts`, `scripts/injection-scan.ts`,
`.github/workflows/auto-merge-booths.yml`,
`.github/workflows/auto-merge-digest.yml`,
`plugins/north-pole/skills/assess-booth-risk/SKILL.md`.

## Tested by

`scripts/booth-gate.test.ts`, `scripts/gate-comment.test.ts`,
`scripts/gate-request.test.ts`, `scripts/level-code.test.ts`,
`scripts/square-code.test.ts`,
`scripts/injection-scan.test.ts`.
