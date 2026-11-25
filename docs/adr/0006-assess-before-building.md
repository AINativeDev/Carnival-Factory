# 0006. Assess every request before the factory builds it

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #17, #57
- Spec: [booth-requests.md](../specs/booth-requests.md)

## Context

With only maintainers able to start the factory, every booth waited for a
person. Letting every request start it would hand the factory every off-topic,
unkind or malicious request.

## Decision

A local skill assesses each request first, reading it as data, with only
comment, label and close as its actions. It accepts, asks once, or declines;
for a good idea with one part a booth can't do, it proposes the nearest
buildable version instead of declining.

## Alternatives considered

- **A maintainer triages every request.** Rejected: it makes the event wait on
  one person.
- **Build everything and filter at merge.** Rejected: it spends builds on
  requests that should never be built, and puts bad content in pull requests.

## Consequences

Most requests reach the factory with no person involved. The skill's rules
must stay in step with `AGENTS.md`, and a maintainer can override by
labelling.
