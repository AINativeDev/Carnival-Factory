/**
 * The gazebo stall: an open eight-sided gazebo on a wooden deck, slim posts
 * joined by a low rail, a domed roof in the stall's roof colour with a gold
 * finial, and string lights along its eaves. It is open, so the drawing
 * stands on a board before it, as on the tent and the kiosk.
 */
import { bulb, quad, twinkle } from './brushes';
import { band } from './faces';
import { inTurn, sidesOf } from './rounds';
import { stallFront } from './stall-front';
import { spotPoint, STALL, type StallParts } from './stall-plan';
import { prism } from './stall-volumes';
import { theme } from './theme';
import type { Tile } from './world';

const { colors } = theme;

/** How high the deck stands, and the rail along it. */
const DECK = 8;
const RAIL = 22;
/** How many courses the dome is laid in, and how far its eaves reach past the posts. */
const COURSES = 7;
const EAVES = 1.1;

/** The gazebo: deck, posts and rails back to front, the roof, its lights, then the board. */
export function drawGazebo(ctx: CanvasRenderingContext2D, parts: StallParts) {
  const { face, deep, ground, wall, roof, look, square, paint, owner, time } = parts;
  const centre = spotPoint(face, deep, { along: 0.5, depth: 0.5 });
  prism(ctx, ground, DECK, colors.snowShade, colors.wood, colors.cocoa);
  const posts = shrunk(ground, centre, 0.92);
  // Each side's rail and the post at its start, farthest first, so nearer ones cover them.
  const sides = sidesOf(posts).sort((a, b) => a.p.y + a.q.y - (b.p.y + b.q.y));
  for (const { p, q } of sides) {
    ctx.fillStyle = look.trim;
    quad(ctx, [
      { x: p.x, y: p.y - DECK - RAIL },
      { x: q.x, y: q.y - DECK - RAIL },
      { x: q.x, y: q.y - DECK - RAIL + 3 },
      { x: p.x, y: p.y - DECK - RAIL + 3 },
    ]);
    ctx.fill();
    for (const end of [p, q]) {
      ctx.fillStyle = end.x < centre.x ? look.trim : colors.snowShade;
      ctx.fillRect(end.x - 1.5, end.y - wall, 3, wall - DECK);
    }
  }
  const eaves = shrunk(ground, centre, EAVES);
  prism(ctx, eaves, 7, look.roof, look.trim, colors.snowShade, wall);
  for (let k = 0; k < COURSES; k++) {
    const low = (k / COURSES) * (Math.PI / 2);
    const high = ((k + 1) / COURSES) * (Math.PI / 2);
    const course = shrunk(ground, centre, EAVES * 0.92 * Math.cos((low + high) / 2));
    const lift = wall + 7 + roof * Math.sin(low);
    // The top course wears a cap of snow.
    const top = k === COURSES - 1 ? colors.snow : look.roof;
    prism(
      ctx,
      course,
      wall + 7 + roof * Math.sin(high) - lift,
      top,
      look.roof,
      look.roof,
      lift,
      true,
    );
  }
  finial(ctx, { x: centre.x, y: centre.y - wall - 7 - roof });
  eaveLights(ctx, eaves, centre, wall, time);
  ctx.fillStyle = colors.cocoa;
  band(ctx, face, 0.03, 0.97, 0, STALL.wall);
  ctx.fill();
  stallFront(ctx, face, square, paint, owner);
}

/** An outline drawn in towards `centre`, or out from it, by `scale`. */
function shrunk(ground: Tile[], centre: Tile, scale: number): Tile[] {
  return ground.map((p) => ({
    x: centre.x + (p.x - centre.x) * scale,
    y: centre.y + (p.y - centre.y) * scale,
  }));
}

/** A gold spike with a ball, on top of the dome. */
function finial(ctx: CanvasRenderingContext2D, top: Tile) {
  ctx.fillStyle = colors.gold;
  ctx.fillRect(top.x - 1, top.y - 14, 2, 14);
  ctx.beginPath();
  ctx.arc(top.x, top.y - 15, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

/** Bulbs hanging in a slight swag under the front eaves, each shimmering slowly. */
function eaveLights(
  ctx: CanvasRenderingContext2D,
  eaves: Tile[],
  centre: Tile,
  wall: number,
  time: number,
) {
  const hues = [colors.gold, colors.berry, colors.mint] as const;
  let seed = 0;
  for (const { p, q } of sidesOf(eaves)) {
    if (p.y + q.y < centre.y * 2) continue;
    for (const t of [0.2, 0.5, 0.8]) {
      const sag = Math.sin(t * Math.PI) * 4;
      const x = p.x + (q.x - p.x) * t;
      const y = p.y + (q.y - p.y) * t - wall + 2 + sag;
      bulb(ctx, x, y, inTurn(hues, seed), twinkle(time, seed));
      seed++;
    }
  }
}
