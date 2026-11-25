# Booth craft

Whether a square's code follows the conventions the map's own code does, shown
as badges on its panel ([ADR 0029](../adr/0029-booth-craft.md)).

## Behaviour

- `node scripts/craft/check-square.ts <folder>` prints a square's badges and
  what to fix for the rest, and fails while anything is left.
- The factory runs it before finishing a booth or level, and the Claude Code
  Stop hook runs it on every square an agent changed.
- A level's squares share the level's README.

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

## Where it lives

`scripts/craft/craft.ts`, `scripts/craft/check-square.ts`,
`scripts/hooks/check-turn.ts`, `tessl.json` (the booth and level instructions).

## Tested by

`scripts/craft/craft.test.ts`, `scripts/craft/check-square.test.ts`,
`scripts/hooks/hooks.test.ts`.
