# The Recording Studio

The North Pole's own level, not a participant's: only maintainers change it
([ADR 0035](../../../docs/adr/0035-north-pole-levels.md)). It's one studio
room inside, where the podcast is recorded and the videos are made, in the
`dusk` theme, 15 tiles each way ([ADR 0040](../../../docs/adr/0040-indoor-levels.md)).
Its landmark on the home map is the attraction
[`the-studio`](../../attractions/the-studio/), and it has a platform at the
sleigh station like every level.

Visitors arrive at the front of the room. The sound booth's corner, at the
back, is carpeted and lined with foam panels on both walls. The mixing desk
stands out in the room, facing the window to the booth. The video set, down
the left wall, has a backdrop and two spotlights. The guests' sofa is on a carpet by the front,
with plants about, cables run across the floor, and the ON AIR light glows by
the doors to the sleigh home, in the right wall.

Its panels carry **Listen to the podcast** and **Watch on YouTube** buttons,
from the maintainers' list in `src/northpole/north-pole-links.ts`, never from
this folder ([ADR 0038](../../../docs/adr/0038-north-pole-links.md)).

Each piece of gear is an item to discover, on a display to walk up to:

1. **Microphone** (`squares/microphone/`): a studio microphone on a boom arm
   over the desk, with a pop filter, a red recording light and a waveform
   where two voices take turns.
2. **Headphones** (`squares/headphones/`): a pair on a stand, their cable
   curling away, with notes rising out of them.
3. **Mixing desk** (`squares/mixing-desk/`): sliders that move up and down, a
   level meter, and a lit window to the booth.
4. **Camera** (`squares/camera/`): on its tripod with a blinking red light,
   between two studio lights, before a screen with a play button.
5. **ON AIR light** (`squares/on-air/`): the red sign over the studio door,
   swelling and fading slowly while a show is recorded.
6. **Guest sofa** (`squares/guest-sofa/`): a sofa, a lamp, and a cup of
   coffee steaming on a low table.
7. **Episode wall** (`squares/episode-wall/`): a wall of episode cards, each
   with a play button, and a light moving from one to the next.
