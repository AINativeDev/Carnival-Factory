# 0027. Strict TypeScript, held by a baseline that only shrinks

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

`strict` was on, but the stricter checks were not: indexing that may miss
(`noUncheckedIndexedAccess`), optional properties set to `undefined`
(`exactOptionalPropertyTypes`), and typescript-eslint's type-aware strict rules
(non-null assertions, unsafe `any`, needless conditions). Turning them on found
517 compiler errors and 362 lint findings. The smoke tests and the config files
were not type-checked at all.

## Decision

- `tsconfig.json` adds `noImplicitOverride` and `noImplicitReturns`, which pass
  today, and now covers `smoke/` and the config files.
- `tsconfig.strict.json` adds the two flags with a backlog;
  `scripts/strict-types.ts` holds each file to its count in
  `lint/strict-types-baseline.json`.
- ESLint runs typescript-eslint's `strictTypeChecked` rules on all TypeScript,
  with existing findings in `eslint-suppressions.json`, ESLint's own baseline.
- New code is held to all of it. Baselines only shrink: map code must lower its
  count when it improves, and the edit hook prunes ESLint's suppressions as
  agents pay them off. A booth's pull request can't edit files outside its
  folder, so carnival files only have to stay within their counts.

## Alternatives considered

- **Fix all 879 findings first.** Rejected: a huge change across the map and
  participants' booths for no change in behaviour.
- **Turn the flags on for new files only.** Rejected: TypeScript has no
  per-file flags, and a split project would type-check twice.

## Consequences

`npm run typecheck` runs the strict check too. When the compiler baseline is
empty, the flags move into `tsconfig.json` and the script goes.
