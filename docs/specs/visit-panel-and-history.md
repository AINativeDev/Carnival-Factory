# Visit panel and history

Inside a square, a panel beside the room says what it is, who made it, how it
was built, and how to share it or leave.

## Behaviour

- The panel shows the square's name, its credits ("Made by @a. Improved by
  @b and @c.", each linked to the GitHub profile, with the owner's avatar when
  the build has it), and its description.
- A booth shows **Remix this booth** and **Build your own**. Remix opens the
  booth form pre-filled: title "My booth: a remix of @<login>'s booth" and
  "Start from @<login>'s <name>, copied into my own booth and credited to
  @<login>."
- An Elf Engineer's booth links to their own factory. A booth with a People's
  Choice comment links to it with "Vote for this booth".
- **Share** copies a line such as "@<login> built <name> at the North Pole
  Carnival. Come visit, and build your own: <link>". The link is the square's
  share page, `share/<kind>-<id>.html`, on the live site even from a preview.
  The text can be edited. Without a clipboard, it is shown selected.
- A booth's help lists Ask for a change, Share it as yours (the line then
  says "I built"), the Elf Engineer form, the advent calendar and the owner's
  season card.
- Someone who arrived by a shared link to a booth is invited to claim the plot
  next door, until they leave or claim.
- **How was this built?** lists the square's requests, newest first: the
  issue, who asked, when, the decision (Accepted, Asked a question, Declined,
  Waiting for the assessment) and each pull request with its state, review
  findings fixed, commits and, while open, a preview link. It is open on a
  wide screen and folded on a phone. A build without history says timelines
  appear once this is on the live map.
- Leaving: Esc, the Leave button, the "Back to the map" button in the top
  left corner, or walking out through the doorway.
- The banner's GitHub link goes to the repository.

## Rules

- Security: history links are only `https:` links, else `#`, and the history
  names who asked without mentioning them (enforced by:
  src/history.test.ts). Remix names are capped at 40 characters and
  URL-encoded (enforced by: src/northpole/links.test.ts). Every name,
  description, title and login is set as text, never as HTML (not enforced
  yet).
- History is read at build time from the public issues and pull requests and
  bundled into the page. A request belongs to the squares its factory pull
  requests change, and a booth request also to its author's booth. Titles are
  capped at 120 characters (enforced by: scripts/square-history.test.ts).
- Credits: the authors of requests whose pull requests merged into the folder,
  each once, in merge order. A booth's maker is its owner; without history,
  a booth credits its owner and an attraction credits nobody (enforced by:
  scripts/square-history.test.ts, src/history.test.ts).
- Share links go to the square's share page on the live site, even from a
  preview (enforced by: src/northpole/visit.test.ts, the Share test in
  smoke/squares.spec.ts).
- Esc, Leave, the back button and walking out all leave the square (enforced
  by: smoke/squares.spec.ts).

## Where it lives

`src/visit-hud.ts`, `src/visit-help.ts`, `src/craft-badges.ts`, `src/history.ts`, `scripts/square-history.ts`,
`scripts/write-square-history.ts`, `scripts/share-pages.ts`,
`src/northpole/visit.ts`, `src/northpole/links.ts`, `src/northpole/interior.ts`,
`index.html`.

## Tested by

`src/history.test.ts`, `scripts/square-history.test.ts`,
`scripts/share-pages.test.ts`, `src/northpole/visit.test.ts`,
`src/northpole/links.test.ts`, `src/northpole/interior.test.ts`,
`smoke/squares.spec.ts` (Share, leaving, the invitation, the back button, the
banner link, history blocks).
