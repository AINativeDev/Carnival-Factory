import { boothPlotFiles } from './booths';
import { CLAIM_URL, REPO_URL } from './links';
import pinned from './plots.json';
import { landedBooths, STAGE_TEXT, type PendingBooth } from './plots';
import {
  dragCentre,
  duskAt,
  fitZoom,
  frameCentre,
  framing,
  islandBounds,
  islandCorners,
  isPhone,
  pinchCentre,
  pinchZoom,
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
  drawPlatform,
  drawPlotGlow,
  drawReindeer,
  drawRipples,
  drawSelectionBeam,
  drawSelectionRing,
  drawSky,
  drawSite,
  drawSnowfall,
  drawSparkles,
  drawStringLights,
  drawUpdateSign,
  drawThing,
  faceOf,
  middle,
  setSpriteResolution,
  SPARKLE_TIME,
  type Look,
  type Mapping,
  type Owner,
} from './render';
import {
  arrowBounce,
  avatarPath,
  highlightAt,
  inviteFor,
  inviteOpacity,
  ownerColor,
} from './owners';
import { isTap, onMapping, onRect } from './pointer';
import type { NorthPoleSquare, SquarePointer } from './square';
import type { MapControls, MapOptions, SquareKind } from './map-options';

// The page's entry point and the Booths panel name these here, beside startMap.
export type { MapControls, SquareKind, StationEntry } from './map-options';
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
import { dressRoom } from './room-dressing';
import { nearestOpenPlot, nearYou, placeTag, platformTag, tagText, targetAt } from './visit';
import {
  buildWorld,
  findPathToFirst,
  moveBy,
  nearestStand,
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
  type World,
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

/** Where the player stood when they last opened a square, in each world, so coming back puts them there. */
const remembered = new Map<string, Tile>();

/** How fast the player walks, in tiles a second. */
const SPEED = 4.5;
/** The size a square draws at on the back wall of its room, in pixels. */
const VISIT_SIZE = 480;
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

/** Opens a link in a new tab: the Claim your booth form by default. */
function claim(href = CLAIM_URL) {
  const link = document.createElement('a');
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  link.click();
}

/** How long a press shows as `down`, at least, so a quick tap still reaches the square. */
const PRESS_SHOWN = 150;

/**
 * Follows the mouse or a finger over `element`: where it is, in CSS pixels
 * from the element's top-left, whether it's pressed, how many presses began
 * since the last frame, and whether the last press was a click or a drag. A quick tap stays pressed for `PRESS_SHOWN`, and
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
  /** Presses begun since `now` last took them. */
  let presses = 0;
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
    presses += 1;
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
    /**
     * Where the pointer is now, whether it's pressed and the presses begun
     * since the last call, or undefined when it's off the element. Call it
     * once a frame.
     */
    now(): { x: number; y: number; down: boolean; presses: number } | undefined {
      const time = performance.now();
      const fresh = presses;
      presses = 0;
      if (!at || time > goneAt) return undefined;
      return { x: at.x, y: at.y, down: held || time - pressedAt < PRESS_SHOWN, presses: fresh };
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
  /** The booth requests being built, by login, and the booths they change. */
  let pending = new Map<string, PendingBooth>();
  let world!: World;
  /** The world's layout, so the island is only redrawn when a plot changes. */
  let layout = '';
  const build = (list: readonly PendingBooth[]) => {
    pending = new Map(list.map((entry) => [entry.login, entry]));
    const made =
      options.level?.world ??
      buildWorld(
        options.attractions.map((square) => square.id),
        options.booths.map((square) => square.id),
        pinned,
        { files: boothPlotFiles, pending: list, levels: options.levels?.map((l) => l.login) },
      );
    const plan = made.plots.map((plot) => `${plot.kind}:${plot.id ?? ''}:${plot.number}`).join();
    if (plan === layout) return false;
    layout = plan;
    world = made;
    return true;
  };
  build(options.pending ?? []);
  const squareOf = (plot: Plot) =>
    plot.kind === 'attraction' || plot.kind === 'booth' ? byId[plot.kind].get(plot.id!) : undefined;
  /** Which world this is, for where the player stood in it: the North Pole, or a level's owner. */
  const place = options.level?.id ?? '';
  const stations = new Map((options.levels ?? []).map((entry) => [entry.login, entry]));
  /** What a sleigh platform's sign says: the level it goes to, or, inside a level, the way home. */
  const platformLabel = (plot: Plot) => {
    if (plot.kind === 'exit')
      return {
        name: 'The North Pole',
        by: 'Sleigh home',
        color: options.level?.tint ?? colors.gold,
        closed: false,
      };
    const entry = stations.get(plot.id!);
    return {
      name: entry?.name ?? plot.id!,
      by: entry?.owner ?? `@${plot.id}`,
      color: entry?.color ?? colors.gold,
      closed: entry?.closed ?? true,
    };
  };
  /** What a construction site's sign says. */
  const siteLabel = (plot: Plot) => {
    const entry = pending.get(plot.id!);
    return { login: plot.id!, stage: entry ? STAGE_TEXT[entry.stage] : STAGE_TEXT.building };
  };
  /** The booths that just landed on their construction site's plot, and when their sparkles began. */
  const boothIds = new Set(options.booths.map((square) => square.id));
  const landed = new Map<string, number | undefined>(
    landedBooths(options.wereSites ?? [], boothIds).map((login) => [login, undefined]),
  );
  const plotOf = (kind: SquareKind, id: string) =>
    world.plots.find((plot) => plot.kind === kind && plot.id === id);
  /** The picked plot, when its highlight began, and whether the player is walking there on a trail. */
  let selected = options.focus ? plotOf(options.focus.kind, options.focus.id) : undefined;
  let selectedAt: number | undefined;
  let trailing = false;
  let me = options.me;
  /** Avatars by login: loading, loaded, or failed, which draws the elf. */
  const avatars = new Map<string, HTMLImageElement | undefined>();
  const avatarOf = (login: string) => {
    if (!options.avatars?.has(login)) return undefined;
    if (!avatars.has(login)) {
      const image = new Image();
      image.decoding = 'async';
      image.addEventListener('error', () => avatars.set(login, undefined));
      image.src = avatarPath(login);
      avatars.set(login, image);
    }
    const image = avatars.get(login);
    return image?.complete && image.naturalWidth > 0 ? image : undefined;
  };
  const ownerOf = (plot: Plot): Owner | undefined =>
    plot.kind === 'booth'
      ? { color: ownerColor(plot.id!), avatar: avatarOf(plot.id!), you: plot.id === me }
      : undefined;
  /** The plot the call to action invites into, and when it started to. */
  let invited: Plot | undefined;
  let invitedAt = 0;
  const touchScreen = window.matchMedia('(pointer: coarse)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let island = islandCorners(world);
  let bounds = islandBounds(world);

  let player: Tile = selected
    ? { ...selected.door }
    : (remembered.get(place) ?? { ...world.start });
  let path: Tile[] = [];
  let facing = 1;
  let moving = false;
  let camera: Tile | undefined;
  let zoom = 0;
  /** How far the camera has come in for the walk, from 0 to 1, and when the player last moved. */
  let walking = 0;
  let movedAt = -Infinity;
  let overview = false;
  /**
   * Where a finger dragged the camera, which it stays at until the player
   * walks or goes to a square, and the finger dragging it now: where it was
   * last, once it has moved too far to be a tap.
   */
  let panned: Tile | undefined;
  let dragging: { id: number; from: Tile; moved: boolean } | undefined;
  /**
   * The fingers on the map, two of which pinch the camera nearer or farther:
   * how far apart they were last and the point between them. `closer` is how
   * much nearer than its own framing they left the camera, until the overview
   * goes on or off.
   */
  const fingers = new Map<number, Tile>();
  let pinching: { apart: number; between: Tile } | undefined;
  let closer = 1;
  let near: Plot | undefined;
  let scale = 1;
  let last: number | undefined;
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
  const boxOf = (): Box => ({
    x: island.left.x - 8,
    y: island.top.y - 40,
    w: island.right.x - island.left.x + 16,
    h: island.bottom.y + SLAB + 80 - (island.top.y - 40),
  });
  let groundBox = boxOf();

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
    if (plot.kind === 'site') {
      const entry = pending.get(plot.id!);
      return claim(entry ? `${REPO_URL}/issues/${entry.issue}` : CLAIM_URL);
    }
    remembered.set(place, { ...player });
    if (plot.kind === 'exit') return options.onTravel?.(undefined);
    if (plot.kind === 'platform') {
      if (!platformLabel(plot).closed) options.onTravel?.(plot.id);
      return;
    }
    options.onOpen(plot.kind, plot.id!);
  };

  /** Picks a plot, or lets go of the one picked, and tells the page. */
  const select = (plot: Plot | undefined) => {
    if (plot === selected) return;
    selected = plot;
    selectedAt = undefined;
    trailing = false;
    options.onSelect?.(plot && { kind: plot.kind as SquareKind, id: plot.id! });
  };

  /**
   * The call to action over a door: "Visit <name>" with its key, or "Claim
   * this plot", for the picked square if there is one, otherwise the one the
   * player stands at. It fades in after a moment, so walking past doesn't
   * flicker it, and sits above the square, its arrow pointing down at it.
   */
  const showPrompt = (time: number, zoom: number, centre: Tile) => {
    const plot = visiting ? undefined : inviteFor(selected, near);
    if (plot !== invited) {
      invited = plot;
      invitedAt = time;
    }
    // Its words follow the square's name, which arrives once its frame has opened.
    const words = !plot
      ? ''
      : plot.kind === 'open'
        ? 'Claim this plot'
        : plot.kind === 'site'
          ? `Being built for @${plot.id}: ${siteLabel(plot).stage}`
          : plot.kind === 'exit'
            ? 'Take the sleigh back to the North Pole'
            : plot.kind === 'platform'
              ? platformLabel(plot).closed
                ? `${platformLabel(plot).name} is closed for repairs`
                : `Take the sleigh to ${platformLabel(plot).name}`
              : `Visit ${squareOf(plot)?.name ?? plot.id ?? ''}`;
    if (plot && prompt.title !== words) {
      const text = document.createElement('span');
      text.className = 'prompt-text';
      text.textContent = words;
      const key = document.createElement('kbd');
      key.textContent = touchScreen.matches ? 'Tap' : 'E';
      prompt.replaceChildren(text, ' ', key);
      prompt.title = words;
    }
    if (plot) prompt.dataset.plot = `${plot.kind}:${plot.id ?? plot.number}`;
    prompt.hidden = !plot;
    const target = plot && targets.find((t) => t.plot === plot);
    if (plot && target) {
      const width = frame.clientWidth;
      const height = frame.clientHeight;
      const top = target.box.y - 40;
      const anchor = worldToScreen({ x: middle(plot).x, y: top }, width, height, centre, zoom);
      const w = prompt.offsetWidth;
      const h = prompt.offsetHeight;
      const x = Math.max(8, Math.min(width - w - 8, anchor.x - w / 2));
      const y = Math.max(8, Math.min(height - h - 8, anchor.y - h));
      prompt.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
      prompt.style.opacity = `${inviteOpacity(time - invitedAt)}`;
    } else if (plot) {
      prompt.style.opacity = '0';
    }
    const at = `${Math.round(player.x)},${Math.round(player.y)}`;
    if (canvas.dataset.player !== at) canvas.dataset.player = at;
    const nearBy = near ? `${near.kind}:${near.id ?? near.number}` : '';
    if (canvas.dataset.near !== nearBy) canvas.dataset.near = nearBy;
    const picked = selected ? `${selected.kind}:${selected.id}` : '';
    if (canvas.dataset.selected !== picked) canvas.dataset.selected = picked;
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
    // The trail ends once the player arrives at the picked square's door.
    if (trailing && !path.length) trailing = false;
    if (claiming || trailing) {
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
    // The call to action already names the square it invites into.
    if (plot && plot === inviteFor(selected, near) && !hovered) {
      tagged = undefined;
      tag.classList.remove('shown');
      return;
    }
    const target = plot && targets.find((t) => t.plot === plot);
    if (!plot || !target) {
      tagged = undefined;
      tag.classList.remove('shown');
      return;
    }
    if (plot !== tagged) {
      tagged = plot;
      const text =
        plot.kind === 'platform' || plot.kind === 'exit'
          ? platformTag(plot.kind, platformLabel(plot))
          : tagText(plot, squareOf(plot), siteLabel(plot).stage);
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
      showPrompt(time, zoom, camera ?? toScreen(player));
      drawInside(entered, width, height, time, dark);
      frameId = requestAnimationFrame(render);
      return;
    }
    if (canvas.dataset.room) {
      delete canvas.dataset.room;
      delete canvas.dataset.stage;
    }
    const framed = want();
    // Two fingers may have pinched the camera nearer or farther, though never past the whole island.
    const wanted = {
      ...framed,
      zoom: Math.max(fitZoom(bounds, width, height), framed.zoom * closer),
    };
    // A walk takes the camera back from where a finger left it, as the overview going on or off does.
    if (moving) panned = undefined;
    if (!camera || still) {
      zoom = wanted.zoom;
      // On a phone the camera opens on the town square, then finds the player.
      camera = panned
        ? frameCentre(bounds, width, height, zoom, panned)
        : isPhone(width) && !still
          ? centreFor({ ...wanted, target: toScreen({ x: 0, y: 0 }) }, zoom)
          : centreFor(wanted, zoom);
    } else {
      const ease = Math.min(1, dt * 4);
      zoom += (wanted.zoom - zoom) * ease;
      const goal = panned
        ? frameCentre(bounds, width, height, zoom, panned)
        : centreFor(wanted, zoom);
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
    // A level's sky takes on its theme's colour.
    if (options.level) {
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = options.level.tint;
      ctx.fillRect(0, 0, width, height);
    }
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
    // On a walk to a picked square, the way ahead shows as faint footprints until the player arrives.
    if (trailing) {
      ctx.fillStyle = colors.snowShade;
      ctx.globalAlpha = 0.45;
      path.forEach((tile, n) => {
        const { x, y } = toScreen(tile);
        ctx.beginPath();
        ctx.ellipse(x + (n % 2 ? 5 : -5), y, 4, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
      });
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
        inside && { ...inside, down: pressed!.down, presses: pressed!.presses },
      );
      ctx.restore();
    };
    if (selected) selectedAt ??= time;
    const picked = selectedAt === undefined ? 0 : highlightAt(time - selectedAt);
    for (const plot of world.plots) {
      if (!shown(plot)) continue;
      add(plot.x + plot.w + plot.y + plot.h - 2, () => {
        const highlight = plot === selected ? picked : 0;
        const owner = ownerOf(plot);
        const strength = Math.max(plot === near ? 0.7 : 0, owner?.you ? 0.45 : 0, highlight);
        if (strength > 0) drawPlotGlow(ctx, plot, strength);
        drawSelectionRing(ctx, plot, highlight);
        const bounce = plot === near || plot === claiming;
        const box =
          plot.kind === 'site'
            ? drawSite(ctx, plot, siteLabel(plot), motion, plot === near)
            : plot.kind === 'platform' || plot.kind === 'exit'
              ? drawPlatform(ctx, plot, platformLabel(plot), motion, plot === near)
              : drawPlot(ctx, plot, squareOf(plot), paint, motion, bounce, owner);
        if (plot.kind === 'booth' && pending.has(plot.id!)) drawUpdateSign(ctx, plot);
        if (plot.kind === 'booth' && landed.has(plot.id!)) {
          // The booth that replaced its construction site sparkles once, the first time it's in view.
          const began = landed.get(plot.id!) ?? time;
          landed.set(plot.id!, began);
          if (still || time - began >= SPARKLE_TIME) landed.delete(plot.id!);
          else drawSparkles(ctx, plot, time - began);
        }
        targets.push({ plot, box });
      });
    }
    world.strolls.forEach((stroll, n) => {
      const at = strollAt(stroll, still ? 0 : time);
      add(at.x + at.y, () => drawPerson(ctx, at, LOOKS[n % LOOKS.length], at.facing, !still, time));
    });
    const { pond, paddock } = world;
    // A level may have no pond, and has no paddock.
    for (let n = 0; n < (pond.w ? 3 : 0); n++) {
      const turn = motion / (2600 + n * 500) + n * 2.1;
      const at = {
        x: pond.x + (pond.w - 1) / 2 + Math.cos(turn) * (pond.w / 2 - 1),
        y: pond.y + (pond.h - 1) / 2 + Math.sin(turn) * (pond.h / 2 - 0.9),
      };
      add(at.x + at.y, () =>
        drawPerson(ctx, at, LOOKS[(n + 1) % LOOKS.length], Math.sin(turn) < 0 ? 1 : -1, false, 0),
      );
    }
    for (let n = 0; n < (paddock.w ? 3 : 0); n++) {
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
    // The picked square's beam and arrow, over whatever stands in front of it.
    const pickedTarget = selected && targets.find((t) => t.plot === selected);
    if (pickedTarget && picked > 0)
      drawSelectionBeam(ctx, selected!, pickedTarget.box.y, picked, arrowBounce(time, still));
    // Which square has the pointer, for the smoke test.
    if (canvas.dataset.pointer !== pointed) canvas.dataset.pointer = pointed;

    ctx.drawImage(front.canvas, groundBox.x, groundBox.y, groundBox.w, groundBox.h);
    drawStringLights(ctx, island, true, motion);

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    if (!still) drawSnowfall(ctx, width, height, time);
    if (trailing && selected)
      drawEdgeArrow(worldToScreen(middle(selected), width, height, camera, zoom), width, height);
    darken(dark, width, height);
    showTag(zoom, camera);
    showPrompt(time, zoom, camera);

    // How long the map took to draw this frame, for the smoke test's budget.
    timeFrame(started);
    frameId = requestAnimationFrame(render);
  };

  /** An arrow at the edge of the screen pointing toward `at`, a point in screen pixels, when it's off screen. */
  const drawEdgeArrow = (at: Tile, width: number, height: number) => {
    const margin = 28;
    if (at.x > margin && at.x < width - margin && at.y > margin && at.y < height - margin) return;
    const cx = width / 2;
    const cy = height / 2;
    const angle = Math.atan2(at.y - cy, at.x - cx);
    // Where the line from the middle toward the square leaves the screen, kept inside the margin.
    const reach = Math.min(
      Math.abs((width / 2 - margin) / (Math.cos(angle) || 1e-6)),
      Math.abs((height / 2 - margin) / (Math.sin(angle) || 1e-6)),
    );
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * reach, cy + Math.sin(angle) * reach);
    ctx.rotate(angle);
    ctx.fillStyle = colors.cocoa;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(-10, -13);
    ctx.lineTo(-10, 13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = colors.gold;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(-7, -9);
    ctx.lineTo(-7, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /** The fade's black over the view. */
  const darken = (dark: number, width: number, height: number) => {
    if (dark <= 0) return;
    ctx.globalAlpha = dark;
    ctx.fillStyle = colors.night;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  };

  /** The room the player is inside, dressed as its own, with the square's drawing on the stage. */
  const drawInside = (plot: Plot, width: number, height: number, time: number, dark: number) => {
    const started = performance.now();
    const square = squareOf(plot)!;
    const room = roomLayout(roomArea(width, height));
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawRoom(
      ctx,
      room,
      width,
      height,
      square.name,
      plot.kind === 'booth' ? `by @${plot.id}` : '',
      plot.kind === 'booth' ? avatarOf(plot.id!) : undefined,
    );
    dressRoom(ctx, room, square, plot, time);
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
      onStage && { ...onStage, down: pressed!.down, presses: pressed!.presses },
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

  /** How far apart the first two fingers on the map are, and the point between them. */
  const pinchOf = () => {
    const [a, b] = [...fingers.values()];
    return {
      apart: Math.hypot(b.x - a.x, b.y - a.y),
      between: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  };

  /**
   * On a touch screen a finger drags the map round, two fingers pinch it
   * nearer or farther, and a tap still walks or opens.
   */
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType !== 'touch' || visiting) return;
    const box = canvas.getBoundingClientRect();
    const at = { x: event.clientX - box.left, y: event.clientY - box.top };
    fingers.set(event.pointerId, at);
    // The drag, or the pinch, goes on when a finger slides off the map.
    canvas.setPointerCapture(event.pointerId);
    if (fingers.size === 2) {
      dragging = undefined;
      pinching = pinchOf();
    } else if (fingers.size === 1) {
      dragging = { id: event.pointerId, from: at, moved: false };
    }
  };
  const onPointerEnd = (event: PointerEvent) => {
    fingers.delete(event.pointerId);
    // With a finger of the pair gone, the pinch goes on from the two fingers left.
    pinching = fingers.size < 2 ? undefined : pinchOf();
    if (dragging?.id === event.pointerId) dragging = undefined;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') {
      if (!fingers.has(event.pointerId) || visiting || !camera) return;
      const box = canvas.getBoundingClientRect();
      const to = { x: event.clientX - box.left, y: event.clientY - box.top };
      fingers.set(event.pointerId, to);
      if (pinching) {
        // The camera follows the fingers at once, without easing.
        const next = pinchOf();
        const nearer = pinchZoom(
          zoom,
          pinching.apart,
          next.apart,
          fitZoom(bounds, box.width, box.height),
        );
        camera = panned = pinchCentre(
          bounds,
          box.width,
          box.height,
          zoom,
          nearer,
          camera,
          pinching.between,
          next.between,
        );
        zoom = nearer;
        closer = nearer / want().zoom;
        pinching = next;
        return;
      }
      if (dragging?.id !== event.pointerId) return;
      if (!dragging.moved && isTap(dragging.from, to)) return;
      dragging.moved = true;
      // The camera follows the finger at once, without easing.
      camera = panned = dragCentre(bounds, box.width, box.height, zoom, camera, dragging.from, to);
      dragging.from = to;
      return;
    }
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
      inviteFor(selected, near) &&
      !visiting
    ) {
      event.preventDefault();
      enter(inviteFor(selected, near)!);
    } else if (name === 'escape' && selected && !visiting) {
      select(undefined);
    }
  };
  /** Opens a plot from the map: from afar, the player goes to its door first. */
  const enter = (plot: Plot) => {
    if (plotAtDoor(world, player) !== plot) {
      player = { ...plot.door };
      path = [];
    }
    open(plot);
  };
  const onKeyUp = (event: KeyboardEvent) => held.delete(event.key.toLowerCase());
  const onBlur = () => held.clear();
  const onPrompt = () => {
    const plot = inviteFor(selected, near);
    if (plot && !visiting) enter(plot);
  };

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerEnd);
  canvas.addEventListener('pointercancel', onPointerEnd);
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
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerEnd);
      canvas.removeEventListener('pointercancel', onPointerEnd);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      tag.remove();
      delete frame.dataset.visiting;
      prompt.removeEventListener('click', onPrompt);
      pointer.stop();
    },
    walkTo(kind, id) {
      if (visiting) options.onLeave();
      const plot = plotOf(kind, id);
      if (!plot) return;
      select(plot);
      selectedAt = undefined;
      walkToward([plot.door]);
      trailing = path.length > 0;
      footprints = [];
    },
    jumpTo(kind, id) {
      const plot = plotOf(kind, id);
      if (!plot) return;
      if (visiting) options.onLeave();
      player = { ...plot.door };
      path = [];
      // A pinch in the overview was nearer than the overview, not than the carnival.
      if (overview) closer = 1;
      overview = false;
      panned = undefined;
      // The camera comes in on the square, and eases back out a little later, as after a walk.
      walking = 1;
      movedAt = performance.now();
      select(plot);
      selectedAt = undefined;
    },
    get selected() {
      return selected && { kind: selected.kind as SquareKind, id: selected.id! };
    },
    clearSelection() {
      select(undefined);
    },
    nearest(count) {
      const squares = world.plots.filter(
        (plot) => plot.kind === 'booth' || plot.kind === 'attraction',
      );
      return nearYou(squares, player, count).map((plot) => ({
        kind: plot.kind as SquareKind,
        id: plot.id!,
      }));
    },
    setMe(login) {
      me = login;
    },
    setPending(list) {
      // A site's tag says its stage, which may have changed.
      tagged = undefined;
      if (!build(list)) return;
      // Which construction sites are up, for the smoke test.
      canvas.dataset.sites = this.sites.join(' ');
      // The new world's plots are new objects: keep hold of the same squares in it.
      const same = (plot: Plot | undefined) =>
        plot &&
        world.plots.find(
          (p) => p.kind === plot.kind && p.id === plot.id && (p.id || p.number === plot.number),
        );
      selected = same(selected);
      near = same(near);
      hovered = same(hovered);
      claiming = same(claiming);
      invited = same(invited);
      if (visiting) visiting = same(visiting);
      if (entered) entered = same(entered);
      // A new site may stand where the player is, or across their walk: put
      // them on clear ground, and plan what's left of the walk again.
      player = nearestStand(world, player);
      const goal = path.at(-1);
      path = [];
      if (goal) walkToward([goal]);
      island = islandCorners(world);
      bounds = islandBounds(world);
      groundBox = boxOf();
      targets = [];
      resize();
    },
    get sites() {
      return world.plots.filter((plot) => plot.kind === 'site').map((plot) => plot.id!);
    },
    walkToOpenPlot() {
      if (visiting) options.onLeave();
      const way = nearestOpenPlot(world, player);
      if (!way) return;
      // The open plot is where they're headed now, so its call to action is the one that shows.
      select(undefined);
      path = way.path;
    },
    claimNextDoor() {
      const way = nearestOpenPlot(world, player);
      if (!way) return;
      select(undefined);
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
      // A pinch in the overview was nearer than the overview, not than the carnival.
      if (overview) closer = 1;
      overview = false;
      panned = undefined;
      if (!visiting) fading = performance.now();
      visiting = plot;
      select(undefined);
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
      panned = undefined;
      closer = 1;
      return overview;
    },
    get overview() {
      return overview;
    },
  };
}
