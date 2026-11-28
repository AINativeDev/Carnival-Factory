/**
 * The visitor, the ticket, as it travels the hall: where it stands (from
 * camera.ts), the labels it has picked up so far (booth-request, then tessl
 * once the elf's stamp lands), the jolt as the stamp thunks down, and a
 * happy hop in the open gate. Drawn over the scene, with its own soft
 * shadow on the floor.
 */
import { shadow } from '../../../src/northpole/diorama';
import { ticketAt } from './camera';
import { kindOf } from './journey';
import type { Moment } from './moment';
import type { Visit } from './state';
import { GATE_CHECKS } from './steps';
import { ticket, type TicketLook } from './ticket';

/** How long the elf's stamp takes to come down, in ms. */
export const SLAM = 180;

/** What the ticket wears at the visit's beat, `since` ms in: its labels and its ACCEPTED stamp. */
export function ticketLook(visit: Visit, since: number): Omit<TicketLook, 'booth' | 'look'> {
  const kind = kindOf(visit);
  if (kind === 'start') return { labels: [], stamp: 0 };
  if (kind === 'live') return { labels: ['tessl'], stamp: 1 };
  const accepted = kind !== 'ticket' && (kind !== 'assess' || (visit.beat > 0 && since >= SLAM));
  return {
    labels: accepted ? ['booth-request', 'tessl'] : ['booth-request'],
    stamp: accepted ? 1 : 0,
  };
}

/** How far the ticket is knocked aside right now: the stamp's jolt, or a hop in the open gate. */
function knock(moment: Moment): { x: number; y: number } {
  const { visit, since, time } = moment;
  const kind = kindOf(visit);
  if (kind === 'assess' && visit.beat > 0 && since > SLAM) {
    // The jolt as the stamp lands, dying away in under half a second.
    const jolt = Math.sin(since / 25) * Math.max(0, 1 - (since - SLAM) / 400);
    return { x: jolt * 1.2, y: Math.abs(jolt) };
  }
  if (kind === 'gate' && visit.beat >= GATE_CHECKS.length && since > 500)
    return { x: 0, y: -Math.abs(Math.sin(time / 220)) * 2.2 };
  return { x: 0, y: 0 };
}

/** The ticket where it stands or walks, if it's on show. */
export function traveller(ctx: CanvasRenderingContext2D, moment: Moment) {
  const { visit, since, time } = moment;
  const walk = ticketAt(visit, since);
  if (!walk || walk.grow <= 0) return;
  const off = knock(moment);
  ctx.save();
  ctx.translate(walk.x, walk.ground);
  ctx.scale(walk.grow, walk.grow);
  shadow(ctx, 0, 0, walk.s * 0.9);
  ctx.restore();
  ctx.save();
  ctx.translate(walk.x + off.x, walk.y + off.y);
  ctx.scale(walk.grow, walk.grow);
  const look = { booth: visit.booth, look: visit.look, ...ticketLook(visit, since) };
  ticket(ctx, 0, 0, walk.s, look, time);
  ctx.restore();
}
