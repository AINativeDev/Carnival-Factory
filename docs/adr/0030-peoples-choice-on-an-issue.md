# 0030. People's Choice votes on a pinned issue, not a discussion

- Status: Accepted
- Date: 2026-11-25
- Spec: [peoples-choice.md](../specs/peoples-choice.md)

## Context

People's Choice counted 👍 reactions on one comment per entry in a GitHub
Discussion, so it needed Discussions turned on for the repository. The
maintainers would rather not run Discussions just for this. A vote is only a
reaction, and reactions work the same on issue comments.

## Decision

The ballot is an issue titled exactly "People's Choice", opened by a maintainer
(matched by numeric id), pinned and left unlocked. The deploy adds one comment
per entry and counts their 👍 exactly as before: one per account, not the
owner's, not after voting closes. The standings' links must point at this
repository's issues; the panel says "Vote on GitHub". The deploy's token gets
`issues: write` instead of `discussions: write`.

## Alternatives considered

- **Turn on Discussions.** Rejected: a whole feature to moderate for one vote.
- **One issue per booth.** Rejected: dozens of issues in the tracker, mixed in
  with real requests, for no gain over one comment each.
- **Votes on the site itself.** Rejected: it needs a backend and accounts, and
  the page calls no server of ours ([0009](0009-no-network-from-the-page.md)).

## Consequences

The issue must stay unlocked, since a locked issue takes no reactions from
people without write access, so anyone can also comment on it; only 👍 on the
deploy's own entry comments count. Standings already built from a discussion
stop validating, which is fine: none exist yet.
