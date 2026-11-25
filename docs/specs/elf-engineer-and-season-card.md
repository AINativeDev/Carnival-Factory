# Elf Engineer badge and season card

Two ways a participant takes something home: the Elf Engineer badge, for
running a Tessl factory on a repository of their own, and a season card that
sums up their season. The participant guide for the badge is
[docs/elf-engineer.md](../elf-engineer.md).

## Behaviour

Elf Engineer badge:

- The **Elf Engineer badge** form (`badge-request`) names a repository and a
  pull request the factory opened there. The `assess-badge-request` skill,
  with `scripts/check-elf-engineer.ts`, grants it (`badge-granted`, a comment
  with `<!-- elf-engineer-badge: <repo> <tier> -->` and a README snippet),
  declines it, or leaves it to a maintainer (`needs-human`).
- Tiers by factory pull requests merged in that repository: bronze from 1,
  silver from 5, gold from 25; none below 1. Asking again moves a holder up.
- A holder's booth wears an elf-hat pin in their tier's colour, and its visit
  panel links to "See @<login>'s own factory".
- The build writes `badges/index.html` with each badge image and the Markdown
  to paste. The images are static files in `public/badges/`.

Season card, `#/season/<login>`:

- A 1200 by 630 card: the booth as it is now, who it belongs to, and the
  numbers that apply (requests made, requests shipped, review findings fixed),
  or a welcome when there are none. Numbers that are zero are left out.
- Download saves it as a PNG made in the page. Copy link copies the booth's
  map link. The share text can be edited first.
- A login without a booth says "No season yet".

## Rules

- A badge is granted only for a public repository of the author's own, or of
  an organisation they publicly belong to, with a `tessl.json` at its root,
  and a named pull request in it opened by `tessl-app[bot]`. Text the
  injection scan flags goes to a maintainer. A private repository is declined
  like a missing one, by the name the requester wrote (enforced by:
  scripts/elf-engineer.ts, scripts/check-elf-engineer.ts,
  scripts/elf-engineer.test.ts, assess-badge-request skill).
- Tiers: bronze from 1 merged factory pull request, silver from 5, gold from
  25 (enforced by: scripts/elf-engineer.test.ts).
- Holders come only from grants `tessl-app[bot]` wrote, for the issue's
  author. A request counts by its latest decision; one labelled `declined`
  never counts. The last grant for a login wins (enforced by:
  scripts/elf-engineer.test.ts, src/northpole/badges.test.ts).
- Season numbers come from the `booth-request` issues: a request is shipped
  when a merged pull request closed it, and findings fixed are resolved review
  threads by `tessl-reviewer` on those pull requests, each pull request once
  per person (enforced by: scripts/season.test.ts, src/season.test.ts).
- Security: holders and seasons are baked in at build time, so the page never
  asks the network (enforced by: the request check in smoke/squares.spec.ts).
  The badge page has no scripts (enforced by: scripts/elf-engineer.test.ts).
  Every name is set as text (not enforced yet).

## Where it lives

`src/northpole/badges.ts`, `scripts/elf-engineer.ts`,
`scripts/check-elf-engineer.ts`, `scripts/badge-holders.ts`, `public/badges/`,
`src/season.ts`, `src/season-card.ts`, `scripts/season.ts`,
`scripts/season-data.ts`, `plugins/north-pole/skills/assess-badge-request/SKILL.md`.

## Tested by

`src/northpole/badges.test.ts`, `scripts/elf-engineer.test.ts`,
`src/season.test.ts`, `scripts/season.test.ts`, `smoke/squares.spec.ts` (the
season card downloads and copies its link; badges are plain files).
