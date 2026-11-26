/**
 * Everything a running map holds: the page's parts it draws on, and what it
 * keeps between frames, such as where the player is and where they're going,
 * the camera, what's picked, hovered or visited, and the fingers on the screen.
 * One object that every part of the map (walking, the camera, the scene, the
 * prompt, the visitor's input) reads and changes, so each part can live in a
 * file of its own (docs/adr/0019-small-files.md).
 */
import type { islandCorners } from './camera';
import type { PointerTracker } from './map-pointer';
import type { MapTag } from './map-tag';
import type { ZoomButtons } from './map-zoom-buttons';
import type { MapOptions, StationEntry } from './map-options';
import { type PendingBooth } from './construction-sites';
import type { Ride } from './ride';
import type { NorthPoleSquare } from './square';
import type { Box, Spot, Tile, World } from './world';

/** A canvas of its own, drawn on once and copied onto the map each frame. */
export interface Layer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

/** A footprint in the snow: where, when it was left, and which foot. */
interface Footprint {
  at: Tile;
  time: number;
  side: number;
}

/** Where the player stood when they last opened a square, in each world, so coming back puts them there. */
export const remembered = new Map<string, Tile>();

/** What the map keeps between frames. */
interface MapState {
  world: World;
  /** The world's layout, so the island is only redrawn when a spot changes. */
  layout: string;
  /** The booth requests being built, by login, and the booths they change. */
  pending: Map<string, PendingBooth>;
  island: ReturnType<typeof islandCorners>;
  bounds: Box;
  /** What the island's cached layers cover, in world pixels. */
  groundBox: Box;
  /** The sky and the mountains at the screen's size, and the island and its front fence. */
  layers: { sky: Layer; mountains: Layer; ground: Layer; front: Layer };
  /** The picked spot, when its highlight began, and whether the player is walking there on a trail. */
  selected: Spot | undefined;
  selectedAt: number | undefined;
  trailing: boolean;
  me: string | undefined;
  /** The spot the call to action invites into, and when it started to. */
  invited: Spot | undefined;
  invitedAt: number;
  player: Tile;
  path: Tile[];
  facing: number;
  moving: boolean;
  camera: Tile | undefined;
  zoom: number;
  /** How far the camera has come in for the walk, from 0 to 1, and when the player last moved. */
  walking: number;
  movedAt: number;
  overview: boolean;
  /**
   * Where a finger dragged the camera, which it stays at until the player
   * walks or goes to a square, and the finger dragging it now: where it was
   * last, once it has moved too far to be a tap.
   */
  panned: Tile | undefined;
  dragging: { id: number; from: Tile; moved: boolean } | undefined;
  /**
   * The fingers on the map, two of which pinch the camera nearer or farther:
   * how far apart they were last and the point between them. `chosen` is the
   * zoom the visitor chose, with fingers, the wheel, the keys or the zoom
   * buttons, which a walk keeps, until the overview goes on or off.
   */
  fingers: Map<number, Tile>;
  pinching: { apart: number; between: Tile } | undefined;
  chosen: number | undefined;
  near: Spot | undefined;
  scale: number;
  last: number | undefined;
  /** The spot the player is inside, the open spot they're walking to claim, and their footprints. */
  visiting: Spot | undefined;
  claiming: Spot | undefined;
  footprints: Footprint[];
  /**
   * The spot whose room is drawn, which changes halfway through the fade in or
   * out, and when that fade began. Inside, where the player stands, where a
   * click sends them, and which way they face.
   */
  entered: Spot | undefined;
  fading: number;
  inside: Tile;
  insideGoal: { to: Tile; out: boolean } | undefined;
  insideFacing: number;
  /** The spot under the mouse, or tapped once on a touch screen, and the tag that names it. */
  hovered: Spot | undefined;
  tagged: Spot | undefined;
  /** What can be clicked this frame, back to front: each spot's structure or sign. */
  targets: { spot: Spot; box: Box }[];
  /** The keys held down now, by name, and which way each walks on screen. */
  held: Map<string, [number, number]>;
  /** In a ride level, where the coaster's car is, with the player in it (ADR 0041). */
  ride: Ride | undefined;
  /** The frame asked for next, and how long frames took, for the smoke test's budget. */
  frameId: number;
  frames: number;
  slowest: number;
  recent: number[];
}

/** A running map: what it keeps between frames, and the page's parts it draws on. */
export interface MapRun extends MapState {
  readonly options: MapOptions;
  readonly frame: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly prompt: HTMLButtonElement;
  readonly ctx: CanvasRenderingContext2D;
  /** The canvas each square paints on before it's copied onto the map. */
  readonly scratch: HTMLCanvasElement;
  /** The tag that names the spot under the mouse. */
  readonly tag: MapTag;
  /** The zoom buttons over the map. */
  readonly zoomButtons: ZoomButtons;
  readonly pointer: PointerTracker;
  /** In a ride level, the button that sends the car on from a station. */
  readonly rideButton: HTMLButtonElement | undefined;
  readonly touchScreen: MediaQueryList;
  readonly reduced: MediaQueryList;
  /** Which world this is, for where the player stood in it: the North Pole, or a level's owner. */
  readonly place: string;
  readonly squares: Record<'attraction' | 'booth', Map<string, NorthPoleSquare>>;
  readonly stations: Map<string, StationEntry>;
  /** The booths that just landed on their construction site's spot, and when their sparkles began. */
  readonly landed: Map<string, number | undefined>;
  /** Avatars by login: loading, loaded, or failed, which draws the elf. */
  readonly avatars: Map<string, HTMLImageElement | undefined>;
}
