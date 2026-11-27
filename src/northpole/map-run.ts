/**
 * Starting a running map: laying out its world, placing the player where the
 * page asked or where they last stood, and setting everything it keeps between
 * frames to how it begins. Kept apart from startMap, which wires it to the
 * page, so the map's tests can start one and look inside it.
 */
import { islandBounds, islandCorners } from './camera';
import { layer } from './map-layers';
import { spotOf } from './map-labels';
import type { MapOptions } from './map-options';
import { islandBox, layoutOf, layWorld } from './map-plan';
import { trackPointer } from './map-pointer';
import { remembered, type MapRun } from './map-state';
import { makeTag } from './map-tag';
import { makeZoomButtons } from './map-zoom-buttons';
import { landedBooths } from './spots';
import { startRide } from './ride';
import { boardAt, makeRideButton } from './ride-map';

/** A new running map for these options: the world laid out, the player placed, nothing drawn yet. */
export function openRun(
  frame: HTMLElement,
  canvas: HTMLCanvasElement,
  prompt: HTMLButtonElement,
  options: MapOptions,
): MapRun {
  const list = options.pending ?? [];
  const world = layWorld(options, list);
  const boothIds = new Set(options.booths.map((square) => square.id));
  const island = islandCorners(world);
  const ride = options.level?.ride ? startRide(world.things) : undefined;
  const m: MapRun = {
    options,
    frame,
    canvas,
    prompt,
    ctx: canvas.getContext('2d') as CanvasRenderingContext2D,
    scratch: document.createElement('canvas'),
    squares: {
      attraction: new Map(options.attractions.map((square) => [square.id, square])),
      booth: new Map(options.booths.map((square) => [square.id, square])),
    },
    pending: new Map(list.map((entry) => [entry.login, entry])),
    world,
    layout: layoutOf(world),
    place: options.level?.id ?? '',
    stations: new Map((options.levels ?? []).map((entry) => [entry.login, entry])),
    landed: new Map(
      landedBooths(options.wereSites ?? [], boothIds).map((login) => [login, undefined]),
    ),
    selected: undefined,
    selectedAt: undefined,
    trailing: false,
    me: options.me,
    avatars: new Map(),
    invited: undefined,
    invitedAt: 0,
    touchScreen: window.matchMedia('(pointer: coarse)'),
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)'),
    island,
    bounds: islandBounds(world),
    // Stryker disable next-line ObjectLiteral: placed again below, before anything reads it
    player: { ...world.start },
    path: [],
    facing: 1,
    moving: false,
    camera: undefined,
    zoom: 0,
    walking: 0,
    movedAt: -Infinity,
    overview: false,
    panned: undefined,
    dragging: undefined,
    fingers: new Map(),
    pinching: undefined,
    chosen: undefined,
    near: undefined,
    scale: 1,
    last: undefined,
    visiting: undefined,
    claiming: undefined,
    footprints: [],
    entered: undefined,
    fading: -Infinity,
    hovered: undefined,
    tagged: undefined,
    tag: makeTag(frame),
    zoomButtons: makeZoomButtons(frame),
    frameId: 0,
    frames: 0,
    slowest: 0,
    recent: [],
    targets: [],
    held: new Map(),
    pointer: trackPointer(canvas),
    ride,
    rideButton: ride && makeRideButton(frame),
    layers: { sky: layer(1, 1), mountains: layer(1, 1), ground: layer(1, 1), front: layer(1, 1) },
    groundBox: islandBox(island, world.indoor),
  };
  // The player starts at the square the page opened on, else where they last stood in this world.
  m.selected = options.focus ? spotOf(m, options.focus.kind, options.focus.id) : undefined;
  m.player = m.selected ? { ...m.selected.door } : (remembered.get(m.place) ?? { ...world.start });
  // In a ride level they're in the car instead, at that door's station, or at the first.
  boardAt(m, m.player);
  return m;
}
