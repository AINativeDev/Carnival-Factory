# 0003. Only maintainers steer the factory, known by numeric id

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #15, #90
- Spec: [booth-requests.md](../specs/booth-requests.md)

## Context

The factory reacts to labels, comments and reviews. Without a filter anyone
could restart it, steer a pull request by commenting, or approve their own
request. Logins and display names can change hands.

## Decision

People are identified by numeric GitHub user id, never by login or name. Only
maintainers' ids start or steer the factory directly; a participant's request
reaches it only through the assessment ([0006](0006-assess-before-building.md)).
A maintainer can approve a participant's issue for changes outside their booth
by being the latest to label it.

## Alternatives considered

- **Filter by login.** Rejected: a renamed or recycled account would inherit
  the rights.

## Consequences

Adding a maintainer means adding their id in `tessl.json` and in
`scripts/ownership.ts`. Comments from anyone else on a factory pull request
do nothing.
