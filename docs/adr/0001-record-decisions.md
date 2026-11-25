# 0001. Record functionality in specs and decisions in ADRs

- Status: Accepted
- Date: 2026-11-25

## Context

The repository grew fast: a map, a sandbox, a factory that builds booths from
issues, a merge gate and several seasonal features, most of it in a day. The
pull requests say why each change was made, but nobody reads 130 pull requests
to learn why the sandbox loads its worker the way it does. Agents working on the
repository have the same problem, and more often.

## Decision

- `docs/specs/` describes what each part of the system does today: its
  behaviour, its rules, where it lives and which tests pin it.
- `docs/adr/` records each decision a future reader would question, numbered,
  and never rewritten: a changed decision gets a new record that supersedes the
  old one.
- A change to the map's code updates its spec in the same pull request, and
  adds an ADR when it makes or reverses such a decision. `AGENTS.md` says so.
- Decisions are tracked as they're made, not only when code changes: a
  decision taken in discussion gets its record the same day, and a question
  still open gets a **Proposed** record with its options, which becomes
  **Accepted** once it's settled.
- Booth and level pull requests change only the participant's own folder, so
  they never touch either.

## Alternatives considered

- **Pull request descriptions only.** Rejected: the reasons exist, but are
  scattered over a hundred pull requests and can't be updated.
- **Everything in `AGENTS.md`.** Rejected: it's the guide for working here, and
  it would grow too long to read before every change.

## Consequences

Specs can drift from the code if a change forgets them; reviewers check that
they move together. Records 0002 to 0015 were written after the fact, from the
pull requests that carried them out; their alternatives are the options those
pull requests and the design rule out.
