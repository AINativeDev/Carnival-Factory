import type { NorthPoleSquare } from '../../northpole/square';
import { theme } from '../../northpole/theme';

const { colors } = theme;

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  ctx.fillStyle = colors.wood;
  ctx.fillRect(x - height * 0.06, y - height * 0.15, height * 0.12, height * 0.15);
  for (let tier = 0; tier < 3; tier++) {
    const top = y - height * (0.35 + tier * 0.22);
    const half = height * (0.32 - tier * 0.08);
    ctx.fillStyle = tier % 2 ? colors.pineDark : colors.pine;
    ctx.beginPath();
    ctx.moveTo(x, top - height * 0.2);
    ctx.lineTo(x + half, top + height * 0.2);
    ctx.lineTo(x - half, top + height * 0.2);
    ctx.closePath();
    ctx.fill();
  }
}

/** Santa's workshop: a red cabin with a glowing window, between two pines. */
const booth: NorthPoleSquare = {
  id: 'jedi4ever',
  name: "Santa's Workshop",
  description: 'Where every booth on the map gets its final check before it ships.',
  draw(ctx, size, time) {
    const u = size / 100;

    ctx.fillStyle = colors.snow;
    ctx.fillRect(0, 0, size, size);

    tree(ctx, 16 * u, 88 * u, 44 * u);
    tree(ctx, 86 * u, 90 * u, 38 * u);

    // The cabin.
    ctx.fillStyle = colors.berry;
    ctx.fillRect(28 * u, 50 * u, 44 * u, 34 * u);
    ctx.fillStyle = colors.snowShade;
    ctx.beginPath();
    ctx.moveTo(22 * u, 52 * u);
    ctx.lineTo(50 * u, 28 * u);
    ctx.lineTo(78 * u, 52 * u);
    ctx.closePath();
    ctx.fill();

    // The door and a window that flickers like a fire inside.
    ctx.fillStyle = colors.wood;
    ctx.fillRect(44 * u, 66 * u, 12 * u, 18 * u);
    ctx.globalAlpha = 0.75 + 0.25 * Math.sin(time / 300);
    ctx.fillStyle = colors.glow;
    ctx.fillRect(32 * u, 58 * u, 9 * u, 9 * u);
    ctx.fillRect(59 * u, 58 * u, 9 * u, 9 * u);
    ctx.globalAlpha = 1;

    // A star over the roof.
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.arc(50 * u, 20 * u, 3 * u, 0, Math.PI * 2);
    ctx.fill();
  },
};

export default booth;
