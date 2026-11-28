# The Factory

An attraction of the North Pole: it belongs to the map, not to a participant.

It's the landmark for The Factory, the North Pole's own level
([`carnival/levels/the-factory/`](../../levels/the-factory/)). On the home map
it stands as a tall tower with **TESSL** down its front. Its own page,
`#/attraction/the-factory`, explains what a software factory is and why, lets
you play one, then shows you the ways on. It's drawn in the
[diorama style](../../../docs/style.md), in three parts.

## 1. The tour

Four steps, each one lit scene on the slab under a slim header: an eyebrow
(**HOW A FACTORY WORKS · 2 OF 4**), a title and two short lines. Along the foot
are the step's dots and how to go on, and one gold button, **Next ▶**; a quiet
**Skip to the game ▶** sits top right. A tap anywhere goes on a step. Every
fact comes from this repository's own factory:
[how your request is built](../../../docs/how-it-works.md), the loops in
`tessl.json` and the skills in `plugins/north-pole/skills/`.

1. **Why a factory?** "One agent alone writes more than you can read. A
   factory splits work into small, checked steps." On the left, one agent under
   a desk lamp piles up pages faster than the person beside it can read them; on
   the right, a small workshop sends parcels down a belt, through two gate
   lamps that light mint once each parcel is through, to a stack of gifts.
2. **Skills.** "A skill is know-how written down for an agent. This factory
   has its own. Four of them:" Four gems on plinths round the agent, which
   follows each in turn, a beam running from the gem to it. The caption below
   names the skill it follows and what it does: `assess-booth-request`,
   `review-house-rules`, `assess-booth-risk` and `review-craft`.
3. **Loops.** "A loop wakes when something happens, runs an agent with a
   skill, and checks the result." One loop at a time: what woke it rises out
   of the inbox (an issue's page, the tessl label, a review comment), rides
   the belt into the loop's workshop, where the agent works, and comes out
   through a gate that lights mint, with a tick. The caption names its
   **WHEN**, its **LOOP** and skill, and its **RESULT**, each lit as the parcel
   reaches it: an issue is opened, the Assessment accepts, asks or declines;
   the tessl label is added, Implement opens a pull request; a review comment
   is left, the Shepherd fixes what it asks for.
4. **The factory.** "Loops chained together, with gates between them. People
   steer it by writing the skills and specs." A warm-lit hall with a smoking
   chimney at the back, and in front of it one belt through five workshops,
   ASSESS, BUILD, CHECKS, REVIEW and MERGE, with a gate lamp between each pair
   that lights mint as the parcel passes. Agents work the line, and a person
   at the front writes on a scroll. The gold button here is **Feed the loop ▶**,
   into the game.

## 2. Feed the Loop

The TESSL tower at the back, and in front of it the build loop, a round belt
with four arches over it, **REQUEST**, **BUILD**, **REVIEW** and **MERGE**,
round a hopper with four skill gems circling it. A sleigh waits at the slab's
left corner. The first tap starts a round.

- A parcel rides the belt from station to station, built up as it goes: a blank
  slip, a written request, a crate rising as it's built, then a wrapped booth.
- A bubble over the station ahead says which skill it **needs**, SPECS, TESTS,
  REVIEW or DOCS, with a bar running down as the parcel nears it.
- Tap that skill's card, down the left, before the parcel gets there: it scores
  10 to 20 points, more for a quick answer, times the level.
- The wrong card, or none in time, **jams** the belt: it stops for a moment in
  a puff of smoke, and costs one of three hearts.
- A booth through merge flies into the sleigh for 25 points times the level, and
  lights the next letter of TESSL. With all five lit, the tower glows and gifts
  tumble off its top. Every third booth is a new level, and the loop speeds up.
- The third jam ends the round, and a moment later the end card comes up.

Over the game there's only what it needs: the cards with one line on what to
do, the score, best and hearts (before a round, how to play), and one quiet
**Sign up for Tessl ↗** link under them.

## 3. The end card

**Loop complete**, and one line with the round's points, booths shipped and
best of the visit. Then the one big choice, **Ask for a booth ↗** ("The factory
builds it for you"), and side by side **Learn how in the Academy →** and **Sign
up for Tessl ↗**. Under them, quietly, **Play again ▶** and **Watch the tour ▶**,
and last a line to keep in touch: **AI DevCon ↗**, **Blog ↗** and **Podcast ↗**.
Its buttons wake a moment after it comes up, so a last tap at the game opens
nothing.

## How it looks

Every Tessl place shares one design language. Panels are soft night fills with
a shadow and no outline; there's one gold primary per screen, breathing a slow
glow; secondaries are snow with night words, and the rest is underlined text,
gold for a link out. Type keeps to one scale (a title, a lead line, body text
and spaced-out capital labels, nothing smaller), new text eases in and new
things in a scene pop up with a little overshoot. Nothing flashes.

## Links and visits

The drawing never opens anything itself. A tap on a link's button asks the
page, through the square's `ask()`, for one of the Factory's links out, by its
number on the panel: 0 Sign up for Tessl, 1 Ask for a booth, 2 AI DevCon
tickets, 3 the Tessl blog, 4 the podcast. Learn how in the Academy asks for a
visit to `the-academy` instead. Each ask is answered once, on the frame after
the tap.

## With nobody touching it

Nothing moves on by itself: the tour waits on its first step, its scene
gently moving, with "Tap or → to start", and each step waits for a tap, or for
→, Enter or Space; ← goes back a step. A visitor reads at their
own pace. After a minute with no tap it goes back
to the first step for the next visitor. The score and the best last for the
visit only, never in storage.

## Files

- `attraction.ts`: the square, drawing the part of the show it's in, and `ask()`.
- `show.ts`: the tour, game and end card, and how taps and time move between them.
- `buttons.ts`: every button, where it is and what a tap on it chooses.
- `tour-copy.ts`: the tour's words, the skills, the loops and the chain.
- `tour.ts`: the tour's header, footer and buttons round each scene.
- `tour-scenes.ts`, `tour-loops.ts`, `tour-factory.ts`: its four scenes.
- `props.ts`, `works.ts`: the people, agent, ticks and signs, and the belts,
  gate lamps, workshops and smoke the scenes are built from.
- `end-card.ts`: the end card.
- `game.ts`: the game's rules and state, moved on each frame by `advance`.
- `rules.ts`: the skills, the cards and where taps land on them, the stations,
  and the floating words.
- `track.ts`, `stations.ts`, `tower.ts`: the belt and parcel, the arches and
  the need bubble, the tower.
- `hud.ts`, `effects.ts`, `text.ts`, `ui.ts`: the cards, the scoreboard and its
  sign-up link; the sparkles, points, jams and the sleigh; lettering, labels and
  small shapes; panels, buttons and how things ease and pop in.
