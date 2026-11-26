/**
 * A booth's stall on the map: laid out on its spot, its body drawn in the
 * shape the booth chose (`stall-shapes.ts`), then what it has earned over
 * whatever shape it is: the Elf Engineer pin, the People's Choice trophy, the
 * advent decorations, the owner's pennant and the visitor's "You" tag.
 */
import { adventCountFor, decorationsFor } from './advent';
import { adventCrown, drawAdventDecorations } from './advent-decorations';
import { badgeFor } from './badges';
import { isOn } from '../feature-flags';
import { middle, quad, shadow } from './brushes';
import { faceOf, onFace, type Face, type PaintSquare } from './faces';
import type { Owner } from './name-board';
import { trophyFor } from './peoples-choice';
import { shownChoice } from './peoples-choice-standings';
import type { NorthPoleSquare } from './square';
import { drawElfHatPin, drawTrophy } from './stall-honours';
import { SHAPE_PLANS } from './stall-catalogue';
import { chosenStall } from './stall-default';
import { STALL_BODIES } from './stall-shapes';
import {
  spotPoint,
  STALL,
  stallLook,
  stallOutline,
  stallReach,
  stallSignLow,
  standing,
} from './stall-plan';
import { canvasFont, theme } from './theme';
import type { Box, Spot, Tile } from './world';

const { colors } = theme;

/**
 * A booth's stall: its square on the front, framed, with the name board over
 * it, in the shape and colours the booth chose, or else the ones its id
 * picks (`stall-default.ts`). Every shape stands on its spot, so the door and the depth
 * order stay the same.
 */
export function drawStall(
  ctx: CanvasRenderingContext2D,
  spot: Spot,
  square: NorthPoleSquare,
  paint: PaintSquare,
  time: number,
  owner: Owner,
): Box {
  const { x, y } = middle(spot);
  const face = faceOf(spot);
  const deep = face.out.x > 0 ? spot.w : spot.h;
  const look = stallLook(chosenStall(square));
  const { wall, roof } = SHAPE_PLANS[look.shape];
  const ground = stallOutline(look.shape).map((at) => spotPoint(face, deep, at));
  shadow(ctx, x, y + 6, 48);
  STALL_BODIES[look.shape](ctx, {
    spot,
    face,
    deep,
    ground,
    wall,
    roof,
    look,
    square,
    paint,
    owner,
    time,
  });
  // A stall nobody owns wears no honours.
  const who = owner.by === undefined ? square.id : '';
  drawHonours(ctx, face, who);
  // The owner's advent challenges, as decorations the map hangs on whatever shape the stall is.
  const decorations = decorationsFor(isOn('advent') ? adventCountFor(who) : 0);
  const crown = stallReach(look.shape) + 6;
  const centre = spotPoint(face, deep, { along: 0.5, depth: 0.5 });
  drawAdventDecorations(ctx, face, centre, crown, decorations, time);
  // The owner's pennant, on a pole at the front's far corner, over whatever shape the stall is.
  const top = look.shape === 'stall' ? STALL.wall + 22 : wall;
  const foot = onFace(face, 0.96, top, look.shape === 'stall' ? -0.5 : 0);
  const pole = 30;
  ownerPennant(ctx, foot, pole, owner.color, Math.sin(time / 500 + spot.number) * 2);
  const reach = Math.max(stallReach(look.shape), top + pole, crown + adventCrown(decorations));
  if (owner.you) youTag(ctx, onFace(face, 0.5, reach + 8, -0.5));
  return standing(spot, reach + (owner.you ? 22 : 0));
}

/** An Elf Engineer's pin on the name board's right end, and a People's Choice trophy on its left. */
function drawHonours(ctx: CanvasRenderingContext2D, face: Face, who: string) {
  const badge = isOn('elfEngineer') ? badgeFor(who) : undefined;
  if (badge) {
    const signLow = stallSignLow(face);
    const pin = onFace(face, 0.94, (signLow + STALL.wall - 2) / 2, 0.1);
    drawElfHatPin(ctx, pin.x, pin.y, (STALL.wall - 2 - signLow) * 0.42, badge.tier);
  }
  // The trophy stands for the top three, clear of the portrait.
  const place = trophyFor(who, shownChoice());
  if (place) {
    const r = (STALL.wall - 2 - stallSignLow(face)) * 0.42;
    const cup = onFace(face, 0.12, STALL.wall - 2 + r, 0.1);
    drawTrophy(ctx, cup.x, cup.y, r, place);
  }
}

/** The owner's pennant in their colour, on a pole `pole` tall from `foot`, waving by `wave`. */
function ownerPennant(
  ctx: CanvasRenderingContext2D,
  foot: Tile,
  pole: number,
  color: string,
  wave: number,
) {
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(foot.x - 1, foot.y - pole, 2, pole);
  ctx.fillStyle = color;
  quad(ctx, [
    { x: foot.x + 1, y: foot.y - pole },
    { x: foot.x + 20, y: foot.y - pole + 6 + wave },
    { x: foot.x + 1, y: foot.y - pole + 12 },
  ]);
  ctx.fill();
}

/** The "You" tag over the visitor's own booth, centred on `at`. */
function youTag(ctx: CanvasRenderingContext2D, at: Tile) {
  const w = 40;
  const h = 20;
  ctx.fillStyle = colors.cocoa;
  ctx.fillRect(at.x - w / 2 - 2, at.y - h / 2 - 2, w + 4, h + 4);
  ctx.fillStyle = colors.gold;
  ctx.fillRect(at.x - w / 2, at.y - h / 2, w, h);
  ctx.fillStyle = colors.ink;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('You', at.x, at.y + 1, w - 4);
  ctx.textBaseline = 'alphabetic';
}
