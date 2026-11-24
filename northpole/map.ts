import { CLAIM_URL } from './links';
import pinned from './plots.json';
import {
  drawAurora,
  drawGround,
  drawPerson,
  drawPlot,
  drawPlotGlow,
  drawReindeer,
  drawSnowfall,
  drawThing,
  middle,
  panelBox,
  type Look,
} from './render';
import type { NorthPoleSquare } from './square';
import { canvasFont, theme } from './theme';
import {
  buildWorld,
  findPath,
  moveBy,
  plotAtDoor,
  screenDirection,
  strollAt,
  TILE_H,
  TILE_W,
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
) {
  // Setting the size resets the scratch canvas: its pixels, transform, clip and styles.
  scratch.width = size;
  scratch.height = size;
  try {
    booth.draw(scratch.getContext('2d')!, size, time);
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
/** How far above the player the camera looks, in pixels, so more of what's ahead shows. */
const LOOK_UP = 40;

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

/**
 * Draws the North Pole as an isometric world on `canvas`, which fills `frame`,
 * and lets the player walk round it with WASD, the arrow keys, or by clicking
 * or tapping the ground. Standing at a booth or an attraction, or at an open
 * plot, `prompt` offers to open it, as do E, Enter and a click on it. Returns
 * a function that stops it all.
 */
export function startMap(
  frame: HTMLElement,
  canvas: HTMLCanvasElement,
  prompt: HTMLButtonElement,
  options: MapOptions,
): () => void {
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
  const focused = options.focus
    ? world.plots.find((plot) => plot.kind === options.focus!.kind && plot.id === options.focus!.id)
    : undefined;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  let player: Tile = focused ? { ...focused.door } : (remembered ?? { ...world.start });
  let path: Tile[] = [];
  let facing = 1;
  let moving = false;
  let camera: Tile | undefined;
  let near: Plot | undefined;
  let scale = 1;
  let last: number | undefined;
  let focusedAt: number | undefined;
  let frameId = 0;
  /** What can be clicked this frame, back to front: each plot's panel or sign. */
  let targets: { plot: Plot; box: Box }[] = [];
  const held = new Set<string>();

  const resize = () => {
    scale = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(frame.clientWidth * scale);
    canvas.height = Math.round(frame.clientHeight * scale);
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
        ? 'Claim this plot for your booth (E)'
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
  };

  const render = (time: number) => {
    const dt = last === undefined ? 0 : Math.min(0.1, (time - last) / 1000);
    last = time;
    // Decoration stands still for anyone who'd rather nothing moved.
    const still = reduced.matches;
    const motion = still ? 0 : time;
    walk(dt);
    showPrompt();

    const width = frame.clientWidth;
    const height = frame.clientHeight;
    const target = toScreen(player);
    target.y -= LOOK_UP;
    if (!camera || still) camera = target;
    else {
      const ease = Math.min(1, dt * 6);
      camera = {
        x: camera.x + (target.x - camera.x) * ease,
        y: camera.y + (target.y - camera.y) * ease,
      };
    }
    const view = { x: camera.x - width / 2, y: camera.y - height / 2, w: width, h: height };

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.fillStyle = colors.night;
    ctx.fillRect(0, 0, width, height);
    drawAurora(ctx, width, motion);
    ctx.setTransform(scale, 0, 0, scale, -view.x * scale, -view.y * scale);

    // The tiles in view, with room below for things standing tall from there.
    const reach = [
      toTile({ x: view.x - TILE_W, y: view.y - TILE_H }),
      toTile({ x: view.x + view.w + TILE_W, y: view.y - TILE_H }),
      toTile({ x: view.x - TILE_W, y: view.y + view.h + 200 }),
      toTile({ x: view.x + view.w + TILE_W, y: view.y + view.h + 200 }),
    ];
    const range = {
      minX: Math.max(-world.extent, Math.floor(Math.min(...reach.map((t) => t.x)))),
      maxX: Math.min(world.extent, Math.ceil(Math.max(...reach.map((t) => t.x)))),
      minY: Math.max(-world.extent, Math.floor(Math.min(...reach.map((t) => t.y)))),
      maxY: Math.min(world.extent, Math.ceil(Math.max(...reach.map((t) => t.y)))),
    };
    const shown = (box: Box) => {
      const { x, y } = middle(box);
      return (
        x > view.x - 200 &&
        x < view.x + view.w + 200 &&
        y > view.y - 60 &&
        y < view.y + view.h + 260
      );
    };
    drawGround(ctx, world, range, motion);

    // Everything standing, drawn back to front so what's in front hides what's behind.
    const scene: { depth: number; draw: () => void }[] = [];
    const add = (depth: number, draw: () => void) => scene.push({ depth, draw });
    for (const thing of world.things) {
      if (!shown(thing)) continue;
      if (thing.kind === 'drift') drawThing(ctx, thing, motion);
      else add(thing.x + thing.w + thing.y + thing.h - 2, () => drawThing(ctx, thing, motion));
    }
    targets = [];
    const paint = (square: NorthPoleSquare, x: number, y: number, size: number) => {
      // The square draws at the screen's own resolution, so its drawing stays sharp.
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(1 / scale, 1 / scale);
      drawSquare(ctx, scratch, square, 0, 0, Math.round(size * scale), time);
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
        drawPlot(ctx, plot, squareOf(plot), paint, motion);
        const { x, y } = middle(plot);
        targets.push({
          plot,
          box:
            plot.kind === 'open'
              ? { x: x - 44, y: y - 70, w: 88, h: 90 }
              : { ...panelBox(plot), h: panelBox(plot).h + 80 },
        });
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
      // A marker over the player's head, so they can find themselves.
      const { x, y } = toScreen(player);
      const bob = still ? 0 : Math.sin(time / 300) * 3;
      ctx.fillStyle = colors.gold;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 72 + bob);
      ctx.lineTo(x + 6, y - 72 + bob);
      ctx.lineTo(x, y - 64 + bob);
      ctx.fill();
    });
    scene.sort((a, b) => a.depth - b.depth);
    for (const item of scene) item.draw();
    if (focused) focusedAt ??= time;

    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    drawAurora(ctx, width, motion, 0.3);
    if (!still) drawSnowfall(ctx, width, height, time);
    frameId = requestAnimationFrame(render);
  };

  /** Where a click landed, in world pixels. */
  const pointAt = (event: MouseEvent): Tile => {
    const box = canvas.getBoundingClientRect();
    const middleOf = camera ?? toScreen(player);
    return {
      x: event.clientX - box.left - box.width / 2 + middleOf.x,
      y: event.clientY - box.top - box.height / 2 + middleOf.y,
    };
  };

  const plotUnder = (point: Tile) => {
    for (let n = targets.length - 1; n >= 0; n--) {
      const { plot, box } = targets[n];
      if (
        point.x >= box.x &&
        point.x <= box.x + box.w &&
        point.y >= box.y &&
        point.y <= box.y + box.h
      )
        return plot;
    }
    return undefined;
  };

  const onClick = (event: MouseEvent) => {
    const point = pointAt(event);
    const plot = plotUnder(point);
    if (plot) return open(plot);
    // Walk to the tile clicked, or the nearest one beside it you can stand on.
    const tile = tileOf(toTile(point));
    const from = tileOf(player);
    for (let ring = 0; ring <= 2; ring++)
      for (let dx = -ring; dx <= ring; dx++)
        for (let dy = -ring; dy <= ring; dy++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
          const way = findPath(world, from, { x: tile.x + dx, y: tile.y + dy });
          if (way) return void (path = way);
        }
  };

  const onPointerMove = (event: PointerEvent) => {
    canvas.style.cursor = plotUnder(pointAt(event)) ? 'pointer' : 'default';
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (typing(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;
    const name = event.key.toLowerCase();
    if (name in KEYS) {
      held.add(name);
      event.preventDefault();
    } else if ((name === 'e' || (name === 'enter' && !pressable(event.target))) && near) {
      event.preventDefault();
      open(near);
    }
  };
  const onKeyUp = (event: KeyboardEvent) => held.delete(event.key.toLowerCase());
  const onBlur = () => held.clear();
  const onPrompt = () => near && open(near);

  resize();
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('pointermove', onPointerMove);
  prompt.addEventListener('click', onPrompt);
  frameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    canvas.removeEventListener('click', onClick);
    canvas.removeEventListener('pointermove', onPointerMove);
    prompt.removeEventListener('click', onPrompt);
  };
}

/** Animates a single booth or attraction, large, on its own canvas. Returns a function that stops it. */
export function startPreview(canvas: HTMLCanvasElement, booth: NorthPoleSquare, size = 480) {
  const ctx = canvas.getContext('2d')!;
  const scratch = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  let frame = 0;
  const render = (time: number) => {
    ctx.clearRect(0, 0, size, size);
    drawSquare(ctx, scratch, booth, 0, 0, size, time);
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);
  return () => cancelAnimationFrame(frame);
}
