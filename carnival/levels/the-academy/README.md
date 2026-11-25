# The Academy

The North Pole's own level, not a participant's: only maintainers change it
([ADR 0035](../../../docs/adr/0035-north-pole-levels.md)). It's one classroom
inside, with a lesson to discover for each section of the real
[Tessl Academy](https://tessl.io/academy), in its order, in the `gingerbread`
theme, 15 tiles each way ([ADR 0040](../../../docs/adr/0040-indoor-levels.md)).
Its landmark on the home map is the attraction
[`the-academy`](../../attractions/the-academy/), and it has a platform at the
sleigh station like every level.

Visitors arrive at the front of the room. Bookshelves stand under the windows
at the back, beside the blackboard on the upper right wall. The projector
screen and the doors to the sleigh home are in the upper left wall, between
its windows. The pupils' desks are in rows on a carpet, and the teacher's desk
stands by the front, with a globe, a reading rug and plants.

Its panels carry a **Start the Academy** button, from the maintainers' list in
`src/northpole/north-pole-links.ts`, never from this folder
([ADR 0038](../../../docs/adr/0038-north-pole-links.md)).

Each lesson is an item to discover, on a display to walk up to:

1. **Quickstart** (`squares/quickstart/`), by the teacher's desk: a running
   track with a starting line, a little runner who dashes off after a short
   wait, and a stopwatch whose hand goes round.
2. **Skill Foundations** (`squares/skill-foundations/`), before the
   blackboard: building blocks stacking up on a table, one a beat, and a
   skill card that lights up once they're all on.
3. **Tuning Your Agent** (`squares/tuning-your-agent/`), at the projector
   screen: a console of dials turning, and a gauge whose needle wobbles low,
   then climbs into the green.
4. **Code Review Loops** (`squares/code-review-loops/`), among the pupils'
   desks: a magnifying glass going round a loop of pages, ticking each page it
   has read, and clearing the ticks for the next round.
5. **Reference** (`squares/reference/`), by the bookshelves: a bookcase whose
   books slide out one after another to be looked up, and a reading desk
   under a lamp.
