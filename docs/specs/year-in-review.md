# The Year in Review

A gallery room at the North Pole about the year in AI: a question to discover
on every display, looking back on '26 and ahead to '27, and the answers
visitors gave, moderated and baked in at build
([ADR 0047](../adr/0047-year-in-review-answers.md)).

## Behaviour

- The attraction `the-year-in-review` stands on spot 12 as a `gallery`
  landmark. Opening it from the map takes the sleigh into the North Pole
  level of the same id; it has no sleigh platform
  ([attractions.md](attractions.md), [levels.md](levels.md)).
- The level is an indoor gallery, 19 tiles each way. The old masters' wing,
  along the upper left wall under LOOKING BACK ON '26, hangs gilded frames
  with brass plaques behind a velvet rope; the modern wing, along the upper
  right wall under LOOKING AHEAD TO '27 and a neon '26 → '27, is a white wall
  of thin black frames. The pictures show the attractions in different styles
  (the ferris wheel in a swirling night, the big top and a cocoa still life in
  dark oils, a crooked expressionist gingerbread house, a portrait whose eyes
  follow you; the carousel and the studio as pop art, The Factory's tower as a
  poster, the ice rink as colour fields, the schoolhouse as a grid, the
  coaster as a splatter), each under a track light. Between them stand
  statues, a mobile, a mirrorball over the dance floor, a bench, WET PAINT and
  DO NOT TOUCH signs, a guard and a visitor elf, balloons and confetti.
- Each of the 13 questions is an item on a display: the seven looking back on
  easels in gilded frames, the six looking ahead on white plinths in black
  frames. Its name is a short title and its description is the question word
  for word (`YEAR_QUESTIONS` in `src/northpole/year-in-review.ts`). The
  guestbook, `your-questions`, on the reception desk, holds visitors' own
  questions.
- Every panel in the level, and the landmark's room, has an **Add your
  answer** button to the **Year in review** form, in a new tab.
- An item's panel shows, under its question and that button, **Your
  answers**: the accepted answers, newest first, each the visitor's words and
  "— @login". With none yet it says "No answers yet — be the first." The
  guestbook shows **Your questions, and your answers**, each with its
  question.
- The form asks which question (the 13, word for word, or "My own question"),
  their own question if they chose that, and their answer. The
  `welcome-year-in-review` skill moderates it ([booth-requests.md](booth-requests.md)).
- The deploy reads the issues labelled `year-in-review-accepted` and bakes
  their answers into the page. A preview, or a local build, has none.

## Rules

- The page never asks GitHub: the answers are baked in at build as
  `__YEAR_IN_REVIEW__`, from the file `scripts/write-year-in-review.ts`
  writes, and a failed read publishes the map without them (enforced by:
  scripts/build-data.test.ts, src/northpole/build-baked.test.ts, the
  "Read the Year in Review's answers" step in .github/workflows/pages.yml).
- Every answer is a visitor's own words: plain text on one line, hidden and
  control characters stripped, answers capped at 280 characters and questions
  at 140, logins checked, only the room's items kept, at most 100 an item,
  cleaned when the deploy writes them and again when the page reads them, and
  set on the page only with `textContent` (enforced by:
  src/northpole/year-in-review.test.ts, scripts/year-in-review.test.ts,
  src/year-in-review-panel.test.ts).
- Only an accepted answer shows: labelled `year-in-review-accepted`, not
  `declined`, not edited by its author since it was last accepted, with an
  author, a known question and an answer, and its own question for the
  guestbook (enforced by: scripts/year-in-review.test.ts).
- The form's options are the questions word for word, and its field labels
  are the ones the script reads; each item's description is its question
  (enforced by: scripts/year-in-review.test.ts,
  src/northpole/year-in-review.test.ts).
- Workflow data reaches the script through `env:` only (enforced by:
  actionlint, the house rules for workflows).
- A North Pole level may have up to 16 squares; a participant's level up to 8
  (enforced by: src/northpole/level-check.test.ts).
- The gallery's drawings are pinned and move calmly: the neon never goes
  dark, nothing flashes (enforced by: src/northpole/gallery-pins.test.ts,
  src/northpole/landmarks.test.ts, src/northpole/north-pole-places-pins.test.ts,
  the smoke test's flashing check).

## Where it lives

- `carnival/attractions/the-year-in-review/`, `carnival/levels/the-year-in-review/`
- `src/northpole/year-in-review.ts`, `src/northpole/year-in-review-answers.ts`,
  `src/year-in-review-panel.ts`, `src/northpole/landmark-gallery.ts`,
  `src/northpole/gallery-*.ts`
- `scripts/year-in-review.ts`, `scripts/write-year-in-review.ts`,
  `scripts/build-data.ts`
- `.github/ISSUE_TEMPLATE/07-year-in-review.yml`,
  `plugins/north-pole/skills/welcome-year-in-review/SKILL.md`, `tessl.json`

## Tested by

src/northpole/year-in-review.test.ts, scripts/year-in-review.test.ts,
scripts/write-year-in-review.test.ts, scripts/build-data.test.ts,
src/northpole/build-baked.test.ts, src/year-in-review-panel.test.ts,
src/visit-hud-links.test.ts, src/northpole/gallery-pins.test.ts,
src/northpole/level-check.test.ts and smoke/year-in-review.spec.ts.
