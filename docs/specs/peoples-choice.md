# People's Choice

Visitors vote for their favourite booth, and for the best home factory, with
a thumbs-up on its comment on one pinned GitHub issue, the ballot
([ADR 0030](../adr/0030-peoples-choice-on-an-issue.md)). The site has no server,
so the deploy counts the votes and the build bakes them in.

## Behaviour

- A maintainer opens an issue titled exactly "People's Choice" once, pins it
  and leaves it unlocked, since a locked issue takes no reactions from people
  without write access. Discussions don't need to be on.
- While voting is open, each deploy adds one comment for every booth and
  every Elf Engineer's factory that has none yet.
- Below the map, a folded list shows the booths with a trophy and the home
  factory leader on one line ("No votes yet" when none), and unfolds to every
  entry's place and votes, with a link to vote on GitHub and when voting closes. Booth
  entries link to the booth on the map; factory entries to the repository.
  The list is hidden when the build has no standings.
- The top three booths wear a trophy on their stall. Ties share a place
  (1, 1, 3); an entry without votes has no place.
- A booth's visit panel links to its comment: "Vote for this booth".
- Voting closes at `VOTING_CLOSES`, 2026-12-31T23:59:59Z.

## Rules

- One vote per GitHub account, because a reaction is. The owner's own vote,
  matched by the numeric user id written into the comment's marker, never
  counts, even after the login changes hands. A vote given after closing, or
  from a deleted account, doesn't count (enforced by:
  scripts/peoples-choice.test.ts).
- Only comments the deploy's own token wrote count, and only the first one
  per entry. A booth must be on the map and not in the kill switch; a factory
  must belong to a badge holder. Entries are sorted by votes, then login
  (enforced by: scripts/peoples-choice.test.ts).
- Ties share a place, an entry without votes has no place, and the top three
  booths get a trophy (enforced by: src/northpole/peoples-choice.test.ts).
- Security: entry comments ping no one (enforced by:
  scripts/peoples-choice.test.ts). `cleanChoice` keeps only well-formed
  logins and repositories, links into this repository's issues, and no
  switched-off booth (enforced by: src/northpole/peoples-choice.test.ts).
  The page never reaches the network (enforced by: the request check in
  smoke/support/carnival.ts). Every login is set as text (not enforced yet).
- Without the ballot, the deploy writes nothing and the map shows no
  standings (enforced by: src/northpole/peoples-choice.test.ts).

## Where it lives

`src/northpole/peoples-choice.ts`, `src/northpole/peoples-choice-standings.ts`,
`src/peoples-choice-hud.ts`, `scripts/peoples-choice.ts`,
`scripts/ballot.ts` (the ballot issue on GitHub), `scripts/write-peoples-choice.ts`,
`src/northpole/render.ts` (trophies).

## Tested by

`src/northpole/peoples-choice.test.ts`, `scripts/peoples-choice.test.ts`,
`src/peoples-choice-hud.test.ts`, `src/peoples-choice-panel.test.ts`, `scripts/ballot.test.ts`.
