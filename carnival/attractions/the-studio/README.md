# The Recording Studio

An attraction of the North Pole: it belongs to the map, not to a participant.

It's the landmark for The Recording Studio, the North Pole's own level
([`carnival/levels/the-studio/`](../../levels/the-studio/)). On the home map, a
click on it, or E or Enter beside it, takes the sleigh into the level rather
than into a room. Its own page, `#/attraction/the-studio`, plays this drawing
full size, with **Listen to the podcast** and **Watch on YouTube** in its panel.

## What it shows

The inside of the studio at dusk, seen from the front: a padded wall with a
window onto the snowy hills and the northern lights, a red **ON AIR** sign with
the **signal** meter under it, a scoreboard, an elf host in a striped jumper
behind the desk under a warm spotlight, a big studio mic with a pop filter on a
boom arm, two speakers, a desk with faders and a level meter, and a front row
of elves watching, seen from behind.

## The game

Record an episode of the podcast on the beat.

1. **Recording.** A tap anywhere goes ON AIR. Words, drawn as speech bubbles,
   slide along the track towards the gold ring by the mic. Tap as each one
   reaches the ring: right on the beat is **PERFECT!**, a little off is
   **GOOD**, and a word let past is a **MISS**. Gold words are long: tap and
   hold until their tail has slid in. Each word said pops out of the host as a
   speech bubble ("Ship it!", "Spec first!", "Prompt → PR", …), the mic glows,
   the host's mouth opens and the level meter jumps.
2. **Score.** Perfect words score 100 and good ones 50, times the combo: one
   more for every four words in a row, up to four times. A long word earns up
   to 100 more for how much of it was held.
3. **The signal.** Hits strengthen the ON AIR signal; each miss drains it.
   When it runs out the episode is lost ("Signal lost!").
4. **Rising challenge.** The words come closer together as an episode goes on,
   and each episode recorded is quicker than the last. A lost one starts again
   from episode 1.
5. **Playback.** The sign swaps to **PLAYBACK**, the host puts on headphones
   and nods along with eyes shut, the take plays back as a waveform built from
   the words said, with a playhead running over it, sound ripples out of the
   speakers and the crowd nods along. A tap now makes the crowd hop and cheer.
6. **Wrap-up.** A card gives the episode's grade (S, A, B or C, from how many
   words were said and how well), its points and the best of the visit. Its
   two buttons, **Listen to the podcast** and **Watch on YouTube**, open the
   real podcast, and a tap anywhere else records the next episode.

A small **Listen** button in the bottom right corner opens the podcast while
an episode records or plays back. A button only asks the page, through
`ask()`, to open the place's own link of that number; the page decides
(`src/northpole/square-ask.ts`).

With nobody playing, the host records a demo episode perfectly, plays it back
and shows the wrap-up, on a loop, so the studio is alive on the map too.

Nothing flashes: the ON AIR sign glows steadily, every light and card fades in
and out over a few hundred milliseconds, and the bursts on a hit are small.

## The files

- `attraction.ts`: the square, drawing each frame from the game's state, and
  its `ask()`.
- `game.ts`: the game's rules and state; `chart.ts`: each episode's words and
  their timing; `score.ts`: the grade, the playback's waveform and how loud the
  host is; `buttons.ts`: the buttons out and the tap test; `cues.ts`: fades
  and pops.
- `room.ts`, `host.ts`, `lane.ts`, `board.ts`, `wrap.ts`, `crowd.ts` and
  `lettering.ts`: the drawing.
- `attraction.test.ts` and `game.test.ts`: the tests.
