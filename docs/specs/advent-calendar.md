# Advent calendar

`#/advent` offers 24 small challenges to do with a Tessl factory on your own
repository, one a day from 1 to 24 December. Each accepted challenge
decorates the participant's booth. The participant guide is
[docs/advent.md](../advent.md).

## Behaviour

- The calendar opens over the map, from the visit panel, the factory page or
  `#/advent`. Each door shows its challenge (what to do, how you'll know it
  worked, the docs that help) once it is open, and a line says how many are.
  Esc or Leave goes back to the map.
- A door opens at midnight on its day in December, by the visitor's own clock.
- "Mark it done" opens the **Advent challenge** issue form (`advent-done`).
  The `assess-advent-challenge` skill, with `scripts/check-advent.ts`, accepts
  it (label `accepted`, a comment with `<!-- advent-done: <day> -->`, closed),
  declines it, or leaves it to a maintainer (`needs-human`).
- Decorations by accepted count: one ornament per challenge up to 6, a string
  of lights from 7, a star from 12, a glowing sign at 24.
- Labelling, unlabelling or closing an `advent-done` issue runs the deploy,
  so decorations follow within minutes.

## Rules

- The check passes a request on only when: the day is 1 to 24; that day's
  door had opened somewhere in the world (UTC+14) when the issue was opened;
  the link is a public GitHub pull request or issue that exists; and the
  repository is the author's, or their organisation's (public membership), or
  they opened that item. Text the injection scan flags goes to a maintainer
  (enforced by: scripts/advent.ts, scripts/check-advent.ts,
  scripts/advent.test.ts).
- The skill then judges whether the link plausibly matches the day's
  challenge (enforced by: assess-advent-challenge skill).
- Counts come only from acceptances `tessl-app[bot]` wrote, for the issue's
  author. An issue counts by its latest decision only, so a declined one never
  counts. A day counts once per person (enforced by: scripts/advent.ts,
  scripts/advent.test.ts).
- `cleanCalendar` keeps only well-formed challenges, one a day, with `https:`
  docs links. `cleanCounts` keeps lower-case logins with 1 to 24. Doors open
  at midnight on their day by the visitor's clock (enforced by:
  src/northpole/advent.test.ts).
- Security: counts are baked in at build time, so the page never asks the
  network (enforced by: the request check in smoke/squares.spec.ts). Every
  challenge is set as text and nothing is tracked (not enforced yet).

## Where it lives

`carnival/challenges/advent.json`, `src/advent.ts`, `src/northpole/advent.ts`,
`scripts/advent.ts`, `scripts/check-advent.ts`, `scripts/write-advent.ts`,
`src/northpole/render.ts` (decorations),
`plugins/north-pole/skills/assess-advent-challenge/SKILL.md`.

## Tested by

`src/advent.test.ts`, `src/northpole/advent.test.ts`, `scripts/advent.test.ts`.
