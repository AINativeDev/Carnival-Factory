/**
 * What the visitor's keys, mouse and the call to action do on the map: walk
 * with WASD or the arrows, open with E or Enter, let go with Escape, click the
 * ground to walk there and a structure to open it, inside a room click to walk
 * or leave. Fingers dragging and pinching the camera are map-touch.ts.
 */
import { BILLBOARD, onBillboard } from './billboard';
import { middle } from './brushes';
import { screenToWorld } from './camera-view';
import { clickInRoom, roomArea, roomLayout } from './interior';
import { plotUnder } from './map-labels';
import { enter, open, select } from './map-open';
import type { MapRun } from './map-state';
import { KEYS, walkToward } from './map-walk';
import { inviteFor } from './owners';
import { rideKey, rideOnward } from './ride-map';
import { toScreen, toTile, type Tile } from './world';
import { tileOf } from './walking';

/** Whether a key press belongs to a text field. */
export const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/** Whether Enter on `target` already does something of its own, as on a link or a button. */
const pressable = (target: EventTarget | null) =>
  target instanceof HTMLElement && /^(BUTTON|A)$/.test(target.tagName);

/** Where a click or the mouse is, in world pixels. */
export function pointAt(m: MapRun, event: MouseEvent): Tile {
  const box = m.canvas.getBoundingClientRect();
  const centre = m.camera ?? toScreen(m.player);
  return screenToWorld(
    { x: event.clientX - box.left, y: event.clientY - box.top },
    box.width,
    box.height,
    centre,
    m.zoom || 1,
  );
}

/** Whether `point` is on the billboard: a click there opens its tickets page in a new tab. */
export const billboardUnder = (m: MapRun, point: Tile) =>
  m.world.things.some((thing) => thing.kind === 'billboard' && onBillboard(middle(thing), point));

/** Walk with the keys, open what's invited into with E or Enter, and let go of it with Escape. */
export function onKeyDown(m: MapRun, event: KeyboardEvent) {
  if (typing(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
  const name = event.key.toLowerCase();
  const step = KEYS[name];
  // In a ride the walking keys don't walk, so nobody walks off the track (ADR 0041).
  if (m.ride && !m.visiting && (rideKey(m, name, pressable(event.target)) || step)) {
    event.preventDefault();
    return;
  }
  const invited = inviteFor(m.selected, m.near);
  if (step) {
    m.held.set(name, step);
    event.preventDefault();
  } else if ((name === 'e' || (name === 'enter' && !pressable(event.target))) && invited) {
    if (m.visiting) return;
    event.preventDefault();
    enter(m, invited);
  } else if (name === 'escape' && m.selected && !m.visiting) {
    select(m, undefined);
  }
}

/** The call to action, clicked: opens what it invites into. */
export function onPrompt(m: MapRun) {
  const plot = inviteFor(m.selected, m.near);
  if (plot && !m.visiting) enter(m, plot);
}

/**
 * A click walks to the ground clicked, or opens the structure clicked. On a
 * touch screen the first tap on a structure shows its tag, and the second
 * opens it. Inside a room, a click walks the player there, or out through the
 * doorway. A drag is the square's to play with, not a click.
 */
export function onClick(m: MapRun, event: MouseEvent) {
  const box = m.canvas.getBoundingClientRect();
  const at = { x: event.clientX - box.left, y: event.clientY - box.top };
  if (!m.pointer.tapped(at)) return;
  if (m.visiting) {
    const goal = clickInRoom(roomLayout(roomArea(box.width, box.height)), at);
    if (goal) m.insideGoal = goal;
    return;
  }
  const point = pointAt(m, event);
  if (billboardUnder(m, point)) {
    window.open(BILLBOARD.tickets, '_blank', 'noopener');
    return;
  }
  const plot = plotUnder(m, point);
  const touch = (event as PointerEvent).pointerType === 'touch';
  if (plot && touch && m.hovered !== plot) {
    m.hovered = plot;
    return;
  }
  if (plot) {
    open(m, plot);
    return;
  }
  m.hovered = undefined;
  // In a ride, a click on the ground rides on instead: nobody walks off the track.
  if (m.ride) {
    rideOnward(m);
    return;
  }
  // Walk to the tile clicked, or the nearest one beside it you can stand on.
  const tile = tileOf(toTile(point));
  const goals: Tile[] = [];
  for (let ring = 0; ring <= 2; ring++)
    for (let dx = -ring; dx <= ring; dx++)
      for (let dy = -ring; dy <= ring; dy++)
        if (Math.max(Math.abs(dx), Math.abs(dy)) === ring)
          goals.push({ x: tile.x + dx, y: tile.y + dy });
  walkToward(m, goals);
}
