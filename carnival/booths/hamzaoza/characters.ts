/**
 * The characters on the slope: the snowflakes, rocks and snowdrifts coming up
 * the course, and the penguin on its sled, which tilts as it steers and tumbles
 * after a crash.
 */
import { theme } from '../../../src/northpole/theme';
import { clamp, type Thing } from './course';
import type { Run } from './game';
import { blob, cameraLane, type Ctx, project } from './view';

const { colors } = theme;

/** A snowflake, rock or snowdrift `ahead` metres down the course, with its shadow. */
export function courseItem(
  ctx: Ctx,
  item: Thing,
  ahead: number,
  camera: number,
  time: number,
): void {
  const p = project(item.lane, ahead, camera);
  const k = p.k;
  // A soft shadow under everything.
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  blob(ctx, p.x + 1.2 * k, p.y, 6 * k, 1.6 * k);
  ctx.globalAlpha = 1;
  if (item.kind === 'flake') {
    // A glowing snowflake, floating and turning gently.
    const bob = Math.sin(time / 500 + item.index) * 1.2 * k;
    const y = p.y - 8 * k + bob;
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = colors.glow;
    blob(ctx, p.x, y, 8 * k, 8 * k);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.snow;
    ctx.lineWidth = Math.max(0.3, 1 * k);
    ctx.lineCap = 'round';
    const spin = time / 1_500 + item.index;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = spin + (i * Math.PI) / 3;
      ctx.moveTo(p.x - Math.cos(a) * 5 * k, y - Math.sin(a) * 5 * k);
      ctx.lineTo(p.x + Math.cos(a) * 5 * k, y + Math.sin(a) * 5 * k);
    }
    ctx.stroke();
  } else if (item.kind === 'rock') {
    ctx.fillStyle = colors.mountain;
    ctx.beginPath();
    ctx.moveTo(p.x - 7 * k, p.y);
    ctx.quadraticCurveTo(p.x - 6 * k, p.y - 11 * k, p.x - 1 * k, p.y - 12 * k);
    ctx.quadraticCurveTo(p.x + 6 * k, p.y - 10 * k, p.x + 7 * k, p.y);
    ctx.fill();
    ctx.fillStyle = colors.ice;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(p.x - 5 * k, p.y - 3 * k);
    ctx.quadraticCurveTo(p.x - 4.5 * k, p.y - 10 * k, p.x - 1 * k, p.y - 11 * k);
    ctx.quadraticCurveTo(p.x - 3 * k, p.y - 6 * k, p.x - 2 * k, p.y - 3 * k);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = colors.snowShade;
    blob(ctx, p.x, p.y - 3 * k, 8 * k, 5 * k);
    ctx.fillStyle = colors.snowLit;
    blob(ctx, p.x - 1.5 * k, p.y - 4.5 * k, 5 * k, 3 * k);
  }
}

/** The penguin from behind, on its belly on a little sled, tumbling softly after a crash. */
export function penguin(ctx: Ctx, run: Run, time: number): void {
  const camera = cameraLane(run.lane);
  const at = project(run.lane, 0, camera);
  const tumble = run.crashedAt === null ? 0 : Math.min(1, (time - run.crashedAt) / 700);
  const tilt = clamp((run.target - run.lane) * 0.4, -0.35, 0.35) + tumble * Math.PI * 0.55;
  const bounce =
    run.crashedAt === null ? Math.sin(time / 140) * 0.35 : -Math.sin(tumble * Math.PI) * 4;
  ctx.save();
  ctx.translate(at.x, 90 + bounce);
  ctx.rotate(tilt);
  ctx.fillStyle = colors.shadow;
  ctx.globalAlpha = 0.3;
  blob(ctx, 1.5, 6, 15, 3);
  ctx.globalAlpha = 1;
  // The sled, with its curled runners.
  ctx.fillStyle = colors.berry;
  ctx.beginPath();
  ctx.moveTo(-14, 3);
  ctx.lineTo(14, 3);
  ctx.lineTo(12, 7);
  ctx.lineTo(-12, 7);
  ctx.fill();
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.lineTo(14, 8);
  ctx.stroke();
  // Flippers spread wide, then the round body, head and a little scarf.
  ctx.fillStyle = colors.ink;
  ctx.beginPath();
  ctx.ellipse(-10, 0, 7, 2.6, -0.35, 0, Math.PI * 2);
  ctx.ellipse(10, 0, 7, 2.6, 0.35, 0, Math.PI * 2);
  ctx.fill();
  blob(ctx, 0, -2, 8.5, 7.5);
  blob(ctx, 0, -10, 5.5, 5.2);
  ctx.fillStyle = colors.gold;
  blob(ctx, -3.5, 5, 2.4, 1.2);
  blob(ctx, 3.5, 5, 2.4, 1.2);
  ctx.fillStyle = colors.berry;
  ctx.fillRect(-5.5, -6.2, 11, 2);
  ctx.fillRect(2, -6, 2, 5 + Math.sin(time / 200));
  ctx.restore();

  if (run.crashedAt !== null) {
    // A soft puff of snow where it tumbled.
    const puff = Math.min(1, (time - run.crashedAt) / 900);
    ctx.fillStyle = colors.snow;
    ctx.globalAlpha = 0.7 * (1 - puff);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      blob(ctx, at.x + Math.cos(a) * 14 * puff, 86 + Math.sin(a) * 6 * puff, 3, 2.2);
    }
    ctx.globalAlpha = 1;
  }
}
