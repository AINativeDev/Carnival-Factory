# Hot Cocoa Stand

An attraction of the North Pole: it belongs to the map, not to a participant.

Inside the Hot Cocoa Stand plays **Cocoa Rush**, a serving game in the
[diorama style](../../../docs/style.md): a wooden stand on a slab of snow, its
planked front facing the lower left, with a red and yellow scalloped awning, a
gold sign of three cocoa drops on its snowy roof and a lantern glowing in the
serving hatch. Elves in coloured coats queue at the counter, and along the
counter's front are five big buttons: **Cocoa**, **Marshmallow**, **Cream**,
**Cinnamon** and **Candy cane**.

## How to play

1. **Open the stand.** With nobody playing, the stand's own elf serves the
   queue, a mitten tapping each button in turn, and the top says **Tap to open
   the stand!** A tap anywhere starts your shift.
2. **Read the order.** The elf at the hatch has an order bubble: cocoa first,
   then their toppings in the order they want them. The next thing to add is
   ringed in gold, and their patience runs down along the bubble's foot, from
   mint to gold to red. They look worried when it's nearly gone.
3. **Build the cup.** Tap the buttons in the order asked for. Cocoa pours into
   the cup on the counter, each topping drops in on top, and its place in the
   bubble gets a tick.
4. **Serve.** The last topping serves the cup: the elf walks off smiling with
   their mug, says **Thanks!** and leaves a tip, more for a bigger order and
   more the sooner it was served. The next elf steps up.
5. **Spills.** A wrong button spills the cup: it tips over in a puddle,
   **Oops!**, the customer frowns and loses some patience, and you start their
   cup again once it's wiped up.
6. **Walk-offs.** A customer whose patience runs out walks off with a cross
   **Hmph!**, and one of the three mugs at the top is crossed out. The third
   walk-off ends the shift.
7. **Rising challenge.** Orders grow from one topping to all four, the queue
   gets longer, and each customer has less patience than the last.
8. **Shift over.** A card gives your tips, the cups served and the best tips
   of the visit, and after a moment **Tap to open again** starts a new shift.
   Left alone for a while, the stand's own elf takes over again.

The boards along the top show your tips, the walk-offs left and the best of
the visit, kept in memory only for this visit. Every fade is gentle and every
burst small, so nothing flashes.

## The files

- `attraction.ts`: the square, drawing each frame from the shift's state.
- `rush.ts`: the shift's rules and state (customers, presses, spills, tips,
  walk-offs and the stand's own show); `orders.ts`: each customer's order,
  patience and tip; `buttons.ts`: the buttons and which one a tap lands on.
- `stand.ts`, `cup.ts`, `elves.ts`, `bubble.ts`, `panel.ts`, `hud.ts`,
  `icons.ts` and `lettering.ts`: the drawing.
- `rush.test.ts` and `attraction.test.ts`: the tests, with `drawing-log.ts`
  standing in for the canvas.

Preview it at `#/attraction/cocoa-stand`.
