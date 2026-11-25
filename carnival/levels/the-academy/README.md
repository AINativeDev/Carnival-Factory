# The Academy

The North Pole's own level, not a participant's: only maintainers change it
([ADR 0035](../../../docs/adr/0035-north-pole-levels.md)). It's a snowy campus
with one lesson stall for each section of the real
[Tessl Academy](https://tessl.io/academy), in its order, in the `frozen-lake`
theme, 21 tiles each way. Its landmark on the home map is the attraction
[`the-academy`](../../attractions/the-academy/), and it has a platform at the
sleigh station like every level.

Visitors arrive at the foot of the first lane. The path runs up it, across the
top under a banner, and down the second lane to the sleigh home. A frozen lake
with skaters fills the quad, with the big tree, benches, the school band, a
cabin, lamps and lanterns about it, and a tent and a balloon over the bridge.

Its panels carry a **Start the Academy** button, from the maintainers' list in
`src/northpole/north-pole-links.ts`, never from this folder
([ADR 0038](../../../docs/adr/0038-north-pole-links.md)).

1. **Quickstart** (`squares/quickstart/`): a running track with a starting
   line, a little runner who dashes off after a short wait, and a stopwatch
   whose hand goes round.
2. **Skill Foundations** (`squares/skill-foundations/`): building blocks
   stacking up on a table, one a beat, and a skill card that lights up once
   they're all on.
3. **Tuning Your Agent** (`squares/tuning-your-agent/`): a console of dials
   turning, and a gauge whose needle wobbles low, then climbs into the green.
4. **Code Review Loops** (`squares/code-review-loops/`): a magnifying glass
   going round a loop of pages, ticking each page it has read, and clearing
   the ticks for the next round.
5. **Reference** (`squares/reference/`): a bookcase whose books slide out one
   after another to be looked up, and a reading desk under a lamp.
