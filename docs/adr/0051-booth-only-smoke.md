# 0051. A booth-only pull request runs only its booth's browser tests

- Status: Accepted
- Date: 2026-11-26
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

A pull request that changes only one booth's folder already played just that
booth one by one (`SMOKE_ONLY`), but every other browser test still ran: 113
tests in about 14 minutes, then 2 minutes of combined coverage that a
booth-only run isn't held to. The gate waits for the smoke test, so a simple
booth request spent most of its time there, testing the map, the menu, the
levels and the pages it can't touch.

## Decision

- A booth-only run runs only `BOOTH_ONLY_SPECS` in `scripts/smoke-scope.ts`:
  `squares-play`, which plays the booth, saves the screenshot the risk check
  judges, holds its frame budget and opens the map with it on, and
  `flashing`. In Chromium only, without installing WebKit.
- It records no page coverage and skips the combined coverage step.
- Anything else, including a change to two booths, an attraction or a level,
  still runs the whole suite in both browsers, with coverage.

## Alternatives considered

- **Keep the map-wide tests for every booth.** Rejected: a booth runs
  sandboxed in its own frame and worker, and its only way onto the map is the
  bitmap and the checked `ready` message, so those tests can only fail for
  code the pull request didn't change.
- **More workers for the full suite.** Left for later: it helps every pull
  request, but the suite shares one preview server and was made serial for
  steady timings.

## Consequences

A booth-only smoke run takes under a minute of tests instead of about 16. A
change to the map's code is still tested in full on its own pull request.
