# 0005. Build the square's worker into the frame's script

- Status: Accepted
- Date: 2026-11-24
- Pull requests: #129
- Spec: [squares-and-sandbox.md](../specs/squares-and-sandbox.md)

## Context

The frame started its worker from a blob that loaded the worker's script from
the site. Safari, which every iPhone browser uses, reads `script-src 'self'` in
an opaque-origin frame as matching nothing, so every square showed broken on
phones. The smoke test ran only in Chromium, so nothing caught it.

## Decision

Bundle the worker into the frame's own script, so it starts from a blob with
nothing to load, and run a WebKit iPhone smoke test in CI.

## Alternatives considered

- **Loosen the policy** (an explicit origin, `blob:` scripts). Rejected: the
  frame's origin is opaque by design, and a looser policy is a wider door.
- **Drop the worker and run squares on the frame's thread.** Rejected: the
  frame could no longer stop a square that hangs.

## Consequences

The frame's script is bigger, as it carries the worker. Any change to how
frames load code must pass in WebKit, not only Chromium.
