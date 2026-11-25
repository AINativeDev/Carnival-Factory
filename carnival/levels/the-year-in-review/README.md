# The Year in Review

The North Pole's own level, not a participant's: only maintainers change it
([ADR 0035](../../../docs/adr/0035-north-pole-levels.md)). It's a gallery
room inside, 19 tiles each way, in the `dusk` theme
([ADR 0040](../../../docs/adr/0040-indoor-levels.md)), with a question about
the year in AI on each of its displays, and the answers visitors gave
([ADR 0047](../../../docs/adr/0047-year-in-review-answers.md)). Its landmark on
the home map is the attraction
[`the-year-in-review`](../../attractions/the-year-in-review/), a small gallery;
it has no platform at the sleigh station.

Visitors arrive at the front of the room. The **old masters' wing** runs along
the upper left wall, under its sign, LOOKING BACK ON '26: gilded frames with
brass plaques behind a velvet rope, the attractions painted the old way (the
ferris wheel in a swirling night, the big top and a cocoa still life in dark
oils, a crooked expressionist gingerbread house, and a portrait of an elf whose
eyes follow you). The doors to the sleigh home are in that wall. The **modern
wing** runs along the upper right wall, painted white, under LOOKING AHEAD TO
'27 and the neon '26 → '27: thin black frames round the carousel and the studio
as pop art, The Factory's tower as a poster, the ice rink as colour fields, the
schoolhouse as a grid and the coaster as a splatter. Track lights throw a soft
pool on every picture.

In between, on the dance floor under a mirrorball: statues on plinths (a
marble elf in a toga, stacked spheres, a twisted ribbon), a mobile turning
slowly overhead, a bench, WET PAINT and DO NOT TOUCH signs, a guard elf and a
visitor with an audio guide, and balloons and confetti to see the year out.

Its panels carry an **Add your answer** button to the **Year in review** form,
from the maintainers' list in `src/northpole/north-pole-links.ts`, never from
this folder ([ADR 0038](../../../docs/adr/0038-north-pole-links.md)). An
item's panel shows the accepted answers under its question, newest first.

Each question is an item to discover, on a display:

- Looking back on '26, framed in gold on easels: **Dumbest AI moment**
  (`squares/dumbest-ai-moment/`, a robot saying 2+2=5), **Worst coding
  disaster** (`coding-disaster`, a laptop on fire), **When it felt like
  magic** (`felt-like-magic`, a wand and sparkles), **What I stopped doing**
  (`stopped-doing`, a to-do list crossed out), **Vibe code regret**
  (`vibe-code-regret`, headphones over tangled code), **Most overrated**
  (`most-overrated`, a HYPE balloon going down) and **Hands off, AI**
  (`hands-off`, a padlocked heart).
- Looking ahead to '27, in black frames on white plinths: **My day in '27**
  (`my-day-in-27`, a sunrise and a calendar), **Finally fixed**
  (`finally-fixed`, a wrench and a bug), **Worse before better**
  (`worse-before-better`, a chart that dips, then climbs), **Still reviewing
  code?** (`still-reviewing`, a magnifying glass on code), **The buzzword that
  dies** (`buzzword-dies`, a gravestone and a bee) and **Hot take**
  (`hot-take`, a chili pepper).
- **Your questions** (`squares/your-questions/`), the guestbook on the
  reception desk by the front: visitors' own questions, with their answers.

Each item's `description` is its question word for word, as the form asks it
(`YEAR_QUESTIONS` in `src/northpole/year-in-review.ts`, checked by its test).
