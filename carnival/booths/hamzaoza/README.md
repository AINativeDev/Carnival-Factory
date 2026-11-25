# Penguin Slide

Owned by [@hamzaoza](https://github.com/hamzaoza).

A sledging game down an ice mountain, in soft storybook shapes and warm dusk
light. You look down the slope from just behind an original little penguin lying
on its belly on a red sled.

- **Steering**: the penguin follows the pointer's place left and right across
  the drawing. On touch, each tap on the left or right half steers that way,
  and taps add up: a tap's steering holds for a few seconds after the finger
  lifts.
- **The slope** rushes towards you in soft bands of light and shade, between
  snow-capped pines, with a low warm sun and far mountains. It starts gently
  and speeds up slowly through a run.
- **Rocks and snowdrifts** come up the slope. Hitting one ends the run with a
  soft tumble and a puff of snow, and a tap starts a new run on a new course.
- **Snowflakes**: each glowing snowflake the penguin scoops up adds 10 points.
  The score and the best run of this visit show in the corner. The best lasts
  only for the visit; nothing is stored.
- **On its own**: when nobody is steering, as on the map, the penguin weaves
  along the course's clear line by itself, and starts again after a while.

The rules are plain functions, split by what they are in the scene:

- `course.ts`: the seeded course (`thingAt`, `thingsBetween`, `pathAt`).
- `sledding.ts`: speed (`distanceFor`, `speedFor`) and steering (`laneOf`,
  `toward`, and `laneAt` for where the penguin is as it passes each thing).
- `game.ts`: the game's rules, collisions and scoring (`advance`, `newRun`,
  `newGame`).
- `view.ts`: the view (`scaleAt`, `project`, `inView`).

`scenery.ts` draws the sky and the slope, `characters.ts` the snowflakes,
rocks, drifts and the penguin, `hud.ts` the score, and `booth.ts` puts them
together. `course.test.ts`, `steering.test.ts`, `game.test.ts` and
`view.test.ts` test the rules, playing frames through `test-runs.ts`.

Preview it at `#/booth/hamzaoza`.
