# 0047. Year in Review answers are moderated and baked in at build

- Status: Accepted
- Date: 2026-11-25
- Spec: [year-in-review.md](../specs/year-in-review.md),
  [levels.md](../specs/levels.md), [attractions.md](../specs/attractions.md),
  [booth-requests.md](../specs/booth-requests.md)

## Context

The maintainer asked for an example place built around a list of questions
about the year in AI, seven looking back on '26 and six looking ahead to '27,
as a gallery room with pictures of the attractions and fun things, where people
can submit their own answers, and their own question. The site has no server,
the page never reaches the network
([ADR 0009](0009-no-network-from-the-page.md)), and anything a visitor writes
is untrusted text that would be shown to every other visitor.

The North Pole's own levels already exist ([ADR 0035](0035-north-pole-levels.md)),
indoors with items on displays ([ADR 0040](0040-indoor-levels.md)), but a level
may have at most 8 squares, and thirteen questions and a guestbook are 14.

## Decision

- **The place.** An attraction, `the-year-in-review`, stands on plot 12 as a
  new landmark, `gallery`, and opens a North Pole level of the same id: a
  gallery room with an old masters' wing (looking back) and a modern wing
  (looking ahead), new gallery props, and each question an item on a display,
  its `description` the question word for word, plus a guestbook item,
  `your-questions`. A North Pole level may have up to 16 squares; a
  participant's level keeps the limit of 8.
- **Answers come in on an issue form**, **Year in review**
  (`07-year-in-review.yml`, label `year-in-review`), and the
  `welcome-year-in-review` skill moderates each one when it's opened: a
  fitting answer gets `year-in-review-accepted` and is **closed as completed**
  (closed keeps the tracker clear; accepted answers are read open or closed),
  an unfitting one gets `declined` and is closed as not planned, and an unsure
  one gets `needs-human`. The skill never adds `tessl`.
- **The deploy bakes them in.** `scripts/write-year-in-review.ts` reads the
  accepted issues through the GraphQL API and `scripts/year-in-review.ts`
  turns them into answers keyed by item, newest first, as plain text: hidden
  and control characters stripped, answers capped at 280 characters and
  questions at 140, and anything else dropped. It leaves out an issue that
  is also `declined`, or whose author **edited it after it was accepted**, so
  moderation can't be bypassed by an edit; a maintainer accepts it again. The
  build bakes the file in (`__YEAR_IN_REVIEW__`), and the page cleans it once
  more (`cleanYearInReview`) and sets every word with `textContent`. Previews
  have none, like People's Choice.
- **The link to answer** is the level's own link out, "Add your answer", in
  the maintainers' list ([ADR 0038](0038-north-pole-links.md)).

## Alternatives considered

- **Answers as comments on one issue, like People's Choice.** Fewer issues,
  but a comment can't carry a form's fields, can't be labelled to accept it
  one by one, and anyone could edit theirs after it was read.
- **Show every answer, unmoderated.** Simpler, but the page would show
  anything anyone wrote, including other people's names, to everyone.
- **Fetch the answers from the page.** Live, but the page never reaches the
  network, and the API's rate limits would fail visitors.
- **A participant-style level with 8 squares, the questions grouped.** Kept
  the old limit, but a question to discover per display is the point of the
  room; the larger limit is only for maintainers' folders.

## Consequences

- A new answer shows on the next deploy, not at once.
- Answers stay open to anyone who reads the issues, as everything here does.
- Moderation is a skill's judgement, with `needs-human` when unsure, and
  maintainers can remove an answer by removing its label or adding `declined`.
- The North Pole's levels may now hold up to 16 squares, each its own
  sandboxed frame, within the map's 24 live frames.
