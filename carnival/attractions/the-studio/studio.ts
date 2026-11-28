/**
 * The studio's one piece of state for a visit, and how each frame moves it on:
 * the episode, the best score, the crowd's last cheer and a link asked for.
 * A tap, Space or Enter says a word while an episode records, and goes on
 * everywhere else, as → does too; a tap on a link asks for it instead. Keys
 * can't be held, so a long word started from a key is said in full.
 */
import type { SquareKey, SquarePointer } from '../../../src/northpole/square';
import { buttonsFor, linkAt } from './buttons';
import {
  autoplay,
  DEMO_WRAP,
  IDLE,
  LISTEN,
  newGame,
  phaseOf,
  settle,
  tap,
  type Game,
} from './game';

/** All the studio remembers, for one visit. */
export interface Studio {
  game: Game;
  best: number;
  cheer: number;
  /** The link a tap on a button asked to open, until the page is told. */
  open: number | null;
  /** Whether the long word being said was started from a key, so it's held to its end. */
  keyHold: boolean;
}

/** The studio at the start of a visit: the host recording a demo episode. */
export function newStudio(time: number): Studio {
  const game = newGame(time, 1, false);
  return { game, best: 0, cheer: -Infinity, open: null, keyHold: false };
}

/** How many of `keys` go on: Space and Enter always, → too while no visitor's word is due. */
export function keyPresses(keys: readonly SquareKey[] | undefined, recording: boolean): number {
  const goes = (key: SquareKey) =>
    key === 'space' || key === 'enter' || (!recording && key === 'right');
  return (keys ?? []).filter(goes).length;
}

/** The host's demo and its wrap-up loop; a visitor's wrap-up left alone goes back to the host. */
function rewind(game: Game, time: number): Game {
  if (game.ended === null || phaseOf(game, time) !== 'wrap') return game;
  const since = time - game.ended;
  return since >= LISTEN + (game.visitor ? IDLE : DEMO_WRAP) ? newGame(time, 1, false) : game;
}

/**
 * Moves the studio on to `time`, with what the pointer did and the keys
 * pressed since the last frame, over a square `size` across. A tap on a link
 * asks for it instead of playing.
 */
export function advance(
  studio: Studio,
  time: number,
  pointer: SquarePointer | undefined,
  size: number,
  keys?: readonly SquareKey[],
): Studio {
  let { best, cheer, open, keyHold } = studio;
  let game = rewind(studio.game, time);
  const phase = phaseOf(game, time);
  let taps = pointer?.presses ?? 0;
  if (pointer && taps > 0) {
    const at = [(pointer.x * 100) / size, (pointer.y * 100) / size] as const;
    const link = linkAt(buttonsFor(phase, game.visitor), ...at);
    if (link !== null) [open, taps] = [link, 0];
  }
  const keyed = keyPresses(keys, game.visitor && phase === 'record');
  const presses = taps + keyed;
  if (presses > 0) {
    if (!game.visitor) game = newGame(time, 1, true);
    else if (phase === 'listen') cheer = time;
    else if (phase === 'wrap') game = newGame(time, game.lost ? 1 : game.episode + 1, true);
    else for (let n = 0; n < presses; n++) tap(game, time);
  }
  if (!game.visitor) autoplay(game, time);
  keyHold = keyed > 0 || (keyHold && game.holding !== null);
  const wasRecording = game.ended === null;
  settle(game, time, !game.visitor || (pointer?.down ?? false) || keyHold);
  keyHold = keyHold && game.holding !== null;
  if (wasRecording && game.ended !== null && game.visitor) best = Math.max(best, game.score);
  return { game, best, cheer, open, keyHold };
}
