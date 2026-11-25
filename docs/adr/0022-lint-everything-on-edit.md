# 0022. Lint code, JSON and Markdown, and check on every agent edit

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

Rules checked only in CI reach an agent minutes later, after it believes it is
done. JSON and Markdown had formatting checks but no linting, though JSON files
carry the kill switch, plot pins and challenges, and Markdown carries the rules
agents follow.

## Decision

- Code is linted by Oxlint ([0020](0020-oxlint.md)), Markdown by markdownlint,
  and every JSON file must parse and be formatted.
- Claude Code hooks in `.claude/settings.json` run the same checks on each file
  an agent writes or edits, and report problems back to the agent at once. A
  check at the end of the agent's turn runs the whole-project checks, such as
  Knip.
- CI runs the same commands, so the hooks are a fast path, not a different rule.

## Alternatives considered

- **CI only.** Rejected: feedback arrives after the agent has moved on.
- **Git pre-commit hooks.** Rejected as the main path: agents that don't commit
  never see them, and hooks reach the agent mid-task.

## Consequences

Hooks only reach agents that run Claude Code; others still get CI. The hook
commands must stay quick, so they check only the edited file.
