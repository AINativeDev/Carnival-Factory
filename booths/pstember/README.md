# North Pole Parcel Depot

Owned by [@pstember](https://github.com/pstember).

A small parcel depot at the edge of the North Pole, at dusk, drawn as a diorama
that repeats every 8 seconds:

- **The gate**: a wooden gate at the front with a "Parcel Depot" sign over it, a
  clipboard on one post and a lantern on the other that glows softly.
- **Santa**: in his red coat beside the gate, holding a parcel in one hand and
  waving twice with the other.
- **The elves**: one picks a parcel off the stack and carries it to the sleigh,
  where the other takes it and stows it. The stack goes down by one, then a new
  parcel drops onto it.
- **The paddock**: a fenced paddock with hoof prints in the snow. One reindeer
  grazes; the other lifts its head to look round and flicks its ears.
- **Snow** falls gently over everything. The parcels are wrapped in violet paper
  with gold ribbon. Nothing flashes.

Everything is drawn from `time`. The timing (`waveAngle`, `stackAt`, `elfWalk`,
`handoffAt`, `headLift`, `earFlick`, `lanternAt`, `flake`) is plain functions in
`booth.ts`, tested in `booth.test.ts`.

Preview it at `#/booth/pstember`.
