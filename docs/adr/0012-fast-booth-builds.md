# 0012. Booths get their own lighter factory action

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #100, #104, #111
- Spec: [booth-requests.md](../specs/booth-requests.md)

## Context

A booth took about 12 minutes from request to map, most of it in the build.
Logs showed the agent reading files it didn't need and retrying a browser test
its sandbox can't run.

## Decision

Booth requests go to their own factory action: a faster model, a bigger
machine, and instructions scoped to one folder that skip the browser test.
Map work keeps the general action.

## Alternatives considered

- **One action for everything, with better context.** Tried first; booths
  were still slower than they needed to be.
- **Run the smoke test in the factory.** Rejected: its sandbox can't start a
  browser, and CI runs it anyway.

## Consequences

A booth goes from request to the map in about 8 to 10 minutes. The booth
action's instructions repeat parts of `AGENTS.md` and must change with it.
