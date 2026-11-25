# Architecture decision records

Each file records one decision: what we decided, why, and what it costs. Specs
in [`../specs/`](../specs/) say what the system does; these say why it is that
way, so a later change can tell a deliberate choice from an accident.

- Write one when a change makes a choice a future reader would question, or
  reverses an earlier one, and for every decision maintainers make in
  discussion, the same day, even before any code changes.
- A decision still being weighed is **Proposed**, with its options and open
  questions; it becomes **Accepted** when it's made.
- Number them in order and never reuse a number. To change a decision, add a
  new record and mark the old one **Superseded by** it; don't rewrite history.
- Keep them short: the decision, the alternatives turned down and the
  consequences. How the result behaves belongs in its spec, which the record
  links. Link the pull requests that carried it out.

## Records

| No.                                        | Decision                                                           | Status   |
| ------------------------------------------ | ------------------------------------------------------------------ | -------- |
| [0001](0001-record-decisions.md)           | Record functionality in specs and decisions in ADRs                | Accepted |
| [0002](0002-requests-are-data.md)          | A request is a spec, never instructions                            | Accepted |
| [0003](0003-identity-by-numeric-id.md)     | Only maintainers steer the factory, known by numeric id            | Accepted |
| [0004](0004-sandbox-every-square.md)       | Run every square in a sandboxed frame and worker                   | Accepted |
| [0005](0005-inline-square-worker.md)       | Build the square's worker into the frame's script                  | Accepted |
| [0006](0006-assess-before-building.md)     | Assess every request before the factory builds it                  | Accepted |
| [0007](0007-latest-request-wins.md)        | One request type per booth, and the latest wins                    | Accepted |
| [0008](0008-auto-merge-gate.md)            | Booth changes merge on their own behind a strict gate              | Accepted |
| [0009](0009-no-network-from-the-page.md)   | The page never calls the network: data is baked in at build        | Accepted |
| [0010](0010-plots-stay-put.md)             | Plots stay put, and construction sites are never committed         | Accepted |
| [0011](0011-levels-are-plain-data.md)      | A level is plain data plus sandboxed squares                       | Accepted |
| [0012](0012-fast-booth-builds.md)          | Booths get their own lighter factory action                        | Accepted |
| [0013](0013-scoped-smoke-test.md)          | Smoke-test only the changed booth on a booth pull request          | Accepted |
| [0014](0014-carnival-folder.md)            | What people make lives in `carnival/`, the map in `src/`           | Accepted |
| [0015](0015-phones-first-class.md)         | Phones get the same map, with touch of their own                   | Accepted |
| [0016](0016-enforce-every-rule.md)         | Every rule we set is enforced, deterministically where we can      | Accepted |
| [0017](0017-reporting-a-booth.md)          | How visitors report a problem with a booth                         | Proposed |
| [0018](0018-community-made-notice.md)      | How the map says booths are community-made                         | Proposed |
| [0019](0019-small-files.md)                | Code files stay under 200 lines                                    | Accepted |
| [0020](0020-keep-eslint.md)                | Keep ESLint for code, rather than move to Oxlint                   | Accepted |
| [0021](0021-knip.md)                       | Knip finds unused code, exports and dependencies                   | Accepted |
| [0022](0022-lint-everything-on-edit.md)    | Lint code, JSON, Markdown and shell, and check on every agent edit | Accepted |
| [0023](0023-meaningful-names-and-docs.md)  | Names and comments say why, not only what                          | Accepted |
| [0024](0024-test-first.md)                 | Write the test first                                               | Accepted |
| [0025](0025-test-coverage.md)              | 99% test coverage: new lines now, the whole codebase over time     | Accepted |
| [0026](0026-end-to-end-tests.md)           | What people see is tested end to end                               | Accepted |
| [0027](0027-strict-typescript.md)          | Strict TypeScript, held by a baseline that only shrinks            | Accepted |
| [0028](0028-analytics.md)                  | Cookieless analytics with PostHog                                  | Accepted |
| [0029](0029-booth-craft.md)                | Squares meet the code conventions too, and show it                 | Accepted |
| [0030](0030-peoples-choice-on-an-issue.md) | People's Choice votes on a pinned issue, not a discussion          | Accepted |
| [0031](0031-changed-branches-too.md)       | Changed lines need their branches tested too                       | Accepted |
| [0032](0032-browser-coverage-counts.md)    | Browser tests count towards coverage, line by line                 | Accepted |
| [0033](0033-attached-pictures.md)          | Participants can attach a picture for the factory to draw from     | Accepted |

## Template

```md
# NNNN. <Decision, as a short sentence>

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD
- Pull requests: #n
- Spec: [<spec>](../specs/<spec>.md)

## Context

<the problem and the forces at play>

## Decision

<what we chose, in a few sentences>

## Alternatives considered

<each option turned down, and why>

## Consequences

<what gets easier, what gets harder, what we must keep doing>
```
