# 0041. A ride level is ridden in the coaster's car, station to station

- Status: Accepted
- Date: 2026-11-25
- Spec: [levels.md](../specs/levels.md)

## Context

The maintainer said The Factory should not just have a roller coaster in
the middle: the whole level should be a roller coaster. Until now every level
was walked, with a coaster ([ADR 0039](0039-coaster-ridden-in-list-order.md))
as scenery beside the path that a golden ticket rode on its own. A level is
plain data ([ADR 0035](0035-north-pole-levels.md)), so a ride has to come
from the data, and the map's walking, its pins and every other level must
stay as they are.

## Decision

A level may say `ride: true`. Its visitors don't walk: they sit in the golden
ticket car, and the camera follows the car round the track.

- The track is a circuit that starts with a `coaster-station` on the arrival
  tile, with a station at every square's and every exit's door, and the car
  stops at each station in the order the track reaches it. `validateLevel`
  checks all of that instead of walking the level.
- At a station the stall's call to action shows, and E, Enter, the call to
  action or a click opens it as in any level. Space, →, D, a click or tap on
  the ground, or a "Ride on" button rides on. The walking keys do nothing.
- After the last station the car comes round to the first, the boarding
  station by the sleigh home, where E takes the sleigh back to the North Pole
  and "Start the ride" rides again. A circuit needs no second platform at the
  end and no jump back to the start, and the end of the ride is where the way
  home already is.
- The car runs at the track's own pace: 0.4 seconds a flat tile, 0.9 up a
  lift hill, 0.22 down a drop and 1.8 round a loop. It never runs on by
  itself, so a visitor reads each stall at their own speed. For reduced
  motion it goes straight to the next station, with the camera.
- New pieces: `coaster-lift`, `coaster-drop` and `coaster-station`, and a
  piece's `variant` lifts its rail from as high as before at 0 to four times
  as high at 1, so a level's existing coaster, at variant 0, is unchanged.
  Track stands on posts, so it may cross water.
- The ride is plain functions over plain values (`src/northpole/ride.ts`),
  hooked into the map's frame and input in `src/northpole/ride-map.ts` only
  where a ride level has a ride, so a walked level never reaches it and its
  pins stay the same.

## Alternatives considered

- **The car runs on by itself, with a pause at each station.** Turned down:
  a visitor reading a stall's panel, or on a slow phone, would be carried
  past it, and the tour is the point of The Factory.
- **The ride ends at a separate platform by the sleigh home.** Turned down:
  the car would have to jump back to the start to ride again, and a track
  that runs round says the same with less.
- **Walk between stations, and ride the coaster as a stall of its own.**
  Turned down: the maintainer asked for the whole level to be the ride.
- **A ride route of waypoints, apart from the props.** Turned down for the
  reasons in ADR 0039: the props are already the track, in order.
- **Banking the track on its corners.** Left for later: the car tips with
  the track round loops and up and down hills, and a banked corner needs its
  own drawing of the rail.

## Consequences

A ride level is ridden only: nothing in it is walked to, so its stations
must stand at every door. The map keeps one more piece of state, the ride,
and a button over the canvas. A walked level, and the North Pole, behave and
draw exactly as before.
