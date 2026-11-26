# The Academy

An attraction of the North Pole: it belongs to the map, not to a participant.

It's the landmark for The Academy, the North Pole's own level
([`carnival/levels/the-academy/`](../../levels/the-academy/)). On the home map
it stands as its schoolhouse landmark, and a click on it, or E or Enter beside
it, takes the sleigh into the level rather than into a room. Its own page,
`#/attraction/the-academy`, plays this drawing: a pop quiz.

## What it shows

A cosy classroom at dusk, seen straight on: a plank wall with two arched
windows onto the snowy evening, string lights over a big green chalkboard,
and an owl teacher in gold spectacles and a red scarf standing on a pile of
books. Three answer cards, A, B and C, lie on the wooden floor; the
teacher's desk by the right window holds three apples, and above it hangs a
small gold **Start the Academy** sign.

## How it plays

- **The demo.** While nobody plays, the quiz plays itself on a nine-second
  loop with a question of its own ("Ready for a pop quiz…?"), so it never
  gives a real answer away: the owl says "Pop quiz!" and points at each card
  in turn, the chalk timer runs down, then "Yes, let's go!" is picked and
  cheered. A tap on any card starts a game.
- **A game.** Five questions about building software with AI agents: specs,
  tests, skills, small changes, house rules, steering. Each is chalked onto
  the board against a chalk timer of 12 seconds, a bar that turns gold, then
  red, as it runs down (the owl calls "Hurry!" near the end).
- **A right answer** scores 100 points and up to 100 more for speed, times
  the streak of right answers in a row (×2, ×3, up to ×4). The card glows
  gold, chalk dust bursts from it, the points rise off it with the streak,
  a gold star sticks on it if it was right first time, the board says why
  it's right, and the owl hops and cheers. A tap moves on early.
- **A wrong answer** costs an apple, which rolls off the desk, and ends the
  streak: the card wobbles and greys out, the board chalks a hint, the owl
  tilts its head, and the question stays up to try again.
- **Running out of time** costs an apple too: the board shows the answer.
- **The report card** comes after the fifth question, or as soon as the last
  apple falls: the score counts up, with the best of the visit ("New best!"),
  a grade sticker from A+ to D for the questions right first time, a tick or
  cross for each, and the owl in a mortarboard. Two cards rise on the floor:
  **Play again** (the next five questions) and a gold **Start the Academy**.

## The way out

The drawing can't open anything itself: it runs sandboxed. A tap on the gold
card on the report card, or on the small sign by the window at any time,
makes the attraction's `ask()` return `{ open: 0 }` for that one frame, and
the page opens its first link, **Start the Academy**, in a new tab.

Nobody tapping for 45 seconds puts the demo back on for the next visitor. The
game keeps its score in memory for one visit only, and moves only from
`time`.

## Files

- `attraction.ts`: the square, putting the parts together, and `ask()`.
- `questions.ts`: the questions; `score.ts`: points, streaks and grades.
- `state.ts` and `quiz.ts`: what the game remembers and its rules.
- `layout.ts`: where the cards, the sign and the board are, and what a tap hits.
- `demo.ts`: what to show, the demo included; `teacher.ts`: what the owl does.
- `room.ts`, `board.ts`, `report.ts`, `cards.ts`, `effects.ts`, `owl.ts`,
  `bubble.ts` and `chalk.ts`: the drawing.
