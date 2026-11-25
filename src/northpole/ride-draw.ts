/**
 * The player riding a ride level's coaster (ADR 0041): seated in the golden
 * ticket car, in the player's berry coat and pine hat, tipping with the car
 * round a loop, with the gold marker over them so they can find themselves.
 * The track draws the ticket itself (`coaster.ts`); the rider joins the scene
 * just in front of the piece the car is on, so they sit in it.
 */
import { IN_FRONT } from './coaster-pieces';
import { ticketAt } from './coaster-ride';
import type { AddToScene } from './map-crowd';
import { pieceUnder, type Ride } from './ride';
import { theme } from './theme';

const { colors } = theme;

/** How far above the rail the marker floats, in pixels. */
const MARKER = 58;

/** Adds the rider to the scene, in the car where the ride is, `time` bobbing the marker. */
export function addRider(
  ctx: CanvasRenderingContext2D,
  ride: Ride,
  add: AddToScene,
  time: number,
  zoom: number,
) {
  const piece = pieceUnder(ride);
  const car = piece && ticketAt(piece, ride.at);
  if (!piece || !car) return;
  // Just in front of the piece, which may be a station drawn in front of its stall.
  add(piece.x + piece.y + IN_FRONT + 0.01, () => {
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.angle);
    // Seated on the ticket: a coat, a face and a pointed hat with its bobble.
    ctx.fillStyle = colors.berry;
    ctx.beginPath();
    ctx.moveTo(-11, -17);
    ctx.lineTo(1, -17);
    ctx.lineTo(-1, -29);
    ctx.lineTo(-9, -29);
    ctx.fill();
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(-5, -34, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.pine;
    ctx.beginPath();
    ctx.moveTo(-11, -37);
    ctx.lineTo(1, -37);
    ctx.lineTo(4, -48);
    ctx.fill();
    ctx.fillStyle = colors.snow;
    ctx.fillRect(-12, -39, 14, 3);
    ctx.restore();
    // The marker stays upright over the car, bigger when the camera is far.
    const big = Math.max(1, 0.6 / zoom);
    const top = car.y - MARKER - 10 * big + Math.sin(time / 300) * 3;
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.moveTo(car.x - 6 * big, top);
    ctx.lineTo(car.x + 6 * big, top);
    ctx.lineTo(car.x, top + 10 * big);
    ctx.fill();
  });
}
