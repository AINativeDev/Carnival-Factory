# 0060. Dependabot keeps the packages up to date

- Status: Accepted
- Date: 2026-11-26
- Spec: [booths.md](../specs/booths.md)

## Context

`npm audit` found 13 known issues in the linting tools' packages (none in
what the site ships), and nothing told anyone. Dependabot's alerts were on,
but its security updates were off and it had no version updates. The
maintainer asked to enable it. The **Booth ownership** check fails any bot's
pull request that isn't the factory's, so Dependabot's pull requests would
all fail.

## Decision

- The repository has Dependabot security updates, secret scanning and push
  protection switched on.
- `.github/dependabot.yml` asks for weekly updates of the npm packages, minor
  and patch updates grouped into one pull request, and of the workflows'
  actions.
- The ownership check passes a pull request from Dependabot's own account,
  matched by its numeric id (49699333) like a maintainer, when it changes
  only `package.json`, `package-lock.json` and `.github/workflows/*.yml`
  (`isDependencyUpdate` in `scripts/ownership.ts`). A bot that takes its login
  but not its id still fails.

## Consequences

Dependabot's pull requests run CI like any other and never merge on their
own, since the merge gate takes booths only: a maintainer reviews each one.
