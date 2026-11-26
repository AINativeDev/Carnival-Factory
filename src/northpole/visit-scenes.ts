/**
 * The mood round a square's drawing while someone is inside it, the square's
 * own choice (`stall.scene`, ADR 0057). It's drawn once the drawing is on
 * the canvas, slipped under it with `destination-over`: a scene never touches
 * the drawing itself, so a game's score stays as the square drew it.
 */
import type { Scene } from './square';
import { theme } from './theme';
import type { Box } from './world';

const { colors } = theme;

/** How many pixels across the glow is: few enough that stretching it blurs it. */
const GLOW = 12;

/** The small canvas the glow shrinks the drawing into, made once, when there's a page to make it on. */
let glowCanvas: HTMLCanvasElement | undefined;

/** What a scene draws with: the canvas, the screen's size, where the drawing stands, and its last picture. */
export interface SceneFrame {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  stage: Box;
  /** The square's last picture, `size` across, still on its scratch canvas. */
  scratch: HTMLCanvasElement;
  size: number;
}

/**
 * A glow of the drawing's own colours: its picture shrunk to a few pixels and
 * stretched over the whole screen, which blurs it into soft light, dimmed
 * with night so the drawing stays the brightest thing on screen.
 */
function glowBehind({ ctx, width, height, scratch, size }: SceneFrame) {
  glowCanvas ??= document.createElement('canvas');
  glowCanvas.width = GLOW;
  glowCanvas.height = GLOW;
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
  try {
    // A square that left nothing to copy has no glow, only the night.
    glowCanvas.getContext('2d')?.drawImage(scratch, 0, 0, size, size, 0, 0, GLOW, GLOW);
    ctx.drawImage(glowCanvas, 0, 0, width, height);
  } catch {
    // The night below is enough.
  }
  ctx.fillRect(0, 0, width, height);
}

/** Where the one light comes from in chiaroscuro: above the drawing's upper left, as in docs/style.md. */
const lightOf = (stage: Box) => ({ x: stage.x + stage.w * 0.28, y: stage.y + stage.h * 0.18 });

/** Chiaroscuro behind: darkness, with a warm pool where the light spills past the drawing. */
function shadowBehind({ ctx, width, height, stage }: SceneFrame) {
  const light = lightOf(stage);
  const pool = ctx.createRadialGradient(light.x, light.y, 0, light.x, light.y, stage.w * 1.1);
  pool.addColorStop(0, colors.lantern);
  pool.addColorStop(0.5, colors.gingerbread);
  pool.addColorStop(1, 'transparent');
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = pool;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.night;
  ctx.fillRect(0, 0, width, height);
}

/** Draws `scene` round the drawing just drawn at `frame.stage`. */
export function drawScene(scene: Scene | undefined, frame: SceneFrame) {
  const { ctx } = frame;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-over';
  if (scene === 'chiaroscuro') shadowBehind(frame);
  else glowBehind(frame);
  ctx.restore();
}
