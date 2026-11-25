# 0026. What people see is tested end to end

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

Unit tests check functions; people use a page. Several bugs here passed every
unit test: every square broken in Safari, history entries squeezed into
columns, the preview comment listing nothing. The Playwright smoke test caught
the first kind only once it ran in the right browser.

## Decision

Anything a visitor, participant or maintainer sees or does on the page has a
Playwright test in `smoke/`, in Chromium, at phone width when it differs there,
and in WebKit for anything that loads or runs differently in Safari. Every
square is opened, drawn and checked for flashing on every pull request. A
spec's **Tested by** names the end-to-end test for each behaviour.

## Alternatives considered

- **Unit tests with a fake DOM.** Rejected as enough on its own: the bugs that
  mattered were in real browsers, layouts and security policies.
- **Manual checks of the preview.** Kept as a habit, not a rule: they don't run
  on every change.

## Consequences

The smoke run takes minutes, so booth pull requests run only their own booth's
per-square tests ([0013](0013-scoped-smoke-test.md)). The `review-craft` lens
asks for an end-to-end test when a change alters what people see.
