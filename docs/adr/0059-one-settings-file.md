# 0059. One settings file

- Status: Accepted
- Date: 2026-11-26
- Spec: [AGENTS.md](../../AGENTS.md) (its layout)

## Context

The site's name, its repository, the UTM tags and the addresses of Tessl,
AI DevCon and GitHub were spelled out wherever they were used: the page,
the build's scripts and index.html each had their own copy. The maintainer
wants them "centralized into a settings config file instead of sprinkling it
all over the place".

## Decision

`src/settings.ts` holds them, as plain data that the page and Node's scripts
both import: `SETTINGS.site`, `repo`, `utm`, `tessl`, `aiDevcon` and
`github`, and `REPO_URL`. index.html takes the repository's address through
the `%REPO_URL%` placeholder (`fillEdition`). A workflow's `GITHUB_API_URL`
still wins over `SETTINGS.github.api`.

## Consequences

- Changing an address, the edition or the event is one edit.
- A square can't import it: squares import only from `src/northpole/`, and
  run sandboxed, so an attraction's drawing keeps its own on-canvas words.
- Issue forms, workflows, skills and docs can't import TypeScript, so they
  keep their own copies of the repository's address.
