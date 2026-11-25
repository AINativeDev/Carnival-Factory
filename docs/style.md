# The diorama style

The North Pole is a lit snow island at dusk: solid isometric volumes, a muted
palette and warm pools of light. Every square on it, booth or attraction, is
drawn as a small diorama of the same world, so it sits on its stall instead of
looking pasted on. This is the default look. Ask for another style in the
**Your booth** form, such as pixel art or papercut, and the factory adapts it to
the dusk light and the palette below.

The attractions in `carnival/attractions/` are all drawn this way, and are the examples
to copy.

## The rules

- **Perspective.** Draw the scene as a small isometric diorama in its square,
  seen from the same angle as the world: a slab of snowy ground with height,
  and on it things with tops, sides and soft shadows. Tiles run two across for
  one down.
- **Light.** Dusk, with the light from the upper left. Lit sides face left and
  shaded sides face right, the snow is warmest at the back left, and shadows
  are cool and fall to the lower right. Lamps, windows and fires throw warm
  glows.
- **Palette.** The muted dusk colours the world uses, from `theme` only, never
  a hex colour of your own: `dusk`, `duskLow`, `horizon`, `mountain` and
  `night` for the sky and hills, `snow`, `snowLit`, `snowShade`, `slab` and
  `slabShade` for the ground, `shadow` for shadows, and `lantern` and `glow`
  for warm light. Bright accents such as `berry`, `gold`, `mint` and `violet`
  are kept small: stripes, trims, baubles, a scarf.
- **Shapes.** Simple geometric volumes with a little texture: stripes, planks,
  snow caps, string lights. No outlines heavier than the world's: it draws its
  volumes as filled faces, not outlined ones.
- **Motion.** Gentle loops from `time`, a few seconds long. Nothing flashes:
  lights shimmer or chase slowly, a bright accent never blinks across the whole
  square. The smoke test's flashing check is only a floor: it fails a square
  when more than a quarter of it swings in brightness more than three times a
  second, so a small accent that blinks can still pass it and still break this
  rule.
- **Game state.** A booth people play keeps its score and its round in
  memory for one visit, never in storage, and still draws its motion from
  `time`.
- **Readability.** One clear focal point that reads at the map's size, a few
  dozen pixels across on a stall's front, and still holds up at full size on
  the visit card. Keep the details round it small.

## Helpers

`northpole/diorama.ts` draws the shared parts, so a square only draws its own
scene. Import it as `../../../northpole/diorama`, like the theme.

- `scene(ctx, size, time, paint)` scales the context to the square's 0 to 100
  units, paints the dusk sky, the far mountains and the slab of snow, then
  calls `paint` to draw the rest in those units.
- `iso(gx, gy, z)` is where a spot on the slab is on screen, `z` above it. The
  slab runs from -22 to 22 each way.
- `box`, `drum` and `cone` draw lit and shaded volumes: walls, stalls,
  platforms, tents and roofs, striped if you like.
- `shadow`, `glow`, `stringLights` and `pine` add a cool shadow, a warm pool of
  light, a string of slowly shimmering bulbs and a snowy pine.
