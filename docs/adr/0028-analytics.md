# 0028. Cookieless analytics with PostHog

- Status: Accepted
- Date: 2026-11-25
- Supersedes: part of [0009](0009-no-network-from-the-page.md), for the map
  page only

## Context

We want to know how the map is used: visits, which squares people open, shares,
requests started from the page, and where phones struggle. The team uses
PostHog. Until now the page never called a third party (0009), and visitors
include children and people who never agreed to tracking.

## Decision

- The map page sends PostHog a small set of named events (such as a square
  opened, a share, a request started), straight to PostHog's host, which the
  page's security policy allows. Nothing else on the page talks to third
  parties, and the squares' sandbox stays closed to the network.
- Cookieless: no cookies, no local storage, no personal data, no autocapture and
  no session recording. Each page load gets a throwaway id that lives only in
  memory.
- Analytics stay off until the project key and host are set, like the other
  placeholders in `src/northpole/links.ts`, so previews and forks send nothing.
- Still open: which region (EU or US) the team's project is in; it decides the
  host.

## Alternatives considered

- **A consent banner with identified sessions and recordings.** Rejected for
  now: more than we need, and a banner on a children's map.
- **No analytics on the page.** Rejected: GitHub's traffic numbers can't say how
  the map itself is used.
- **A proxy on our own domain.** Rejected for now: it needs hosting we don't
  have. Ad blockers will drop some events sent directly, which is acceptable.

## Consequences

Counts are per page load, not per person, and undercount visitors with ad
blockers. The events are a deliberate list; adding one is a code change, reviewed
like any other.
