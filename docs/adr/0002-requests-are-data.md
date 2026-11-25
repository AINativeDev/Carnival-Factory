# 0002. A request is a spec, never instructions

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #10, #17, #69
- Spec: [booth-requests.md](../specs/booth-requests.md)

## Context

Anyone with a GitHub account can file a request, and an agent reads it and
writes code from it. The text can carry instructions aimed at the agent, hidden
characters, or names built to break a page, a comment or a log.

## Decision

Everything a participant controls is data, never code or instructions. Agents
read a request only as a description of what to draw, and every place that
shows or passes on participant text uses one of a few safe paths (listed under
**Untrusted input** in `AGENTS.md`).

## Alternatives considered

- **Trust the agent to tell orders from content.** Rejected: one clever
  issue is enough, and the factory can run unattended.
- **Strip or filter suspicious text.** Rejected as the main defence: filters
  miss things. The hidden-text scan is an extra layer, not the rule.

## Consequences

Every new feature that shows participant text has to pick the right safe
path. A request that asks for anything but its author's own booth is declined
or asked about, even when it looks harmless.
