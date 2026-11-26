# 0053. A booth-only or level-only pull request checks just that folder

- Status: Accepted
- Date: 2026-11-26
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md),
  [auto-merge-gate.md](../specs/auto-merge-gate.md)

## Context

After [ADR 0051](0051-booth-only-smoke.md) the slowest check on a booth's
pull request was `check`: `npm run check` lints, formats and tests the whole
repository with coverage, about two minutes, though a booth or level can't
change the map's code. Looking at what a square's folder could do to the
checks also showed a way round them: ESLint 10 reads a config file it finds
beside the files it lints, so an `eslint.config.ts` in a booth's folder,
which the gate's `.ts`-only file rule lets through, switched the house rules
off for that booth, in the full check too. The gate's own static check
still caught a `fetch`, but CI's lint no longer did.

## Decision

- A pull request whose every changed file is inside one
  `carnival/booths/<login>/` or one `carnival/levels/<login>/` runs
  `scripts/square-check.ts` instead of `npm run check`: ESLint, Prettier and
  markdownlint on the folder, the whole project's types, strict types, JSON
  and Knip, and the folder's tests with the tests every square of that kind
  must pass (`booths.test.ts` or `level.test.ts` and `levels.test.ts`,
  `square-code`, `square-size` and `square-lint-reach`). Squares have no
  coverage floor, so nothing is lowered. Anything else, including two
  folders, an attraction, or a push to `main`, runs the full check.
- ESLint always runs with `--config eslint.config.js`, in the full check and
  the scoped one, so no config file below the root can change the rules.
- The static check fails a tool's config file in a square's folder
  (`*.config.ts` and the like, dotfiles, `tsconfig*.json`), so the gate sends
  such a pull request to a person.

## How it could be bypassed, and why it isn't

- **The scope comes from the pull request's own diff** on the merge commit,
  in CI, never from anything the request says. One file outside the folder,
  or a name that isn't a login, means the full check.
- **A file inside the folder can't change how the tools run**: ESLint's
  config is named, the static check rejects config files, and the gate lets
  only `.ts`, `.md` and `spot.json` through without a person.
- **The scoped check isn't the only guard.** The gate's static check, the
  hidden-text scan, the smoke test in the sandbox, Tessl Code Review and the
  risk check all run on every booth whatever `check` does, and the squares
  run sandboxed on the page.

## Consequences

A booth or level pull request's `check` takes under a minute of commands
instead of about two. A change to the map's code still gets the full check,
on its own pull request and on `main`.
