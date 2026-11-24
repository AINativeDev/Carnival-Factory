# Penguin Slide

Owned by [@hamzaoza](https://github.com/hamzaoza).

A first-person run down an ice mountain, in soft storybook shapes and warm dusk
light. You look down the slope from just behind an original little penguin lying
on its belly on a red sled. A booth can't take keys or clicks, so the penguin
steers itself, as a loop that repeats every 24 seconds:

- **The slope** rushes towards you in soft bands of light and shade, between
  snow-capped pines, with a low warm sun and far mountains.
- **Weaving**: the penguin swings left and right and the sled leans into each
  turn, gliding round the grey rocks and snowdrifts at the sides of its path.
- **Snowflakes**: glowing snowflakes float on its path. Each one it passes adds
  10 points to the score in the corner.
- **Looping**: after the last snowflake the run starts again from the top and
  the score goes back to 0.

Everything is drawn from `time`. The course and the score (`pathAt`, `thingAt`,
`scoreAt`, `inView`, `project`) are plain functions in `booth.ts`, tested in
`booth.test.ts`.

Preview it at `#/booth/hamzaoza`.
