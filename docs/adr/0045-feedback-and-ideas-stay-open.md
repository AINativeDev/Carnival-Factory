# 0045. Feedback and ideas have forms of their own, and stay open

- Status: Accepted
- Date: 2026-11-25
- Spec: [booth-requests.md](../specs/booth-requests.md)

## Context

Blank issues are off, and every form was a request for the factory: a booth, a
level, a badge or an advent challenge. Kudos and ideas had no form, so a
visitor couldn't file one from the site at all. The maintainers love kudos and
ideas, and want to read them.

## Decision

Two more forms, **Feedback on the factory** (`feedback`) and **An idea**
(`idea`). The `welcome-feedback` skill thanks the author, adds `kudos` to
praise, and leaves the issue open. It closes one only when it's clearly not
appropriate (spam, abuse, unsafe, or off-topic), and asks a maintainer
(`needs-human`) when unsure. It never hands an idea to the factory: a
maintainer adds `tessl` when they want one built.

## Alternatives considered

- **Re-enable blank issues.** Rejected: free-form issues mix requests, bugs
  and ideas, and the factory's triggers key on form labels.
- **Let the factory build ideas straight away.** Rejected: an idea is a
  suggestion, not a spec, and building one is the maintainers' choice.

## Consequences

Feedback and ideas pile up as open issues for the maintainers to read and
triage; the skill keeps out spam and abuse so the list stays worth reading.
