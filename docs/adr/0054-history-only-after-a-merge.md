# 0054. Read the squares' history only after a merge

- Status: Accepted
- Date: 2026-11-26
- Spec: [previews-and-deploy.md](../specs/previews-and-deploy.md)

## Context

Every deploy ran `scripts/write-square-history.ts`, which reads every issue
and pull request in the repository through GraphQL, with their label
timelines, files and review threads, for the squares' credits and the
factory's numbers. Deploys run on pushes, but also on issue and pull request
labels (to put up a booth being built) and after preview builds, about ten an
hour on a busy day. All the workflows share one `GITHUB_TOKEN` budget, and on
26 November a deploy failed with "API rate limit already exceeded".

## Decision

- A deploy reads the history afresh only on a push to `main` or a
  `workflow_dispatch`, which is how the gate publishes its own merge (a merge
  made with the workflow's token starts no push run) and how a person
  publishes by hand.
- Every deploy publishes `square-history.json` beside the page, and any other
  deploy copies that published file instead of reading the API. With no
  published copy, it reads afresh.

## Alternatives considered

- **Read only what changed since the last run.** Rejected for now: it needs
  the history merged incrementally, more code for a cost the reuse already
  removes.
- **A GitHub App token with its own budget.** Still worth doing before a
  launch, and needs a maintainer to create the app; it doesn't make reading
  everything on every label any less wasteful.

## Consequences

Label-driven deploys, the ones that show a booth being built, no longer touch
the history at all. The factory's numbers move on with each merge rather
than each label, so a request that is accepted shows in them at the next
merge. `square-history.json` is public, as each preview's copy already was.
