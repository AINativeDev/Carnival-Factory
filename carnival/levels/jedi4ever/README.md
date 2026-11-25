# Frozen Lake Fair

The starter level, and the pattern to copy for a level of your own: a small
fair round a frozen lake at dusk, in the `frozen-lake` theme, 21 tiles each way.
Visitors arrive by sleigh at the front, by the sleigh home.

- **The lake** in the middle, with skaters going round it, a big decorated tree
  behind it, and benches and lamps along the paths.
- **A stream** down the east side, with a wooden bridge where the main path
  crosses it, and pines along the edge.
- **A log cabin** and **a striped tent** at the back, a cocoa cart, a parked
  sleigh, a banner over the path and a few snowdrifts.

Its three squares, each on a stall of its own:

- **Skate Rental** (`squares/skate-rental/`): a hut with a rack of skates, and
  two skaters going round the rink in front, a lap every 6 seconds.
- **Cocoa Hut** (`squares/cocoa-hut/`): a warm hut with three cups on the
  counter, steam curling up from each in turn.
- **Ice Fishing** (`squares/ice-fishing/`): a hole in the ice with a line and a
  float that bobs, and every 5 seconds a fish bites.

`level.ts` is plain data, checked by `validateLevel` in `northpole/level.ts`.
