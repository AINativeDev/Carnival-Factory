# Visit panel and history

Inside a square, its drawing fills the screen beside a panel that names it
and tells how it was built, from the first request to the map, then offers
one ask ([ADR 0057](../adr/0057-a-visit-is-the-booth-not-a-room.md)). A level shows the same panel beside its map (see [Levels](levels.md)).

## Behaviour

- **The drawing fills the screen.** On a laptop it's the biggest square left
  of the panel, from just under the top bar to the bottom, sharp at the
  screen's own pixels. Round it, the rest of the screen is a soft, dimmed glow
  of the drawing's own colours, so the page blends into the booth, or the
  mood the square chose instead (`stall.scene`, see
  [Squares and sandbox](squares-and-sandbox.md)). Nobody
  walks inside: keys do nothing, and a click or a drag is the square's to
  play with. Booths need no change: each draws to whatever size it's given
  (`src/northpole/map-room.ts`, `src/northpole/visit-stage.ts`; enforced by:
  src/northpole/visit-stage.test.ts, src/northpole/map-inside.test.ts).
- The top bar names the square beside the site's name, "<name> by @<login>"
  for a booth (`src/visit-banner.ts`; enforced by: src/visit-banner.test.ts). The
  panel opens with its description, with its name as a heading for screen
  readers. A level's panel shows
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
- **Share** stands in the panel's footer, an icon beside the ask, so a long
  build story never hides it; a level's own panel has it there too, and it
  steps aside while the player is inside one of the level's squares. It opens
  the phone's share sheet on a phone; elsewhere it copies the line, and its
  hidden label shows "Copied" for a moment, or opens the line to copy by hand
  without a clipboard (`src/visit-share.ts`; enforced by:
  src/visit-share.test.ts, smoke/sharing.spec.ts).
- **On a phone held upright** the drawing fills the screen's width under the
  way back to the map, and the panel is a sheet below it. The sheet's grip drags it between a sliver and most of the
  screen, resting at a quarter, half or most of it when let go; the arrow keys
  step through those on the grip.
  (`src/visit-sheet.ts`, `isPhoneUpright` and `wideBox` in
  `src/northpole/visit-stage.ts`; enforced by: src/visit-sheet.test.ts,
  src/northpole/visit-stage.test.ts, src/northpole/map-inside.test.ts).
- Under the story, one quiet row: **Vote for this booth** and
  **Remix this booth**, then one ask: "Want one too? Get a booth". Someone
  who arrived by a shared link to a booth gets **Get the spot next door** in
  its place, until they leave or take it. The ask stays in a footer stuck to
  the panel's foot, however long the story above it. The booth's owner (picked with
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
- Esc, Leave and the back button leave the square (enforced
  by: smoke/visit.spec.ts).

## Where it lives

`src/visit-hud.ts`, `src/level-panel.ts`, `src/build-story.ts`, `src/build-story-view.ts`,
`src/visit-share.ts`, `src/visit-template.ts`, `src/visit-help.ts`, `src/craft-badges.ts`, `src/history.ts`, `scripts/square-history.ts`, `scripts/github-requests.ts`,
`scripts/square-credits.ts`, `scripts/history-squares.ts`, `scripts/write-square-history.ts`, `scripts/share-pages.ts`,
`src/northpole/visit.ts`, `src/northpole/links.ts`, `src/northpole/interior.ts`,
`src/northpole/visit-stage.ts`, `src/northpole/map-room.ts`, `src/visit-sheet.ts`,
`index.html`.

## Tested by

`src/history.test.ts`, `src/build-story.test.ts`, `src/build-story-view.test.ts`,
`src/visit-hud.test.ts`, `src/level-panel.test.ts`, `src/visit-share.test.ts`, `src/history-load.test.ts`, `scripts/square-history.test.ts`, `scripts/github-requests.test.ts`,
`scripts/square-credits.test.ts`, `scripts/history-squares.test.ts`,
`scripts/share-pages.test.ts`, `src/northpole/visit.test.ts`,
`src/northpole/links.test.ts`, `src/northpole/interior.test.ts`,
`src/northpole/visit-stage.test.ts`, `src/northpole/map-inside.test.ts`,
`src/visit-sheet.test.ts`,
`smoke/visit.spec.ts` (leaving, the invitation, the back button, the build
story's layout), `smoke/sharing.spec.ts` (Share) and `smoke/map.spec.ts` (the
banner link), and `smoke/levels.spec.ts` (a level's
panel, clear of the way home).
