# 0007. One request type per booth, and the latest wins

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #36
- Spec: [booth-requests.md](../specs/booth-requests.md)

## Context

Separate claim and change forms made the assessment decline a claim for a booth
that existed or a change for one that didn't, and people filed several requests
that the factory then built in parallel, racing on one folder.

## Decision

One request type covers a new booth and a change. Accepting a request
supersedes the author's older open ones.

## Alternatives considered

- **Queue requests and build them in order.** Rejected: slower, and an old
  request is usually what the newer one replaces.
- **Keep two forms.** Rejected: participants don't know or care which applies.

## Consequences

A participant has at most one booth build in flight. To ask for two changes,
they write both in one request.
