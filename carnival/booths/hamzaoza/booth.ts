import type { NorthPoleSquare } from '../../../src/northpole/square';
import { theme } from '../../../src/northpole/theme';
import { courseItem, penguin } from './characters';
import { advance, type Game, newGame } from './game';
import { hud } from './hud';
import { sky, slope } from './scenery';
import { blob, cameraLane, drift, inView } from './view';

const { colors } = theme;

let game: Game | undefined;

/** First-person run down an ice mountain on a penguin's sled: steer round rocks and drifts, scoop up snowflakes. */
const booth: NorthPoleSquare = {
  id: 'hamzaoza',
  name: 'Penguin Slide',
  description:
    'Steer a little penguin down an ice mountain, round rocks and drifts, for snowflakes.',
  draw(ctx, size, time, pointer) {
    game = advance(game ?? newGame(time), time, pointer, size);
    const { run } = game;
    ctx.save();
    ctx.scale(size / 100, size / 100);
    ctx.beginPath();
    ctx.rect(0, 0, 100, 100);
    ctx.clip();
    const camera = cameraLane(run.lane);
    sky(ctx, time);
    slope(ctx, camera, run.distance);
    for (const { item, ahead } of inView(run.seed, run.distance))
      courseItem(ctx, item, ahead, camera, time);

    // Snow whipping past the camera.
    ctx.fillStyle = colors.snow;
    for (let i = 0; i < 14; i++) {
      const f = drift(i, time);
      blob(ctx, f.x * 100, f.y * 100, 0.5, 0.5);
    }
    penguin(ctx, run, time);
    hud(ctx, game, pointer, time);
    ctx.restore();
  },
};

export default booth;
