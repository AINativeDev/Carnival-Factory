# Spinning Top Workshop

Owned by [@sjmaple](https://github.com/sjmaple).

A chunky pixel-art workshop under the dusk light, on a loop that repeats every
12 seconds. Visitors can't build tops themselves, because booths can't react to
clicks or keys, so an elf does it for them:

- **Building**: at the workbench the elf hammers a top together piece by piece:
  the body first, then its coloured stripes, then the handle.
- **Carrying**: the finished top hops across to the test mat.
- **Testing**: on the mat the top spins, its stripes sliding round the body,
  and slowly loses speed. As it slows it starts to lean and wobble, then tips
  over and lies on its side on the mat until the next round.
- **Cosy details**: a shelf of finished striped tops behind the bench, a lamp
  on the bench and a few slowly twinkling stars.

Everything is drawn from `time` on a 64 by 64 board of pixels. The timing of the
round, the carry, the spin and the tip-over (`momentAt`, `builtParts`,
`carryTip`, `spinAngle`, `spinSpeed`, `wobble`, `restPose`) are plain functions in `booth.ts`, tested in `booth.test.ts`.

Preview it at `#/booth/sjmaple`.
