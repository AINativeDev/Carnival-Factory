# 0009. The page never calls the network: data is baked in at build

- Status: Accepted, partly superseded by [0028](0028-analytics.md) (analytics
  events from the map page)
- Date: 2026-11-24
- Pull requests: #92, #96, #98, #106, #120, #121
- Spec: [previews-and-deploy.md](../specs/previews-and-deploy.md)

## Context

The map shows GitHub data: history and credits, avatars, booths being built,
advent challenges, People's Choice votes. Calling the API from every visitor's
browser would hit rate limits, send visitors' addresses to third parties, and
tie the page to someone else's uptime.

## Decision

The deploy reads the data before the build and bakes it into the page or
writes static files beside it. A failed step builds without that data and
warns.

## Alternatives considered

- **Fetch from the page.** Rejected for the reasons above.
- **A small backend or cache.** Rejected: the site is static hosting with no
  secrets, and that's a property worth keeping.

## Consequences

Data is as fresh as the last deploy. New live data means a new build step, not a
fetch. Previews show fallbacks.
