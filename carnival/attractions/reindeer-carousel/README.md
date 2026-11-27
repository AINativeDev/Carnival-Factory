# Reindeer Carousel

An attraction of the North Pole: it belongs to the map, not to a participant.

A little diorama at dusk, in the [diorama style](../../../docs/style.md): a
carousel on a round platform on a slab of snow, under a red and white
candy-cane canopy with a gold trim, a string of lantern lights and a gold ball
on top. Six reindeer with gold antlers and red noses go round it on gold poles,
rising and falling as they turn, and the canopy turns with them. The ones at
the back pass behind the gold centre column, fainter, facing the other way. A
soft glow chases round the lantern lights as it turns. By the carousel's front
left stands the ring arm: a candy-striped post on the snow with a brass arm
reaching in, a lamp on the arm and a ring hanging from its tip.

## Ring Grab

The classic brass-ring game. One reindeer is yours: an elf in green with a red
hat rides it, with a soft mint pool under it and a little mint arrow bobbing
over the elf.

1. **Ride.** Tap anywhere to start. The carousel gathers speed and your
   reindeer comes round past the ring arm once a turn.
2. **Grab.** Tap as your reindeer passes the arm. The arm's lamp warms as your
   reindeer comes near, and while a tap can reach the ring the lamp turns mint
   and a mint circle rings the ring: that's the timing window. A tap in it
   grabs the ring: the elf reaches back for it, "+1" pops up and the ring flies
   up into your tally. A silver ring is worth 1; about one ring in six is gold,
   glowing warm, and worth 5 ("+5 GOLD!").
3. **Faster.** Every ring caught speeds the carousel up a little, so the next
   window comes sooner and passes quicker, up to four times its own pace.
4. **Misses.** A tap with no ring in reach (too early, too late, or again once
   the ring is taken) is a miss: "Miss!" pops up and one of the three miss
   marks by your best score is crossed out. The third miss ends the ride.
5. **Ride over.** The carousel eases back to its own pace and a card gives the
   rings you caught, the best of the visit (or "A new best this visit!") and,
   after a moment so a late tap doesn't skip it, **Tap to ride again**.

After each pass the arm's next ring slides out from the post; a ring left on
the arm fades away first. The scoreboard shows your rings in the top left and
your best and misses in the top right. The best of the visit stays while the
square is open and is never saved. A ride left alone for 20 seconds goes back
to the demo.

With nobody playing, the carousel turns at its own gentle pace, once every
nine seconds, and the elf grabs every ring itself, so it's alive on the map
too, under a banner that says how to play.

Nothing flashes: the lamp and the window's circle warm up and fade over a
fraction of a turn, the lantern lights only ever swell softly, at most under
twice a second even at the fastest, and every card fades in.

## The code

- `attraction.ts`: the square, the scene and the ride it keeps for the visit.
- `grab.ts`: Ring Grab's rules: the window, grabbing, gold rings, misses, the
  speed-up and the demo.
- `ride.ts`: the carousel turning towards the pace it's asked for, where each
  reindeer is, and the chasing lights.
- `arm.ts`: the ring arm, its lamp and the rings; `figures.ts`: the reindeer,
  the elf reaching for the ring, and the marker on yours.
- `hud.ts` and `lettering.ts`: the banner, the scoreboard, the pop-ups and the
  card.

Preview it at `#/attraction/reindeer-carousel`.
