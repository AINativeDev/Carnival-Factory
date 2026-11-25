# Frozen Falls Waffles

Owned by [@chandler767](https://github.com/chandler767).

A frozen waterfall at dusk, with a little hut at its foot where someone sells
Belgian waffles. Drawn as a diorama in the North Pole's own style.

- **The falls**: a tall rock cliff with a sheet of ice down its lit face,
  frosted ribbons, icicles along the lip and a frozen pool at the bottom. A soft
  gleam slides slowly down the ice every 6 seconds.
- **The waffle hut**: a wooden hut with a snowy roof, a striped awning and a lit
  serving hatch. A seller in a cream hat stands inside, with a waffle on the
  counter and steam rising from the iron.
- **Details**: smoke from the chimney, string lights along the roof that shimmer
  slowly, and a few snowy pines.

Nothing flashes: the hatch light, the lights and the steam all move gently.

## The code

- `booth.ts`: the booth itself, laying out the scene and the pines.
- `falls.ts`: the cliff, the frozen falls and the pool.
- `waffle-hut.ts`: the hut, its seller, the waffle, the steam and the smoke.
- `quad.ts`: the flat patches the ledges, ribbons and awning are drawn with.
- `motion.ts`: `rise` and `gleam`, the plain functions behind the steam and
  the gleam, tested in `booth.test.ts`.
