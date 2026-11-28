import type { NorthPoleSquare } from '../../../src/northpole/square';
import { footer } from './footer';
import { header } from './header';
import { advance } from './journey';
import type { SquareAsk } from './nudges';
import { stage } from './stage';
import { newVisit, type Visit } from './state';

/** The visit, the one state the drawing keeps. */
let visit: Visit | undefined;
/** What a tap asked of the page since `ask` last answered, if anything. */
let asked: SquareAsk | undefined;

/**
 * The Academy: how the North Pole turns a ticket into a booth, played
 * hands-on in a workshop hall at dusk, one lit bay a station. The visitor is
 * the ticket: they write it (a silly booth and a look), then tap it, or
 * press →, Enter or Space, through the factory's stations, the
 * assessment's stamp, the implement loop's flying parts, squashing the bugs
 * at the checks, code review and the shepherd, the seven lamps of the
 * auto-merge gate, until the booth springs up on the map; then one card
 * shows the same loop on any repository. Nothing moves on by itself: every
 * beat waits for a tap or a key, and ← goes back. Nudges ask the page to
 * open the real Academy, the booth form, AI DevCon, the blog or the
 * podcast, or to visit the Factory. On the map it stands as its schoolhouse
 * landmark.
 */
const theAcademy: NorthPoleSquare = {
  id: 'the-academy',
  name: 'The Academy',
  description:
    'Be the ticket: tap your way through the factory that turns a request into a booth on the map.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'barn', roof: 'berry', trim: 'cream', landmark: 'schoolhouse' },
  draw(ctx, size, time, pointer, keys) {
    const played = advance(visit ?? newVisit(time), time, pointer, size, keys);
    const state = played.visit;
    visit = state;
    asked = played.ask ?? asked;
    const at =
      pointer && size > 0
        ? { x: (pointer.x / size) * 100, y: (pointer.y / size) * 100 }
        : undefined;
    const moment = { visit: state, since: time - state.at, time, pointer: at };
    ctx.save();
    ctx.scale(size / 100, size / 100);
    stage(ctx, moment);
    header(ctx, moment);
    footer(ctx, moment);
    ctx.restore();
  },
  ask() {
    const answer = asked;
    asked = undefined;
    return answer;
  },
};

export default theAcademy;
