# 0023. Names and comments say why, not only what

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

Agents write most of the code here, and they tend to name things after the
mechanism (`handleData`, `.box2`, `processItems`) and to write comments that
repeat the line below them. Those names and comments are free to write and
useless to the next reader, who needs to know what a thing is for, what it
protects and why it is the way it is.

## Decision

- Names of classes, functions, CSS classes and files say what the thing is in
  the carnival's own terms (a booth, a plot, the gate, a construction site), not
  how it works.
- A doc comment explains purpose and reasons: what it's for, what would break
  without it, what rule or decision it carries out (linking the ADR or spec). It
  doesn't narrate the code.
- Specs describe behaviour from the point of view of the person who sees it, and
  ADRs say why.
- A review lens checks it on every pull request, since a script can't judge
  meaning ([0016](0016-enforce-every-rule.md)).

## Alternatives considered

- **A naming convention enforced by lint.** Rejected as enough on its own: lint
  can check shape (case, prefixes), not whether a name means anything. Shape
  rules can be added beside the lens.
- **Leave it to taste.** Rejected: agents follow written expectations, and
  reviewers need one to point at.

## Consequences

Reviews will ask for renames and rewritten comments, which slows some pull
requests a little. Existing code is renamed when it's next touched, and
especially when it's split under [0019](0019-small-files.md).
