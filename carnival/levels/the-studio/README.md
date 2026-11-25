# The Recording Studio

The North Pole's own level, not a participant's: only maintainers change it
([ADR 0035](../../../docs/adr/0035-north-pole-levels.md)). It's a studio lot
where the podcast is recorded and the videos are made, in the `dusk` theme, 21
tiles each way. Its landmark on the home map is the attraction
[`the-studio`](../../attractions/the-studio/), and it has a platform at the
sleigh station like every level.

Visitors arrive at the foot of the first lane. The path runs up it, across the
top under a banner, and down the second lane to the sleigh home, with a cross
path between the lanes. A band, a juggler, acrobats and a stilt-walker
rehearse on the lot, with a coffee cart, a tent, bunting, lamps and lanterns,
and a ferris wheel and a balloon over the bridge.

Its panels carry **Listen to the podcast** and **Watch on YouTube** buttons,
from the maintainers' list in `src/northpole/north-pole-links.ts`, never from
this folder ([ADR 0038](../../../docs/adr/0038-north-pole-links.md)).

1. **Podcast Booth** (`squares/podcast-booth/`): a desk with two microphones
   and headphones, a red recording light, and a waveform where two voices
   take turns.
2. **Video Set** (`squares/video-set/`): a camera on its tripod with a
   blinking red light, two studio lights, and a big screen with a play button.
3. **Control Room** (`squares/control-room/`): a mixing desk whose sliders move
   up and down, a level meter, and a lit window to the booth.
4. **Green Room** (`squares/green-room/`): a sofa, a lamp, and a cup of coffee
   steaming on a low table.
5. **Broadcast Tower** (`squares/broadcast-tower/`): a lattice mast with a
   blinking light on top, sending waves out.
