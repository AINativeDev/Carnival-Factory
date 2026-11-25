---
name: review-craft
description: 'Code review lens for the North Pole map: check that a change to the map, its scripts or its checks is written test-first with end-to-end tests for what people see, uses names and comments that say what things are for and why, and keeps docs/specs and docs/adr current. Use when reviewing a pull request that touches src/, scripts/, lint/, smoke/, .github/ or the docs, not a booth or level on its own.'
---

# Review the craft of a change

You review changes to the map's own code: `src/`, `scripts/`, `lint/`,
`smoke/`, `.github/` and the docs. Read `AGENTS.md` (**Code rules** and **Specs
and decisions**) and the ADRs it links, then check every changed file. Report a
finding only for a concrete line or a concrete missing file, and name the rule.
Scripts already enforce file size, lint, unused code and the coverage of changed
lines, so don't report those; report what needs judgement.

## Tests first, and end to end (Major)

- A change in behaviour comes with a test that would have failed without it
  (ADR 0024). A test that only re-states the implementation, or asserts nothing
  that could break, doesn't count.
- Something a visitor, participant or maintainer sees or does on the page has
  an end-to-end Playwright test in `smoke/` (ADR 0026): on a phone width too
  when it behaves differently there.
- A bug fix has a test that reproduces the bug.

## Names and comments say why (Minor, Major when misleading)

ADR 0023:

- Names say what a thing is in the carnival's terms (a booth, a plot, the gate,
  a construction site), not how it works (`data`, `handler`, `process`,
  `item2`, `.box`). CSS classes too.
- A doc comment says what the thing is for, what would break without it, or
  which ADR or spec it carries out. A comment that narrates the next line is a
  finding; so is a comment the change made untrue.

## Specs and decisions move with the code (Major)

- A change in behaviour updates the matching spec in `docs/specs/` in the same
  pull request, including what enforces any rule it adds (ADR 0001, ADR 0016).
- A new rule comes with what enforces it; a choice a future reader would
  question, or one that reverses an earlier ADR, adds an ADR (ADR 0001).

## Not findings

Style that Prettier or ESLint already decide, file length, unused exports, and
booth or level content: other lenses and checks cover those.
