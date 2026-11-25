# 0028. Analytics with PostHog

- Status: Proposed
- Date: 2026-11-25

## Context

We want to know how the map is used: visits, which squares people open, shares,
requests started from the page, and where phones struggle. The team uses
PostHog. Today the page never calls a third party
([0009](0009-no-network-from-the-page.md)), and visitors include children and
people who never agreed to tracking.

## Options under consideration

- **A. PostHog on the page, cookieless**: no cookies or local storage, no
  personal data, no session recording, only named events (square opened,
  shared, request started). Needs `connect-src` for the PostHog host in the
  page's security policy; the squares' sandbox stays closed.
- **B. PostHog with consent**: the same, plus a consent banner, enabling
  identified sessions and recordings for people who agree.
- **C. Only server-side numbers**: GitHub traffic and the factory's own numbers,
  no analytics on the page.

## Open questions

- EU or US PostHog host, and which project?
- Cookieless only (A), or consent (B)?
- Which events matter, and is session recording ever wanted?
- Does this supersede part of 0009, or does the page keep calling only its own
  site, with events sent through a small proxy?

## Decision

Not made yet.
