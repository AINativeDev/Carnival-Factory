# The Recording Studio

An attraction of the North Pole: it belongs to the map, not to a participant.

It's the landmark for The Recording Studio, the North Pole's own level
([`carnival/levels/the-studio/`](../../levels/the-studio/)). On the home map, a
click on it, or E or Enter beside it, takes the sleigh into the level rather
than into a room. Its own page, `#/attraction/the-studio`, plays this drawing
full size, with **Listen to the podcast** and **Watch on YouTube** in its panel.

## What it shows

The inside of the studio at dusk, seen from the front, laid out like every
Tessl place in three layers:

- **The header**, one slim row: the red **ON AIR** sign (green **PLAYBACK**
  as the take plays back), the **signal** meter, and the score, with the
  episode and the best of the visit over it.
- **The scene**, the lit studio: string lights along a padded wall, a window
  onto the snowy hills where the northern lights drift, a warm key light from
  the upper left on an elf host in a striped jumper, a big studio mic with a
  pop filter, the word track as a screen on the wall with its gold ring by the
  mic, a desk with faders and a level meter, a speaker, and a front row of
  elves watching, seen from behind.
- **The footer**: what to do now, in two short lines, and the one button.

## The game

Record an episode of the podcast on the beat.

1. **Going on air.** While nobody plays, the host records a demo, and the
   footer's gold **Go on air ▶** says how to start: a tap anywhere, Space,
   Enter or → goes on air.
2. **Recording.** Words, drawn as speech bubbles, ease in at the far end of the
   track and slide towards the gold ring by the mic. Tap, or press Space or
   Enter, as each one reaches the ring: right on the beat is **Perfect**, a
   little off is **Good**, and a word let past is a **Miss**; the verdict rises
   over the ring as the ring pops. Gold words are long: tap and hold until
   their tail has slid in. A key can't be held, so a long word started from
   Space or Enter is said in full. Each word said pops out of the host as a
   speech bubble ("Ship it!", "Spec first!", "Prompt → PR", …), the mic glows,
   the host's mouth opens and the level meter jumps.
3. **Score.** Perfect words score 100 and good ones 50, times the combo: one
   more for every four words in a row, up to four times. The combo shows at
   the track's far end from two words in a row, growing gently as it climbs.
   A long word earns up to 100 more for how much of it was held.
4. **The signal.** Hits strengthen the ON AIR signal; each miss drains it.
   When it runs out the episode is lost.
5. **Rising challenge.** The words come closer together as an episode goes on,
   and each episode recorded is quicker than the last. A lost one starts again
   from episode 1.
6. **Playback.** The sign swaps to **PLAYBACK**, the host puts on headphones
   and nods along with eyes shut, the take plays back on the screen as a
   waveform built from the words said, with a playhead running over it, the
   speaker thumps and the crowd nods along. A tap or Space makes the crowd hop
   and cheer.
7. **The end card.** It has the shape every Tessl place shares: an eyebrow,
   the grade as its title (S, A, B or C, from how many words were said and how
   well, or ✕ for a lost one), the points and words said, **Listen to the
   podcast ↗** as the one gold button, then **Watch on YouTube ↗** and **Play
   again ▶** side by side (**Go on air ▶** after the host's demo). A tap
   anywhere else, Space, Enter or → also plays again.

While a visitor's episode records or plays back, the footer has a quiet
**Hear the podcast ↗** link. A link only asks the page, through `ask()`, to
open the place's own link of that number: 0 is the podcast, 1 YouTube
(`src/northpole/square-ask.ts`).

With nobody playing, the host records a demo episode perfectly, plays it back
and shows the end card, on a loop, so the studio is alive on the map too.

Nothing flashes: the ON AIR sign glows steadily, the northern lights in the
window are the scene's one idle motion, every light, word and card eases in
and out over a few hundred milliseconds, and the pops on a hit are small.
Nothing is clipped at the square's edge: everything keeps a margin of 4%, and
no text a visitor reads is smaller than 2.4% of the square.

## The files

- `attraction.ts`: the square, drawing each frame from the game's state, and
  its `ask()`.
- `studio.ts`: the visit's state and how a tap or a key moves it on;
  `game.ts`: the game's rules; `chart.ts`: each episode's words and their
  timing; `score.ts`: the grade, the playback's waveform and how loud the
  host is; `buttons.ts`: the buttons, their links and the tap test; `cues.ts`:
  fades, pops and the primary's breathing.
- `layout.ts`: where everything stands; `lettering.ts`: the type scale and
  lettering.
- `board.ts` (the header), `room.ts`, `desk.ts`, `host.ts`, `lane.ts`,
  `callouts.ts`, `crowd.ts`, `footer.ts` and `wrap.ts` (the playback and the
  end card): the drawing.
- `attraction.test.ts` and `game.test.ts`: the tests.
