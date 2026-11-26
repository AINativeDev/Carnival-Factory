# North Pole Night Run

Owned by [@jedi4ever](https://github.com/jedi4ever).

A driving game: a little red delivery van with a roof rack of parcels races
down a snowy town street at dusk, seen from a chase camera just behind and
above it.

- **The street**: the road rushes towards you in perspective and curves gently
  left and right, with lane dashes, snowbanks along the kerbs, lamps that sweep
  past and pool warm light on the snow, and shops on both sides with lit windows
  and wreathed doors. Far ahead are snowy rooftops under a dusk sky with stars.
- **The look**: noir. The street is in black and white, with the little red
  van the one thing in colour. It's chiaroscuro too: the street falls into
  darkness all round, and the van's headlights throw one pale beam up the
  road ahead, so the van and what it's about to meet are the brightest things
  in the picture. The snow
  and the dashboard stay bright on top.
- **Snow**: it falls and streaks past the camera faster as you speed up.
- **Driving**: steer with the pointer and the van follows it across the road. On
  touch, a tap on the left or right half steers that way. Speed builds slowly
  through a run, and a hard turn makes the van lean and slide its tail out,
  leaving tyre trails in the snow before it straightens.
- **The game**: weave through oncoming horse-drawn sleighs, an orange snowplough,
  other vans and a little bus. Glowing parcels are worth 10 points each, with a
  burst of sparkles as one lands. A crash is a soft spin-out in a puff of snow;
  a tap starts a new run. The dashboard shows the score, the speed and the best
  run of this visit.
- **On the map**: when nobody is steering the van drives itself along a clear
  line through the traffic, and starts a new run after a crash.
- **The stall**: a food truck with a red roof and gold trim.

Everything is drawn from the run's state and `time`. The booth remembers only
the run in progress, who is steering and the best score, for one visit.

- `booth.ts` puts the scene together back to front, handles the pointer
  (`steerWith`) and plays the time since the last frame in small steps
  (`frameSteps`).
- `game.ts` is the rules: `advance`, `speedAt`, `newRun` and `restart`, and
  `autopilot.ts` the `autopilotTarget`, tested in `game.test.ts`.
- `view.ts` is the chase camera (`project`, `bend`); `sky.ts`, `street.ts`,
  `snow.ts` and `vehicles.ts` draw the scene, `lighting.ts` its light and shadow;
  `dashboard.ts` the dials.
