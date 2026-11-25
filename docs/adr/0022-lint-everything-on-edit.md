# 0022. Lint code, JSON, Markdown and shell, and check on every agent edit

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

Rules checked only in CI reach an agent minutes later, after it believes it is
done. JSON, Markdown and shell had formatting checks or nothing, though JSON files
carry the kill switch, plot pins and challenges, and Markdown carries the rules
agents follow.

## Decision

- Code is linted by ESLint ([0020](0020-keep-eslint.md)), Markdown by markdownlint,
  and every JSON file must parse and be formatted.
- Shell scripts are checked by ShellCheck, and workflows by actionlint, which
  also runs ShellCheck on every `run:` step, where most of our shell lives.
  CI runs actionlint from its pinned official image; the hooks use local
  binaries when they're installed and say so when they're not.
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
