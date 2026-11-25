# Spinning Top Workshop

Owned by [@sjmaple](https://github.com/sjmaple).

A chunky pixel-art workshop under the dusk light, where visitors build their
own spinning top and test it. Go inside the booth to play:

- **Build**: the parts board has three buttons. Click or tap one to try the
  next choice, and the elf hammers it onto the top on the workbench:
  - **Body**: round, wide or tall.
  - **Stripes**: berry, violet, mint or ice.
  - **Handle**: knob, short or long.
- **Test**: press **SPIN IT!** and the top hops onto the test mat and spins,
  its stripes sliding round the body, slowing as it goes. The test board counts
  how long it spins, and once it wobbles to a stop and tips over it says how it
  behaved: STEADY, WOBBLY or WILD, with your best spin this visit. Then the top
  goes back on the bench for the next try. The buttons wait while a top is out.
- **What makes a good top**: a wide body spins longest and steadiest, a tall
  one is quick to fall and wobbles. A long handle adds spin but wobble too, a
  short one is steadiest. The stripes are for looks. Each spin varies a little
  with the moment you let it go.
- **When nobody plays**: after 30 seconds without a press, and on the map, the
  elf builds and tests a different top every 16 seconds. Tap a part to take
  over from the elf's top.

The pixels are drawn from `time` on a 64 by 64 board. The code is split by
what it is in the workshop:

- `booth.ts`: the square itself, the booth's one memory of the visit, and the
  top on the bench and the mat.
- `parts.ts`: the bodies, stripes and handles to pick from.
- `test-mat.ts`: how a top does on the mat (`testOf`, `rating`, `stageAt`,
  `spinAngle`, `wobble`, `carryTip`, `restPose`).
- `workshop.ts`: the buttons' effect and the elf's own rounds (`press`,
  `settle`, `idle`, `demoAt`).
- `board.ts`: the pixel board and where its buttons are (`buttonAt`).
- `control-panel.ts`: the parts board, the spin button and what the test board
  says (`testBoardLines`).
- `tops.ts` and `scene.ts`: drawing the tops, and the sky, bench, mat, elf and
  sign.

The plain functions are tested in the `.test.ts` file beside each one. The
booth remembers only what has been built and tested this visit.

Preview it at `#/booth/sjmaple`.
