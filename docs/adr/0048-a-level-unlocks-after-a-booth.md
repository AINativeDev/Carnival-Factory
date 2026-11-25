# 0048. A level unlocks after a booth

- Status: Accepted
- Date: 2026-11-25
- Spec: [levels.md](../specs/levels.md),
  [booth-requests.md](../specs/booth-requests.md)

## Context

There are two request forms side by side, **Your booth** and **Your level**,
and nothing said which comes first. A level is a much bigger build than a
booth, and its pull request waits for a maintainer. The maintainer asked
whether a level should be an unlock after the booth.

## Decision

A level unlocks once you have a booth. The assessment builds a level request
only when its author has `carnival/booths/<author>/booth.ts` on `main`, or an
accepted booth request being built (open, labelled `booth-request` and
`tessl`). Otherwise it asks: a kind reply that links the **Your booth** form,
`needs-info`, and the issue stays open, so it goes ahead when the author
edits or replies after their booth lands. It is never a decline.

The site says the same. The level form's intro says levels unlock once you
have a booth. A level's panel asks "Want one too? Get a booth first, then a
level", and a booth's panel, for its owner (picked with "This is me" or
"Share it as yours"), asks "Next: get a level of your own" instead of "Get a
booth".

## Alternatives considered

- **Decline a level request without a booth.** Rejected: the idea is fine, it
  just comes early, and a closed issue would make the author write it again.
- **Build the booth and the level from one request.** Rejected: it mixes two
  folders and two review paths in one pull request, and a level's needs a
  maintainer.
- **Only hint at it on the site.** Rejected: every rule gets something that
  enforces it ([ADR 0016](0016-enforce-every-rule.md)), here the assessment.

## Consequences

Everyone starts with a booth, the small build that merges on its own, and a
level follows for those who want more. A level request waits a little longer
for someone new. The assessment checks one more fact, the author's booth, and
the site knows a booth's owner only when they said who they are.
