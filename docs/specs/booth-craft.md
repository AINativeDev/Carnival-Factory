# Booth craft

Whether a square's code follows the conventions the map's own code does, shown
as badges on its panel ([ADR 0029](../adr/0029-booth-craft.md)).

## Behaviour

- `node scripts/craft/check-square.ts <folder>` prints a square's badges and
  what to fix for the rest, and fails while anything is left.
- The factory runs it before finishing a booth or level, and the Claude Code
  Stop hook runs it on every square an agent changed.
- A level's squares share the level's README.
- Every build works out each square's badges from its own files
  (`squareCraft` in `scripts/build-data.ts`) and bakes them into the page. A
  square's panel shows the badges it earned under its owner, each with what it
  means on hover, and a link to how squares are checked. A square with none
  shows nothing: the panel never shows a badge it missed.

## Rules

- **small-files**: every code file has 200 lines or fewer.
- **tested**: there is a `.test.ts` that imports the square's own code.
- **documented**: the README has at least 15 words, and every export has a doc
  comment.
- **clear-names**: files are kebab-case, and no declared name is a generic one
  such as `data`, `temp`, `foo` or `utils`.
- The craft check never blocks a merge (enforced by: it isn't in
  `REQUIRED_CHECKS` in `scripts/booth-gate.ts`).
- Each rule (enforced by: scripts/craft/craft.ts, scripts/craft/craft.test.ts).
- The panel shows only earned badges, as text (enforced by: src/craft-badges.test.ts,
  smoke/craft.spec.ts).

## Where it lives

`src/craft-badges.ts`, `scripts/build-data.ts`, `scripts/craft/craft.ts`, `scripts/craft/check-square.ts`,
`scripts/hooks/check-turn.ts`, `tessl.json` (the booth and level instructions).

## Tested by

`scripts/craft/craft.test.ts`, `scripts/craft/check-square.test.ts`,
`scripts/hooks/hooks.test.ts`, `scripts/build-data.test.ts`,
`src/craft-badges.test.ts`, `smoke/craft.spec.ts`.
