/**
 * The diorama's ground and its blocks: where a spot on the snow slab is on
 * screen, and the lit box every stall, crate and counter is built from. Kept
 * apart from the backdrop and the round shapes because everything else in the
 * diorama stands on these. Like the rest of the diorama, it imports nothing but
 * `./theme`, since every booth may import it (diorama.test.ts checks).
 */
export interface Point {
  x: number;
  y: number;
}

/** The ground slab: its middle on screen, how far it reaches along each side, and how thick it is. */
export const GROUND = { x: 50, y: 66, reach: 22, depth: 6 };

/**
 * Where a spot on the ground is on screen, `z` above it. `gx` runs down to the
 * right and `gy` down to the left, as the world's tiles do, from -reach to
 * reach across the slab.
 */
export function iso(gx: number, gy: number, z = 0): Point {
  return { x: GROUND.x + (gx - gy), y: GROUND.y + (gx + gy) / 2 - z };
}

/** Starts a closed path through `points`, ready to fill. */
export function diamond(ctx: CanvasRenderingContext2D, ...points: Point[]) {
  ctx.beginPath();
  points.forEach((p, n) => {
    if (n) ctx.lineTo(p.x, p.y);
    else ctx.moveTo(p.x, p.y);
  });
  ctx.closePath();
}

/**
 * A box on the ground from (gx, gy), `w` along gx and `d` along gy, standing
 * `h` high from `lift` above the ground: its lit left side, its shaded right
 * side and its top.
 */
export function box(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  w: number,
  d: number,
  h: number,
  top: string,
  left: string,
  right: string,
  lift = 0,
) {
  const at = (x: number, y: number, z: number) => iso(x, y, lift + z);
  ctx.fillStyle = left;
  diamond(ctx, at(gx, gy + d, 0), at(gx + w, gy + d, 0), at(gx + w, gy + d, h), at(gx, gy + d, h));
  ctx.fill();
  ctx.fillStyle = right;
  diamond(ctx, at(gx + w, gy + d, 0), at(gx + w, gy, 0), at(gx + w, gy, h), at(gx + w, gy + d, h));
  ctx.fill();
  ctx.fillStyle = top;
  diamond(ctx, at(gx, gy, h), at(gx + w, gy, h), at(gx + w, gy + d, h), at(gx, gy + d, h));
  ctx.fill();
}
