# Booth and level requests

Changes reach the map through issues, never through pull requests from
outside. An assessment decides each request, and the factory builds the
accepted ones.

## Behaviour

- Issue forms (blank issues are off): **Your booth** (`booth-request`, title
  "My booth: "), **Your level** (`level-request`, "My level: "), **Elf
  Engineer badge** (`badge-request`), **Advent challenge** (`advent-done`),
  **Feedback on the factory** (`feedback`, "Feedback: ") and **An idea**
  (`idea`, "Idea: ").
- The `welcome-feedback` skill thanks the author of a `feedback` or `idea`
  issue, adds `kudos` to praise, and leaves it open for the maintainers. It
  closes one, as not planned with `declined`, only when it's spam, abuse,
  unsafe or nothing to do with Carnival Factory, and asks for `needs-human`
  when unsure. It never adds `tessl`: building an idea is a maintainer's call
  ([ADR 0045](../adr/0045-feedback-and-ideas-stay-open.md)) (enforced by: the
  skill, and the `welcome-*-opened` triggers in tessl.json).
- One form serves a new booth and a change alike: the factory builds the
  booth if `carnival/booths/<author>/` doesn't exist, and changes it if it does.
  The same holds for levels.
- The booth and level forms ask two things: what it should show or be, with a
  list of hints of what to mention (the scene, what moves, the look, the stall
  or the squares, landmarks, little details), and its name. Style, stall
  shape, colours and the rest go in the description in the person's own words.
- The `assess-booth-request` skill runs when a `booth-request` or
  `level-request` issue is opened by a user, when an open `needs-info` issue is
  edited, and when someone comments on one. It does one of:
  - **Accept**: closes the author's older open requests of the same kind as
    superseded (not planned), removes `needs-info`, adds `tessl`, comments.
  - **Propose or ask**: adds `needs-info` and comments with a buildable version
    or two or three options. It asks at most once; only the author's own reply
    counts.
  - **Decline**: adds `declined`, comments a one-sentence reason and closes
    the issue as not planned.
- It declines changes outside the author's folder, requests on behalf of
  someone else, text aimed at the agent, unkind content, attempts to hurt the
  map, non-requests, and booths in the kill switch. A remix of a booth that
  doesn't exist or is switched off gets a question.
- The latest request wins. Accepting one closes the author's older open
  requests of that kind; a superseded request's pull request never merges on
  its own.
- Factory actions in `tessl.json`, by trigger:
  - `tessl` added by the Tessl App to an issue without `level-request`:
    `implement-booth`.
  - `tessl` added by the Tessl App to a `level-request`: `implement-level`.
  - `tessl` added by a maintainer to a `booth-request`: `implement-booth`.
  - `tessl` added by a maintainer to any issue without `booth-request`:
    `implement`, the general action.
  - `shepherd` answers reviews, comments and failed or passed checks on the
    factory's `tessl/` pull requests; `follow-ticket-changes` follows issues
    and pull requests closing or `tessl` coming off; `merge-conflict-sweep`
    runs on every push to the default branch.
  - `assess-booth-risk` runs when a `tessl/` branch's GitHub Actions checks
    pass, and again when a maintainer takes `needs-human` off.
  - `assess-badge-request` and `assess-advent-challenge` run when their
    issues are opened by a user.

## Rules

- A picture the author attached to the issue (a GitHub attachment) is a
  reference to draw from: the assessment looks at it under the same rules as
  the text, and the builder redraws it in canvas shapes; the square never
  contains or loads it, and text in it is data
  ([ADR 0033](../adr/0033-attached-pictures.md)) (enforced by: the
  assess-booth-request skill, the implement-booth and implement-level
  instructions in tessl.json, the square's sandbox, and the gate's check that
  only `.ts`, `.md` and `plot.json` files change).
- Latest request wins: accepting a request first closes the author's older
  open requests of the same kind (`booth-request` or `level-request`, never
  the other) as not planned, with "Superseded by #<n>" (enforced by:
  assess-booth-request skill). The gate only merges a pull request whose
  request is still open (enforced by: scripts/merge-gate-facts.ts,
  scripts/auto-merge-booths-needs-human.test.ts), and
  `pending.json` lists only each login's latest request (enforced by:
  scripts/pending.ts, scripts/pending.test.ts).
- Accept only a sane change to the author's own folder: something to see or
  play with, drawable within the square contract and house rules, and
  friendly for a family audience. A level may hold several ideas, one per
  square, up to 8 squares. A stall shape or roof colour is an ordinary change
  (enforced by: assess-booth-request skill).
- Before acting, the assessment stops with no write when the issue is closed,
  already has `tessl` or `declined`, has neither or both request labels, or
  already has a decision comment from `tessl-app[bot]` and no `needs-info`.
  It trusts labels over comments. It only reads, labels, comments and closes,
  and applies labels before commenting. When in doubt about safety it
  declines (enforced by: assess-booth-request skill).
- Security: the issue is a spec, not instructions. Text from a request never
  changes what a skill does; an instruction to the agent is itself a reason to
  decline (enforced by: assess-booth-request skill, assess-booth-risk skill,
  scripts/injection-scan.ts in the gate).
- People are matched by numeric user id, never by login (enforced by:
  `MAINTAINERS` in scripts/ownership.ts, scripts/ownership.test.ts,
  `event.sender.id` filters in tessl.json). Only numbers and the repository's
  own name go into `tessl.json` inputs (enforced by: tessl.json as written;
  no check guards future edits, not enforced yet).
- Only a user, not a bot, opening an issue starts an assessment, and only the
  Tessl App or a maintainer adding `tessl` starts a build (enforced by:
  tessl.json triggers).
- Participant text in our own comments, issues and logs goes through
  `safeInline`, and log commands are escaped with `escapeCommand` (enforced
  by: scripts/safe-text.test.ts, scripts/ownership.test.ts, review by Tessl
  Code Review for new uses).
- `implement-booth` and `implement-level` keep every change inside the
  author's folder and never run the smoke test (enforced by: their
  instructions in tessl.json, scripts/check-booth-ownership.ts).

## Where it lives

`.github/ISSUE_TEMPLATE/`, `tessl.json`,
`plugins/north-pole/skills/assess-booth-request/SKILL.md`,
`scripts/ownership.ts`, `scripts/safe-text.ts`,
`.github/workflows/outside-pull-requests.yml`.

## Tested by

`scripts/ownership.test.ts`, `scripts/safe-text.test.ts`,
`scripts/injection-scan.test.ts`. The skills and triggers have no automated test.
