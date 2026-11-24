import { CLAIM_URL } from './links';
import pinned from './plots.json';
import {
  duskAt,
  frameCentre,
  framing,
  islandBounds,
  islandCorners,
  isPhone,
  screenToWorld,
  SLAB,
  worldToScreen,
  type Framing,
} from './camera';
import {
  drawAurora,
  drawClouds,
  drawFrontFence,
  drawIsland,
  drawLightPools,
  drawMountains,
  drawPerson,
  drawPlot,
  drawPlotGlow,
  drawReindeer,
  drawRipples,
  drawSky,
  drawSnowfall,
  drawStringLights,
  drawThing,
  faceOf,
  middle,
  setSpriteResolution,
  type Look,
  type Mapping,
} from './render';
import { isTap, onMapping, onRect } from './pointer';
import type { NorthPoleSquare, SquarePointer } from './square';
import { canvasFont, theme } from './theme';
import {
  clickInRoom,
  drawRoom,
  drawRoomPerson,
  ENTRANCE,
  fadeAt,
  FADE,
  ROOM_SPEED,
  roomArea,
  roomLayout,
  stepInRoom,
} from './interior';
import { nearestOpenPlot, placeTag, tagText, targetAt } from './visit';
import {
  buildWorld,
  findPathToFirst,
  moveBy,
  plotAtDoor,
  screenDirection,
  strollAt,
  tileOf,
  toScreen,
  toTile,
  walkAlong,
  type Box,
  type Plot,
  type Tile,
} from './world';

const { colors } = theme;

/**
 * Draws one booth into the square at (x, y). The booth paints on `scratch`, a
 * canvas of its own that is reset first, and only its pixels are copied onto
 * the map. Whatever state a booth leaves behind, even when it throws halfway
 * through a save, stays on the scratch canvas, and nothing it draws can spill
 * onto a neighbour, even if it resizes that canvas. A booth that throws, or
 * leaves nothing that can be copied, gets a placeholder instead of breaking
 * the whole map.
 */
export function drawSquare(
  ctx: CanvasRenderingContext2D,
  scratch: HTMLCanvasElement,
  booth: NorthPoleSquare,
  x: number,
  y: number,
  size: number,
  time: number,
  pointer?: SquarePointer,
) {
  // Setting the size resets the scratch canvas: its pixels, transform, clip and styles.
  scratch.width = size;
  scratch.height = size;
  try {
    booth.draw(scratch.getContext('2d')!, size, time, pointer);
    // The booth can resize its canvas, so copy exactly its square onto exactly its
    // own square. A canvas it emptied makes drawImage throw, which shows the placeholder.
    ctx.drawImage(scratch, 0, 0, size, size, x, y, size, size);
  } catch (error) {
    console.error(`The square ${booth.id} failed to draw`, error);
    ctx.save();
    ctx.fillStyle = colors.surface;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = colors.muted;
    ctx.font = canvasFont('small');
    ctx.textAlign = 'center';
    ctx.fillText('Under construction', x + size / 2, y + size / 2);
    ctx.restore();
  }
}

export type SquareKind = 'attraction' | 'booth';

export interface MapOptions {
  /** The North Pole's own attractions, round the town square. */
  attractions: readonly NorthPoleSquare[];
  /** Participants' booths, along the lanes. */
  booths: readonly NorthPoleSquare[];
  /** Opens a square: `id` is a booth's owner or an attraction's id. */
  onOpen(kind: SquareKind, id: string): void;
  /** Asks to leave the square the player is inside: they walked out through its doorway. */
  onLeave(): void;
  /** A square to open the map on: the player starts in front of it, and it glows for a few seconds. */
  focus?: { kind: SquareKind; id: string };
}

/** Where the player stood when they last opened a square, so coming back puts them there. */
let remembered: Tile | undefined;

/** How fast the player walks, in tiles a second. */
const SPEED = 4.5;
/** How long a square the map opens on glows, in milliseconds, and how long it takes to fade. */
const HIGHLIGHT_TIME = 6000;
const HIGHLIGHT_FADE = 1500;
/** The size a square draws at on the back wall of its room, in pixels. */
export const VISIT_SIZE = 480;
/** How long footprints stay in the snow, in milliseconds, and how far apart they are, in tiles. */
const FOOTPRINT_TIME = 9000;
const FOOTPRINT_GAP = 0.45;
/** How far above the player the camera looks, in world pixels, so more of what's ahead shows. */
const LOOK_UP = 40;
/** How long the player stands still before the camera eases back out to the carnival, in milliseconds. */
const SETTLE = 2500;
/** Frames the map draws before it starts timing them, while the page warms up. */
const WARM_UP_FRAMES = 30;
/** The widest or tallest the island's cached layers get, in device pixels. */
const LAYER_MAX = 4096;

const KEYS: Record<string, [number, number]> = {
  arrowup: [0, -1],
  w: [0, -1],
  arrowdown: [0, 1],
  s: [0, 1],
  arrowleft: [-1, 0],
  a: [-1, 0],
  arrowright: [1, 0],
  d: [1, 0],
};

const PLAYER: Look = { coat: colors.berry, hat: colors.pine, scale: 1.25 };
const LOOKS: Look[] = [
  { coat: colors.pine, hat: colors.berry, scale: 0.95 },
  { coat: colors.violet, hat: colors.gold, scale: 1 },
  { coat: colors.gingerbread, hat: colors.pine, scale: 0.9 },
  { coat: colors.surface, hat: colors.berry, scale: 1.05 },
];

/** Whether a key press belongs to a text field. */
const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));

/** Whether Enter on `target` already does something of its own, as on a link or a button. */
const pressable = (target: EventTarget | null) =>
  target instanceof HTMLElement && /^(BUTTON|A)$/.test(target.tagName);

/** Opens the Claim your booth form in a new tab. */
function claim() {
  const link = document.createElement('a');
  link.href = CLAIM_URL;
  link.target = '_blank';
  link.rel = 'noopener';
  link.click();
}

/** How long a press shows as `down`, at least, so a quick tap still reaches the square. */
const PRESS_SHOWN = 150;

/**
 * Follows the mouse or a finger over `element`: where it is, in CSS pixels
 * from the element's top-left, whether it's pressed, and whether the last
 * press was a click or a drag. A quick tap stays pressed for `PRESS_SHOWN`, and
 * a finger lifted off stays there as long, so a square asked for its next frame
 * still sees it.
 */
function trackPointer(element: HTMLElement) {
  let at: Tile | undefined;
  let held = false;
  let pressedAt = -Infinity;
  let pressedFrom: Tile | undefined;
  /** Whether the press has moved too far to be a click, at any point since it began. */
  let dragged = false;
  let goneAt = Infinity;
  const place = (event: PointerEvent): Tile => {
    const box = element.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  };
  const onMove = (event: PointerEvent) => {
    at = place(event);
    // Back over the element with the button still down, after leaving it.
    held = event.buttons !== 0;
    if (held && pressedFrom && !isTap(pressedFrom, at)) dragged = true;
    goneAt = Infinity;
  };
  const onDown = (event: PointerEvent) => {
    at = pressedFrom = place(event);
    held = true;
    dragged = false;
    pressedAt = performance.now();
    goneAt = Infinity;
  };
  const onUp = (event: PointerEvent) => {
    at = place(event);
    held = false;
  };
  const onLeave = (event: PointerEvent) => {
    held = false;
    goneAt = event.pointerType === 'mouse' ? 0 : performance.now() + PRESS_SHOWN;
  };
  const events = [
    ['pointermove', onMove],
    ['pointerdown', onDown],
    ['pointerup', onUp],
    ['pointerleave', onLeave],
    ['pointercancel', onLeave],
  ] as const;
  for (const [name, listener] of events) element.addEventListener(name, listener);
  return {
    /** Where the pointer is now, and whether it's pressed, or undefined when it's off the element. */
    now(): { x: number; y: number; down: boolean } | undefined {
      const time = performance.now();
      if (!at || time > goneAt) return undefined;
      return { x: at.x, y: at.y, down: held || time - pressedAt < PRESS_SHOWN };
    },
    /** Whether a click at `point` ended a press that barely moved, so it opens what it's on. */
    tapped(point: Tile) {
      return !pressedFrom || (!dragged && isTap(pressedFrom, point));
    },
    stop() {
      for (const [name, listener] of events) element.removeEventListener(name, listener);
    },
  };
}

/** What the page can ask of a running map. */
export interface MapControls {
  /** Stops it all. */
  stop(): void;
  /** Walks the player to a square's door. */
  walkTo(kind: SquareKind, id: string): void;
  /** Puts the player straight at a square's door, and glides the camera there. */
  jumpTo(kind: SquareKind, id: string): void;
  /** Walks the player to the nearest open plot. */
  walkToOpenPlot(): void;
  /** Walks the player to the open plot nearest them, leaving footprints, and bounces its sign. */
  claimNextDoor(): void;
  /** Takes the player inside a square, with a short fade. Returns whether it's there. */
  visit(kind: SquareKind, id: string): boolean;
  /** Takes the player back out, just outside the square's door, facing out. */
  leave(): void;
  /** The square being visited, if any. */
  readonly visiting: { kind: SquareKind; id: string } | undefined;
  /** Shows the whole island, or goes back to the carnival. Returns whether it shows the whole island. */
  toggleOverview(): boolean;
  /** Whether it shows the whole island. */
  readonly overview: boolean;
}

/** A canvas of its own, to draw a layer on once. */
function layer(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  return { canvas, ctx: canvas.getContext('2d')! };
}

/**
 * Draws the North Pole as a diorama on `canvas`, which fills `frame`: the whole
 * carnival on one fenced, lit snow island under a mountain-and-aurora sky. It
 * lets the player walk round it with WASD, the arrow keys, or by clicking or
 * tapping the ground. Standing at a booth or an attraction, or at an open plot,
 * `prompt` offers to open it, as do E, Enter and a click on it.
 */
export function startMap(
  frame: HTMLElement,
  canvas: HTMLCanvasElement,
  prompt: HTMLButtonElement,
  options: MapOptions,
): MapControls {
  const ctx = canvas.getContext('2d')!;
  const scratch = document.createElement('canvas');
  const byId = {
    attraction: new Map(options.attractions.map((square) => [square.id, square])),
    booth: new Map(options.booths.map((square) => [square.id, square])),
  };
  const world = buildWorld(
    options.attractions.map((square) => square.id),
    options.booths.map((square) => square.id),
    pinned,
  );
  const squareOf = (plot: Plot) =>
    plot.kind === 'open' ? undefined : byId[plot.kind].get(plot.id!);
  let focused = options.focus
    ? world.plots.find((plot) => plot.kind === options.focus!.kind && plot.id === options.focus!.id)
    : undefined;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const island = islandCorners(world);
  const bounds = islandBounds(world);

  let player: Tile = focused ? { ...focused.door } : (remembered ?? { ...world.start });
  let path: Tile[] = [];
  let facing = 1;
  let moving = false;
  let camera: Tile | undefined;
  let zoom = 0;
  /** How far the camera has come in for the walk, from 0 to 1, and when the player last moved. */
  let walking = 0;
  let movedAt = -Infinity;
  let overview = false;
  let near: Plot | undefined;
  let scale = 1;
  let last: number | undefined;
  let focusedAt: number | undefined;
  /** The plot the player is inside, the open plot they're walking to claim, and their footprints. */
  let visiting: Plot | undefined;
  let claiming: Plot | undefined;
  let footprints: { at: Tile; time: number; side: number }[] = [];
  /**
   * The plot whose room is drawn, which changes halfway through the fade in or
   * out, and when that fade began. Inside, where the player stands, where a
   * click sends them, and which way they face.
   */
  let entered: Plot | undefined;
  let fading = -Infinity;
  let inside: Tile = { ...ENTRANCE };
  let insideGoal: { to: Tile; out: boolean } | undefined;
  let insideFacing = 1;
  /** The plot under the mouse, or tapped once on a touch screen, and the tag that names it. */
  let hovered: Plot | undefined;
  let tagged: Plot | undefined;
  const tag = document.createElement('div');
  tag.className = 'hud map-tag';
  tag.setAttribute('aria-hidden', 'true');
  tag.innerHTML = `<strong class="tag-name"></strong> <span class="tag-owner"></span><span class="tag-line"></span><span class="tag-hint"></span>`;
  frame.append(tag);
  let frameId = 0;
  let frames = 0;
  let slowest = 0;
  const recent: number[] = [];
  /** What can be clicked this frame, back to front: each plot's structure or sign. */
  let targets: { plot: Plot; box: Box }[] = [];
  const held = new Set<string>();
  const pointer = trackPointer(canvas);

  // The static layers: the sky and the mountains at the screen's size, and the
  // island and its front fence at the resolution the camera comes nearest at.
  let sky = layer(1, 1);
  let mountains = layer(1, 1);
  let ground = layer(1, 1);
  let front = layer(1, 1);
  const groundBox: Box = {
    x: island.left.x - 8,
    y: island.top.y - 40,
    w: island.right.x - island.left.x + 16,
    h: island.bottom.y + SLAB + 80 - (island.top.y - 40),
  };

  const want = (): Framing =>
    framing(world, frame.clientWidth, frame.clientHeight, player, walking, overview);

  const resize = () => {
    scale = Math.min(2, window.devicePixelRatio || 1);
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    sky = layer(canvas.width, canvas.height);
    sky.ctx.scale(scale, scale);
    drawSky(sky.ctx, width, height);
    mountains = layer(canvas.width, canvas.height);
    mountains.ctx.scale(scale, scale);
    drawMountains(mountains.ctx, width, height);
    // The nearest the camera comes, walking on a laptop or following on a phone.
    const nearest = framing(world, width, height, player, 1, false).zoom;
    const resolution = Math.min(nearest * scale, LAYER_MAX / groundBox.w, LAYER_MAX / groundBox.h);
    for (const [n, draw] of [
      () => drawIsland(ground.ctx, world, island, SLAB),
      () => drawFrontFence(front.ctx, island),
    ].entries()) {
      const made = layer(groundBox.w * resolution, groundBox.h * resolution);
      made.ctx.setTransform(
        resolution,
        0,
        0,
        resolution,
        -groundBox.x * resolution,
        -groundBox.y * resolution,
      );
      if (n) front = made;
      else ground = made;
      draw();
    }
    setSpriteResolution(nearest * scale);
  };

  const open = (plot: Plot) => {
    if (plot.kind === 'open') return claim();
    remembered = { ...player };
    options.onOpen(plot.kind, plot.id!);
  };

  const showPrompt = () => {
    const square = near && squareOf(near);
    const text = !near
      ? ''
      : near.kind === 'open'
        ? 'Press E to claim this plot'
        : `Visit ${square?.name ?? near.id} (E)`;
    if (prompt.textContent !== text) prompt.textContent = text;
    prompt.hidden = !near;
    const at = `${Math.round(player.x)},${Math.round(player.y)}`;
    if (canvas.dataset.player !== at) canvas.dataset.player = at;
    const nearBy = near ? `${near.kind}:${near.id ?? near.number}` : '';
    if (canvas.dataset.near !== nearBy) canvas.dataset.near = nearBy;
  };

  const walk = (dt: number) => {
    let right = 0;
    let down = 0;
    for (const name of held) {
      right += KEYS[name][0];
      down += KEYS[name][1];
    }
    if (visiting) return walkInside(dt, Math.sign(right), Math.sign(down));
    const direction = screenDirection(Math.sign(right), Math.sign(down));
    const before = player;
    if (direction.x || direction.y) {
      path = [];
      player = moveBy(world, player, direction.x * SPEED * dt, direction.y * SPEED * dt);
    } else if (path.length) {
      ({ position: player, path } = walkAlong(player, path, SPEED * dt));
    }
    moving = player !== before;
    const dx = toScreen(player).x - toScreen(before).x;
    if (Math.abs(dx) > 0.01) facing = Math.sign(dx);
    near = plotAtDoor(world, player);
    if (claiming) {
      const lastStep = footprints.at(-1)?.at ?? before;
      if (moving && Math.hypot(player.x - lastStep.x, player.y - lastStep.y) >= FOOTPRINT_GAP)
        footprints.push({
          at: { ...player },
          time: performance.now(),
          side: footprints.length % 2,
        });
      // The sign stops bouncing once the player has gone somewhere else.
      if (!path.length && near !== claiming) claiming = undefined;
    }
  };

  /** Walks the player inside a room, with the keys or toward where a click sent them, and out through its doorway. */
  const walkInside = (dt: number, right: number, down: number) => {
    let dx = right;
    let dy = down;
    if (dx || dy) insideGoal = undefined;
    else if (insideGoal) {
      dx = insideGoal.to.x - inside.x;
      dy = insideGoal.to.y - inside.y;
    }
    const length = Math.hypot(dx, dy);
    const step = Math.min(ROOM_SPEED * dt, length);
    moving = length > 0.001 && step > 0;
    if (!moving) {
      insideGoal = undefined;
      return;
    }
    if (Math.abs(dx) > 0.001) insideFacing = Math.sign(dx);
    const walked = stepInRoom(inside, (dx / length) * step, (dy / length) * step);
    inside = walked.at;
    if (walked.out || (insideGoal?.out && step >= length)) {
      insideGoal = undefined;
      options.onLeave();
    }
  };

  /** Shows the tag over the plot under the mouse, or the one the player stands at. */
  const showTag = (zoom: number, centre: Tile) => {
    const plot = visiting ? undefined : (hovered ?? near);
    const target = plot && targets.find((t) => t.plot === plot);
    if (!plot || !target) {
      tagged = undefined;
      tag.classList.remove('shown');
      return;
    }
    if (plot !== tagged) {
      tagged = plot;
      const text = tagText(plot, squareOf(plot));
      tag.querySelector('.tag-name')!.textContent = text.name;
      tag.querySelector('.tag-owner')!.textContent = text.owner;
      tag.querySelector('.tag-line')!.textContent = text.line;
      tag.querySelector('.tag-hint')!.textContent = text.hint;
      tag.dataset.plot = `${plot.kind}:${plot.id ?? plot.number}`;
    }
    tag.classList.add('shown');
    const width = frame.clientWidth;
    const height = frame.clientHeight;
    const { box } = target;
    const anchor = worldToScreen({ x: box.x + box.w / 2, y: box.y }, width, height, centre, zoom);
    const feet = worldToScreen(toScreen(player), width, height, centre, zoom);
    const body = { x: feet.x - 24 * zoom, y: feet.y - 90 * zoom, w: 48 * zoom, h: 96 * zoom };
    const at = placeTag(anchor, { w: tag.offsetWidth, h: tag.offsetHeight }, body, {
      w: width,
      h: height,
    });
    tag.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(at.y)}px)`;
  };

  /** Where the camera's centre goes for a framing, at a zoom. */
  const centreFor = (wanted: Framing, at: number) =>
    frameCentre(bounds, frame.clientWidth, frame.clientHeight, at, {
      x: wanted.target.x,
      y: wanted.target.y - LOOK_UP,
    });

  const render = (time: number) => {
    const started = performance.now();
    const dt = last === undefined ? 0 : Math.min(0.1, (time - last) / 1000);
    last = time;
    // Decoration stands still for anyone who'd rather nothing moved.
    const still = reduced.matches;
    const motion = still ? 0 : time;
    walk(dt);
    showPrompt();

    const width = frame.clientWidth;
    const height = frame.clientHeight;
    // The camera comes in a little while the player walks, and eases back out once they stop.
    if (moving) movedAt = time;
    walking = moving
      ? Math.min(1, walking + dt * 1.2)
      : time - movedAt > SETTLE
        ? Math.max(0, walking - dt * 0.5)
        : walking;
    // Halfway through the fade, the view goes in or out.
    if (still || time - fading >= FADE / 2) entered = visiting;
    const dark = still ? 0 : fadeAt(time - fading);
    if (entered) {
      drawInside(entered, width, height, time, dark);
      frameId = requestAnimationFrame(render);
      return;
    }
    if (canvas.dataset.room) {
      delete canvas.dataset.room;
      delete canvas.dataset.stage;
    }
    const wanted = want();
    if (!camera || still) {
      zoom = wanted.zoom;
      // On a phone the camera opens on the town square, then finds the player.
      camera =
        isPhone(width) && !still
          ? centreFor({ ...wanted, target: toScreen({ x: 0, y: 0 }) }, zoom)
          : centreFor(wanted, zoom);
    } else {
      const ease = Math.min(1, dt * 4);
      zoom += (wanted.zoom - zoom) * ease;
      const goal = centreFor(wanted, zoom);
      camera = {
        x: camera.x + (goal.x - camera.x) * ease,
        y: camera.y + (goal.y - camera.y) * ease,
      };
    }
    const view = {
      x: camera.x - width / 2 / zoom,
      y: camera.y - height / 2 / zoom,
      w: width / zoom,
      h: height / zoom,
    };
    const placed = `${Math.round(camera.x)},${Math.round(camera.y)},${zoom.toFixed(4)}`;
    if (canvas.dataset.camera !== placed) canvas.dataset.camera = placed;

    // The sky, the northern lights, the clouds and the mountains, and the dusk deepening over them.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(sky.canvas, 0, 0);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawAurora(ctx, width, motion);
    drawClouds(ctx, width, height, motion);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(mountains.canvas, 0, 0);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalAlpha = 0.3 * duskAt(motion);
    ctx.fillStyle = colors.night;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;

    const k = scale * zoom;
    ctx.setTransform(
      k,
      0,
      0,
      k,
      (width / 2 - camera.x * zoom) * scale,
      (height / 2 - camera.y * zoom) * scale,
    );
    ctx.drawImage(ground.canvas, groundBox.x, groundBox.y, groundBox.w, groundBox.h);
    drawRipples(ctx, world, motion);
    drawLightPools(ctx, world, motion);
    // The footprints left walking to claim a plot, fading as they fill with snow.
    const now = performance.now();
    footprints = footprints.filter((step) => now - step.time < FOOTPRINT_TIME);
    for (const step of footprints) {
      const { x, y } = toScreen(step.at);
      ctx.globalAlpha = 0.6 * (1 - (now - step.time) / FOOTPRINT_TIME);
      ctx.fillStyle = colors.snowShade;
      ctx.beginPath();
      ctx.ellipse(x + (step.side ? 5 : -5), y, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawStringLights(ctx, island, false, motion);

    const shown = (box: Box) => {
      const { x, y } = middle(box);
      return (
        x > view.x - 200 &&
        x < view.x + view.w + 200 &&
        y > view.y - 60 &&
        y < view.y + view.h + 320
      );
    };

    // Everything standing, drawn back to front by its footprint, so what's in front hides what's behind.
    const scene: { depth: number; draw: () => void }[] = [];
    const add = (depth: number, draw: () => void) => scene.push({ depth, draw });
    for (const thing of world.things) {
      if (!shown(thing)) continue;
      if (thing.kind === 'drift') drawThing(ctx, thing, motion);
      else add(thing.x + thing.w + thing.y + thing.h - 2, () => drawThing(ctx, thing, motion));
    }
    // The pointer, in world pixels, and the square in front under it: only that square gets it.
    const pressed = pointer.now();
    const aimed = pressed && screenToWorld(pressed, width, height, camera, zoom);
    const under = aimed && plotUnder(aimed);
    const pointedAt = under && squareOf(under);
    let pointed = '';
    targets = [];
    const paint = (square: NorthPoleSquare, mapping: Mapping) => {
      const { origin, u, v } = mapping;
      // The square draws at the resolution its face shows at, so its drawing stays sharp,
      // and the face's own angles map it onto the world.
      const size = Math.max(16, Math.min(512, Math.round(Math.hypot(u.x, u.y) * k)));
      const inside = square === pointedAt && aimed ? onMapping(aimed, mapping, size) : undefined;
      if (inside) pointed = `${under!.kind}:${square.id}`;
      ctx.save();
      ctx.transform(u.x / size, u.y / size, v.x / size, v.y / size, origin.x, origin.y);
      drawSquare(
        ctx,
        scratch,
        square,
        0,
        0,
        size,
        time,
        inside && { ...inside, down: pressed!.down },
      );
      ctx.restore();
    };
    for (const plot of world.plots) {
      if (!shown(plot)) continue;
      add(plot.x + plot.w + plot.y + plot.h - 2, () => {
        const glowFor =
          plot === focused && focusedAt !== undefined
            ? Math.min(1, (HIGHLIGHT_TIME - (time - focusedAt)) / HIGHLIGHT_FADE)
            : 0;
        const strength = Math.max(plot === near ? 0.7 : 0, glowFor);
        if (strength > 0) drawPlotGlow(ctx, plot, strength);
        const bounce = plot === near || plot === claiming;
        const box = drawPlot(ctx, plot, squareOf(plot), paint, motion, bounce);
        targets.push({ plot, box });
      });
    }
    world.strolls.forEach((stroll, n) => {
      const at = strollAt(stroll, still ? 0 : time);
      add(at.x + at.y, () => drawPerson(ctx, at, LOOKS[n % LOOKS.length], at.facing, !still, time));
    });
    const { pond, paddock } = world;
    for (let n = 0; n < 3; n++) {
      const turn = motion / (2600 + n * 500) + n * 2.1;
      const at = {
        x: pond.x + (pond.w - 1) / 2 + Math.cos(turn) * (pond.w / 2 - 1),
        y: pond.y + (pond.h - 1) / 2 + Math.sin(turn) * (pond.h / 2 - 0.9),
      };
      add(at.x + at.y, () =>
        drawPerson(ctx, at, LOOKS[(n + 1) % LOOKS.length], Math.sin(turn) < 0 ? 1 : -1, false, 0),
      );
    }
    for (let n = 0; n < 3; n++) {
      const wander = motion / (6000 + n * 1300) + n * 2;
      const at = {
        x: paddock.x + ((paddock.w - 1) * (1 + Math.sin(wander))) / 2,
        y: paddock.y + ((paddock.h - 1) * (1 + Math.sin(wander * 1.7 + n))) / 2,
      };
      add(at.x + at.y, () =>
        drawReindeer(ctx, at, Math.cos(wander) >= 0 ? 1 : -1, n === 0, motion),
      );
    }
    add(player.x + player.y, () => {
      drawPerson(ctx, player, PLAYER, facing, moving, time);
      // A marker over the player's head, so they can find themselves, bigger when the camera is far.
      const { x, y } = toScreen(player);
      const bob = still ? 0 : Math.sin(time / 300) * 3;
      const big = Math.max(1, 0.6 / zoom);
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.moveTo(x - 6 * big, y - 72 - 10 * big + bob);
      ctx.lineTo(x + 6 * big, y - 72 - 10 * big + bob);
      ctx.lineTo(x, y - 72 + bob);
      ctx.fill();
    });
    scene.sort((a, b) => a.depth - b.depth);
    for (const item of scene) item.draw();
    if (focused) focusedAt ??= time;
    // Which square has the pointer, for the smoke test.
    if (canvas.dataset.pointer !== pointed) canvas.dataset.pointer = pointed;

    ctx.drawImage(front.canvas, groundBox.x, groundBox.y, groundBox.w, groundBox.h);
    drawStringLights(ctx, island, true, motion);

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (!still) drawSnowfall(ctx, width, height, time);
    darken(dark, width, height);
    showTag(zoom, camera);

    // How long the map took to draw this frame, for the smoke test's budget.
    timeFrame(started);
    frameId = requestAnimationFrame(render);
  };

  /** The fade's black over the view. */
  const darken = (dark: number, width: number, height: number) => {
    if (dark <= 0) return;
    ctx.globalAlpha = dark;
    ctx.fillStyle = colors.night;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  };

  /**
   * Draws the room the player is inside: its walls and sign, the square's own
   * drawing large on the back wall, and the player. The map says where the
   * stage is, in the canvas's pixels, for the smoke test to read it.
   */
  const drawInside = (plot: Plot, width: number, height: number, time: number, dark: number) => {
    const started = performance.now();
    const square = squareOf(plot)!;
    const room = roomLayout(roomArea(width, height));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawRoom(ctx, room, width, height, square.name, plot.kind === 'booth' ? `@${plot.id}` : '');
    const { stage } = room;
    // The stage is the square's drawing scaled, so the pointer scales with it.
    const pressed = pointer.now();
    const onStage = pressed && onRect(pressed, stage, VISIT_SIZE);
    const pointed = onStage ? `${plot.kind}:${plot.id}` : '';
    if (canvas.dataset.pointer !== pointed) canvas.dataset.pointer = pointed;
    ctx.save();
    ctx.translate(stage.x, stage.y);
    ctx.scale(stage.w / VISIT_SIZE, stage.h / VISIT_SIZE);
    drawSquare(
      ctx,
      scratch,
      square,
      0,
      0,
      VISIT_SIZE,
      time,
      onStage && { ...onStage, down: pressed!.down },
    );
    ctx.restore();
    drawRoomPerson(ctx, room, inside, PLAYER, insideFacing, moving, time);
    darken(dark, width, height);
    const at = [stage.x, stage.y, stage.w, stage.h].map((n) => Math.round(n * scale)).join(',');
    if (canvas.dataset.stage !== at) canvas.dataset.stage = at;
    const place = `${inside.x.toFixed(2)},${inside.y.toFixed(2)}`;
    if (canvas.dataset.room !== place) canvas.dataset.room = place;
    timeFrame(started);
  };

  /** Notes how long a frame took to draw, for the smoke test's budget. */
  const timeFrame = (started: number) => {
    const spent = performance.now() - started;
    if (++frames > WARM_UP_FRAMES) {
      slowest = Math.max(slowest, spent);
      recent.push(spent);
      if (recent.length > 60) recent.shift();
      if (frames % 15 === 0) {
        canvas.dataset.frameMs = (recent.reduce((a, b) => a + b, 0) / recent.length).toFixed(2);
        canvas.dataset.slowestFrameMs = slowest.toFixed(2);
      }
    }
  };

  /** Where a click landed, in world pixels. */
  const pointAt = (event: MouseEvent): Tile => {
    const box = canvas.getBoundingClientRect();
    const centre = camera ?? toScreen(player);
    return screenToWorld(
      { x: event.clientX - box.left, y: event.clientY - box.top },
      box.width,
      box.height,
      centre,
      zoom || 1,
    );
  };

  const plotUnder = (point: Tile) => targetAt(targets, point)?.plot;

  /** Walks the player to the first of `goals` they can reach. */
  const walkToward = (goals: Tile[]) => {
    // The walk starts by stepping to the middle of the player's own tile, so it
    // keeps clear of whatever is beside them, the way the keys do.
    const from = tileOf(player);
    const way = findPathToFirst(world, from, goals);
    if (way) path = [from, ...way];
  };

  const onClick = (event: MouseEvent) => {
    const box = canvas.getBoundingClientRect();
    // A drag is the square's to play with, not a click.
    if (!pointer.tapped({ x: event.clientX - box.left, y: event.clientY - box.top })) return;
    if (visiting) {
      // Inside, a click walks the player there, or out through the doorway.
      const room = roomLayout(roomArea(box.width, box.height));
      const goal = clickInRoom(room, { x: event.clientX - box.left, y: event.clientY - box.top });
      if (goal) insideGoal = goal;
      return;
    }
    const point = pointAt(event);
    const plot = plotUnder(point);
    // On a touch screen the first tap on a structure shows its tag, and the second opens it.
    const touch = (event as PointerEvent).pointerType === 'touch';
    if (plot && touch && hovered !== plot) {
      hovered = plot;
      return;
    }
    if (plot) return open(plot);
    hovered = undefined;
    // Walk to the tile clicked, or the nearest one beside it you can stand on.
    const tile = tileOf(toTile(point));
    const goals: Tile[] = [];
    for (let ring = 0; ring <= 2; ring++)
      for (let dx = -ring; dx <= ring; dx++)
        for (let dy = -ring; dy <= ring; dy++)
          if (Math.max(Math.abs(dx), Math.abs(dy)) === ring)
            goals.push({ x: tile.x + dx, y: tile.y + dy });
    walkToward(goals);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    hovered = visiting ? undefined : plotUnder(pointAt(event));
    canvas.style.cursor = hovered ? 'pointer' : 'default';
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') hovered = undefined;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (typing(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    const name = event.key.toLowerCase();
    if (name in KEYS) {
      held.add(name);
      event.preventDefault();
    } else if (
      (name === 'e' || (name === 'enter' && !pressable(event.target))) &&
      near &&
      !visiting
    ) {
      event.preventDefault();
      open(near);
    }
  };
  const onKeyUp = (event: KeyboardEvent) => held.delete(event.key.toLowerCase());
  const onBlur = () => held.clear();
  const onPrompt = () => near && !visiting && open(near);

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  prompt.addEventListener('click', onPrompt);
  frameId = requestAnimationFrame(render);

  return {
    stop() {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      tag.remove();
      delete frame.dataset.visiting;
      prompt.removeEventListener('click', onPrompt);
      pointer.stop();
    },
    walkTo(kind, id) {
      if (visiting) options.onLeave();
      const plot = world.plots.find((p) => p.kind === kind && p.id === id);
      if (plot) walkToward([plot.door]);
    },
    jumpTo(kind, id) {
      const plot = world.plots.find((p) => p.kind === kind && p.id === id);
      if (!plot) return;
      if (visiting) options.onLeave();
      player = { ...plot.door };
      path = [];
      overview = false;
      // The camera comes in on the square, and eases back out a little later, as after a walk.
      walking = 1;
      movedAt = performance.now();
      focused = plot;
      focusedAt = undefined;
    },
    walkToOpenPlot() {
      if (visiting) options.onLeave();
      const way = nearestOpenPlot(world, player);
      if (way) path = way.path;
    },
    claimNextDoor() {
      const way = nearestOpenPlot(world, player);
      if (!way) return;
      path = way.path;
      claiming = way.plot;
      footprints = [];
    },
    visit(kind, id) {
      const plot = world.plots.find((p) => p.kind === kind && p.id === id);
      if (!plot) return false;
      if (visiting === plot) return true;
      // The player goes in at the door, and whatever walk they were on ends there.
      if (plotAtDoor(world, player) !== plot) player = { ...plot.door };
      path = [];
      claiming = undefined;
      held.clear();
      overview = false;
      if (!visiting) fading = performance.now();
      visiting = plot;
      inside = { ...ENTRANCE };
      insideGoal = undefined;
      insideFacing = 1;
      hovered = undefined;
      frame.dataset.visiting = `${kind}:${id}`;
      return true;
    },
    leave() {
      if (!visiting) return;
      // Out just in front of the door, facing out, with the camera where it was.
      player = { ...visiting.door };
      path = [];
      facing = Math.sign(faceOf(visiting).out.x) || 1;
      visiting = undefined;
      held.clear();
      fading = performance.now();
      delete frame.dataset.visiting;
    },
    get visiting() {
      return visiting && { kind: visiting.kind as SquareKind, id: visiting.id! };
    },
    toggleOverview() {
      overview = !overview;
      return overview;
    },
    get overview() {
      return overview;
    },
  };
}
