# Santa's Big Top

An attraction of the North Pole: it belongs to the map, not to a participant.

Inside Santa's Big Top plays **Juggling Elf**, a juggling game in the
[diorama style](../../../docs/style.md): a circus ring with a red and white
striped curb and warm sawdust inside, on a slab of snow, under the tent's
striped walls with lantern lights along their tops. A spotlight shines down on
the juggling elf in the middle of the ring, a ringside elf waits at the
ringside, and a front row of elves in bobble hats watches from behind.

## How to play

1. **Start.** With nobody playing, the elf juggles three baubles on its own
   and a line says **Tap to juggle!** A tap anywhere starts your act with two
   baubles, thrown up one after the other.
2. **Catch.** Each bauble arcs over the elf from one hand to the other. Once
   it's past the top of its arc and falling, a warm ring appears round it:
   tap the bauble then to toss it back up. The ring turns berry red once it
   has fallen past the hands, as a last chance. Each catch throws gold sparks,
   shows the points it won, and the elf flicks that hand up.
3. **Score.** Each catch scores 1 point, times the streak: one more for every
   five catches in a row, up to five times (**STREAK ×2** and so on, on the
   scoreboard). A tap that catches nothing puffs **Miss** and breaks the
   streak.
4. **Rising challenge.** Every five catches the ringside elf throws in another
   bauble (**Another bauble!**), up to five in the air at once, and every catch
   makes the arcs a little quicker.
5. **The drop.** A bauble that falls to the sawdust ends the act. The elf
   gasps, the baubles fall, and the crowd reacts: they clap and cheer
   **Hooray!** for a new best of the visit or ten catches or more, and throw up
   their hands with an **Oh!** otherwise.
6. **Again.** A card gives the catches, the score and the best of the visit,
   and after a moment **Tap to go again** starts a new act. Left alone for a
   while, the elf goes back to juggling on its own.

The scoreboard along the top shows your catches, your score and streak, and
the best of the visit, kept in memory only for this visit. The cheering and
the card fade in, and the sparks and words are small, so nothing flashes.

## The files

- `attraction.ts`: the square, drawing each frame from the act's state.
- `act.ts`: the act's rules and state (catching, scoring, the streak, new
  baubles, the drop and the elf's own show); `throws.ts`: each bauble's arc.
- `tent.ts`, `juggler.ts`, `crowd.ts`, `board.ts` and `lettering.ts`: the
  drawing.
- `act.test.ts` and `attraction.test.ts`: the tests, with `drawing-log.ts`
  standing in for the canvas.

Preview it at `#/attraction/big-top`.
