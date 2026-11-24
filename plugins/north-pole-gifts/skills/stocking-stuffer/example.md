# Worked example: Stocking stuffer on a sample repository

## The repository

A small Node project, `acme/snow-report`, with this `package.json`:

```json
{
  "scripts": { "test": "vitest run", "lint": "eslint ." },
  "dependencies": { "date-fns": "3.6.0" },
  "devDependencies": { "eslint": "9.9.0", "vitest": "2.0.4" }
}
```

No pull request on a `stocking-stuffer/` branch is open.

## What `npm outdated --json` reports

| Package  | Current | Latest | Kind    |
| -------- | ------- | ------ | ------- |
| date-fns | 3.6.0   | 4.1.0  | runtime |
| eslint   | 9.9.0   | 9.9.1  | dev     |
| vitest   | 2.0.4   | 2.1.1  | dev     |

## What the gift does

1. Picks `eslint` 9.9.0 to 9.9.1: a patch release of a development
   dependency, ahead of vitest's minor and date-fns's major release.
2. Reads eslint's 9.9.1 release notes on GitHub.
3. Runs `npm install eslint@9.9.1` on the branch `stocking-stuffer/eslint-9.9.1`,
   so `package.json` and `package-lock.json` both change, and nothing else does.
4. Runs `npm test` and `npm run lint`. Both pass.
5. Opens one pull request:

> **Bump eslint from 9.9.0 to 9.9.1**
>
> - Fixes a crash in `no-unused-vars` on class static blocks.
> - Fixes a false positive in `no-useless-backreference`.
> - No breaking changes or deprecations.
>
> Changelog: the eslint v9.9.1 release notes.
>
> Ran `npm test` and `npm run lint`: both pass.

Next Monday, while that pull request is still open, the run says "a stocking
stuffer pull request is already open" and stops. Once it merges, the next run
picks vitest.
