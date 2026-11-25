/**
 * The pine trees: a snowy pine, the forest's trees copied from sprites drawn
 * once at the camera's resolution, since hundreds stand on the island, and the
 * town square's tree, decorated, its baubles twinkling and a star on top.
 */
import { glow, shadow } from './brushes';
import { inTurn } from './rounds';
import { theme } from './theme';
import { toScreen, type Thing } from './world';

const { colors } = theme;

/** A pine tree with snow on its branches, `scale` times the usual size. */
function drawPine(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(-3, -10, 6, 12);
  for (const [top, half, height] of [
    [-62, 11, 22],
    [-48, 16, 24],
    [-32, 21, 24],
  ] as const) {
    ctx.fillStyle = colors.pineDark;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(half, top + height);
    ctx.lineTo(-half, top + height);
    ctx.fill();
    ctx.fillStyle = colors.pine;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(-half, top + height);
    ctx.lineTo(-half / 3, top + height);
    ctx.fill();
    // Snow along the branches.
    ctx.fillStyle = colors.snow;
    ctx.beginPath();
    ctx.moveTo(0, top);
    ctx.lineTo(half * 0.5, top + height * 0.5);
    ctx.lineTo(half * 0.15, top + height * 0.42);
    ctx.lineTo(-half * 0.2, top + height * 0.55);
    ctx.lineTo(-half * 0.5, top + height * 0.5);
    ctx.fill();
    ctx.fillRect(-half, top + height - 2, half * 2, 2);
  }
  ctx.restore();
}

/** Pine trees drawn once each size, at the resolution the map asked for, to copy rather than redraw. */
const pines = new Map<number, HTMLCanvasElement>();
let pineResolution = 0;
const PINE_SIZES = 4;

/** Sets how many device pixels a world pixel covers at the nearest the camera comes, for the trees drawn ahead. */
export function setSpriteResolution(resolution: number) {
  const rounded = Math.max(0.25, Math.round(resolution * 8) / 8);
  if (rounded === pineResolution) return;
  pineResolution = rounded;
  pines.clear();
}

/** The pine of `size` drawn once at the sprite resolution, or none before the map sets one or outside a page. */
function pineSprite(size: number): HTMLCanvasElement | undefined {
  if (!pineResolution || typeof document === 'undefined') return undefined;
  let sprite = pines.get(size);
  if (!sprite) {
    const scale = 0.8 + (0.45 * size) / (PINE_SIZES - 1);
    sprite = document.createElement('canvas');
    sprite.width = Math.ceil(50 * scale * pineResolution);
    sprite.height = Math.ceil(70 * scale * pineResolution);
    const ctx = sprite.getContext('2d');
    if (!ctx) return undefined;
    ctx.scale(pineResolution, pineResolution);
    drawPine(ctx, 25 * scale, 66 * scale, scale);
    pines.set(size, sprite);
  }
  return sprite;
}

/** A forest pine, copied from its sprite when the map has set one up. */
export function drawTree(ctx: CanvasRenderingContext2D, thing: Thing) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 2, 16);
  const size = Math.round(thing.seed * (PINE_SIZES - 1));
  const sprite = pineSprite(size);
  const at = x + (thing.seed - 0.5) * 10;
  if (!sprite) {
    drawPine(ctx, at, y + 2, 0.8 + (0.45 * size) / (PINE_SIZES - 1));
    return;
  }
  const w = sprite.width / pineResolution;
  const h = sprite.height / pineResolution;
  const scale = 0.8 + (0.45 * size) / (PINE_SIZES - 1);
  ctx.drawImage(sprite, at - 25 * scale, y + 2 - 66 * scale, w, h);
}

/** The town square's tree, decorated, its baubles twinkling and a star on top. */
export function drawTownTree(ctx: CanvasRenderingContext2D, thing: Thing, time: number) {
  const { x, y } = toScreen(thing);
  shadow(ctx, x, y + 4, 40);
  drawPine(ctx, x, y + 6, 2.4);
  const baubles = [
    [-14, -60],
    [12, -66],
    [-24, -84],
    [20, -92],
    [-6, -104],
    [8, -122],
    [-16, -128],
    [30, -72],
    [-34, -70],
    [2, -84],
  ] as const;
  baubles.forEach(([bx, by], n) => {
    ctx.globalAlpha = Math.sin(time / 500 + n * 1.9) > -0.3 ? 1 : 0.4;
    ctx.fillStyle = inTurn([colors.berry, colors.gold, colors.violet], n);
    ctx.beginPath();
    ctx.arc(x + bx, y + by, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  glow(ctx, x, y - 152, 22, 0.8 + 0.2 * Math.sin(time / 400));
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  for (let n = 0; n < 10; n++) {
    const r = n % 2 ? 4 : 10;
    const a = (n / 10) * Math.PI * 2 - Math.PI / 2;
    ctx.lineTo(x + Math.cos(a) * r, y - 152 + Math.sin(a) * r);
  }
  ctx.fill();
}
