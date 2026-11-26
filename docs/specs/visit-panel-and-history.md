# Visit panel and history

Inside a square, a panel beside the room tells how the square was built, from
the first request to the map, then offers one row of actions. The room's own
sign already shows the square's name and maker, so the panel doesn't repeat
them. A level shows the same panel beside its map (see [Levels](levels.md)).

## Behaviour

- The panel opens with the square's description. Its name is a heading for
  screen readers only, since the room's sign shows it. A level's panel shows
  its name, "A level by @<login>" (or "the North Pole") and its description,
  and its **How it was built** tells the level's own requests.
- **How it was built** leads the panel, on every screen size: a timeline, oldest
  first, of who asked for it and in which issue ("Asked for by @a in #70"),
  each pull request the factory built ("Built by the factory in #72", "Improved
  by the factory in #102", "Being built by the factory" while open) with its
  review findings fixed, commits and state, each later change and who asked for
  it, and finally "On the map" once something merged. Every person links to
  their GitHub profile. A build without history, such as a preview, says "Made
  by @a", then "On the map"; an attraction without history says timelines
  appear once it's on the live map.
- **The room tells it too.** The room is dressed as the square's own: its side
  walls match its stall outside (logs for a cabin, striped fabric for a tent,
  planks otherwise) trimmed in its roof colour, a window on the left wall shows
  the dusk with snow falling, a lamp lights it warm from the upper left, and
  snow drifts in at the doorway. Right of the stage, a pinboard headed "How it
  was built" pins the same story as notes: a request as a letter, a change as
  a note, each build as a blueprint stamped with its fixes ("2 fixed") or
  "Clean", and a gold star for the map. It holds four, keeping the first
  request and the latest steps, and is left out when the wall is too narrow,
  as on a phone. A level's squares have no board.
- Under the timeline, one quiet line lists the craft badges the square earned
  ("Code: Small files · Tested · …"), with how squares are checked.
- **Remix this booth** waits behind the `remix` feature flag, and the Elf
  Engineer's factory link behind `elfEngineer` ([ADR 0046](../adr/0046-launch-behind-feature-flags.md)): both are off on the
  live site, so the panel hides them.
- A booth shows **Remix this booth** and **Build your own**. Remix opens the
  booth form pre-filled: title "My booth: a remix of @<login>'s booth" and
  "Start from @<login>'s <name>, copied into my own booth and credited to
  @<login>."
- An Elf Engineer's booth links to their own factory. A booth with a People's
  Choice comment links to it with "Vote for this booth".
- **Share** stands over the room, not in the panel, so a long build story
  never hides it: a pill with the usual share icon at the room's top right,
  just left of the panel (on a phone, the room's own top-right corner). On a
  phone it opens the phone's share sheet; elsewhere it copies the line and
  says "Copied". A level's pill steps aside while the player is inside one of
  its squares (`src/visit-share.ts`; enforced by: src/visit-share.test.ts,
  smoke/sharing.spec.ts).
- **Full screen**, a quieter pill just under Share, shows a booth's or
  attraction's drawing edge to edge: the biggest square that fits, sharp at
  the screen's own pixels, on a night background, with only **Exit full
  screen** in the corner. It uses the browser's full screen where it has one
  and fills the page where it hasn't (Safari on an iPhone). Esc, or the pill
  again, comes back to the room, not out of the booth; walking keys and room
  clicks do nothing meanwhile. Booths need no change: each draws to whatever
  size it's given (`src/visit-full-screen.ts`, `src/northpole/full-screen.ts`;
  enforced by: src/visit-full-screen.test.ts,
  src/northpole/map-full-screen.test.ts, smoke/visit.spec.ts).
- Under the story, one quiet row: **Vote for this booth** and
  **Remix this booth**, then one ask: "Want one too? Get a booth". Someone
  who arrived by a shared link to a booth gets **Get the spot next door** in
  its place, until they leave or take it. The booth's owner (picked with
  "This is me" or "Share it as yours") gets "Next: get a level of your own"
  (the level form) in its place instead, since a level unlocks once you have
  a booth ([ADR 0048](../adr/0048-a-level-unlocks-after-a-booth.md)).
- Everything else folds under **More**: the message Share copies and **See it
  on the map**, an Elf Engineer's own factory, the factory's numbers, running a
  factory on your own repo, the owner's links and keep me posted.
- A preview build has no history baked in, so the deploy puts the live site's
  `square-history.json` beside each preview, and the panel reads it from its
  own site and tells the story from it.
- **Share** copies a line such as "@<login> built <name> at Carnival Factory.
  Come visit, and get a booth too: <link>", with the site's name from
  `src/edition.ts`. The link is the square's
  share page, `share/<kind>-<id>.html`, on the live site even from a preview.
  The text can be edited. Without a clipboard, it is shown selected. A level
  has no share page: its line says "<name>, a level," and links to
  `#/level/<login>` on the page's own site.
- A level's help asks its owner "Is this yours? Ask for a change" (the level
  form); one of the North Pole's own levels says only its maintainers change
  it.
- A booth's help lists Ask for a change, Share it as yours (the line then
  says "I built"), the Elf Engineer form, the advent calendar and the owner's
  season card.
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
  bundled into the page, keyed `booth/<login>`, `attraction/<id>` and
  `level/<login>`. A request belongs to the squares its factory pull
  requests change (a level's from any file in `carnival/levels/<login>/`), a
  `booth-request` also to its author's booth, and a `level-request` to its
  author's level. Titles are
  capped at 120 characters (enforced by: scripts/square-history.test.ts).
- Credits: the authors of requests whose pull requests merged into the folder,
  each once, in merge order. A booth's or a participant's level's maker is
  its owner; without history, they credit their owner, and an attraction or
  one of the North Pole's own levels credits nobody (enforced by:
  scripts/square-credits.test.ts, scripts/square-history.test.ts,
  src/history.test.ts).
- Share links go to the square's share page on the live site, even from a
  preview (enforced by: src/northpole/visit.test.ts, the Share test in
  smoke/sharing.spec.ts).
- Esc, Leave, the back button and walking out all leave the square (enforced
  by: smoke/visit.spec.ts).

## Where it lives

`src/visit-hud.ts`, `src/level-panel.ts`, `src/build-story.ts`, `src/build-story-view.ts`,
`src/visit-share.ts`, `src/visit-template.ts`, `src/visit-help.ts`, `src/craft-badges.ts`, `src/history.ts`, `scripts/square-history.ts`, `scripts/github-requests.ts`,
`scripts/square-credits.ts`, `scripts/history-squares.ts`, `scripts/write-square-history.ts`, `scripts/share-pages.ts`,
`src/northpole/visit.ts`, `src/northpole/links.ts`, `src/northpole/interior.ts`,
`src/northpole/interior-room.ts`, `src/northpole/interior-stage.ts`,
`src/northpole/room-dressing.ts`, `src/northpole/room-walls.ts`,
`src/northpole/pinboard.ts`, `src/northpole/pinboard-layout.ts`, `index.html`.

## Tested by

`src/history.test.ts`, `src/build-story.test.ts`, `src/build-story-view.test.ts`,
`src/visit-hud.test.ts`, `src/level-panel.test.ts`, `src/visit-share.test.ts`, `src/history-load.test.ts`, `scripts/square-history.test.ts`, `scripts/github-requests.test.ts`,
`scripts/square-credits.test.ts`, `scripts/history-squares.test.ts`,
`scripts/share-pages.test.ts`, `src/northpole/visit.test.ts`,
`src/northpole/links.test.ts`, `src/northpole/interior.test.ts`,
`src/northpole/room-dressing.test.ts`, `src/northpole/room-walls.test.ts`,
`src/northpole/pinboard.test.ts`, `src/northpole/pinboard-layout.test.ts`,
`smoke/visit.spec.ts` (leaving, the invitation, the back button, the build
story's layout), `smoke/sharing.spec.ts` (Share) and `smoke/map.spec.ts` (the
banner link), and `smoke/levels.spec.ts` (a level's
panel, clear of the way home).
