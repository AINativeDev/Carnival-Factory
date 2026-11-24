import {
  hash,
  layoutMap,
  placeScenery,
  SQUARE_SIZE,
  slotAt,
  type MapLayout,
  type Point,
  type SceneryItem,
  type Slot,
} from './layout';
import type { NorthPoleSquare } from './square';
import { canvasFont, theme } from './theme';

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

/** The part of the town on screen, in town coordinates. */
interface View {
  x: number;
  y: number;
  width: number;
  height: number;
}

const inView = (view: View, x: number, y: number, room: number) =>
  x > view.x - room &&
  x < view.x + view.width + room &&
  y > view.y - room &&
  y < view.y + view.height + room;

/** Strokes a path as a smooth curve through its points. */
function tracePath(ctx: CanvasRenderingContext2D, points: readonly Point[]) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const [p, q] = [points[i], points[i + 1]];
    ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
}

/** The frozen stream, the trodden paths with footprints in them, and the town square. */
function drawPaths(ctx: CanvasRenderingContext2D, layout: MapLayout, time: number) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const path of layout.paths) {
    tracePath(ctx, path.points);
    if (path.kind === 'stream') {
      ctx.strokeStyle = colors.ice;
      ctx.lineWidth = path.width;
      ctx.stroke();
      // Cracks in the ice that catch the light now and then.
      ctx.strokeStyle = colors.snow;
      ctx.lineWidth = 2;
      ctx.setLineDash([18, 40]);
      ctx.lineDashOffset = -time / 200;
      ctx.globalAlpha = 0.7;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      continue;
    }
    ctx.strokeStyle = colors.muted;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = path.width + 6;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.snow;
    ctx.lineWidth = path.width;
    ctx.stroke();
  }
  ctx.restore();

  drawFootprints(ctx, layout);

  const { plaza } = layout;
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.arc(plaza.x, plaza.y, plaza.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.muted;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.setLineDash([4, 10]);
  ctx.beginPath();
  ctx.arc(plaza.x, plaza.y, plaza.radius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  drawBridge(ctx, layout);
}

/** Footprints down the middle of each path, left and right in turn. */
function drawFootprints(ctx: CanvasRenderingContext2D, layout: MapLayout) {
  ctx.fillStyle = colors.muted;
  ctx.globalAlpha = 0.3;
  for (const path of layout.paths) {
    if (path.kind === 'stream') continue;
    for (let i = 1; i < path.points.length; i++) {
      const [a, b] = [path.points[i - 1], path.points[i]];
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const side = i % 2 ? 5 : -5;
      ctx.beginPath();
      ctx.ellipse(
        a.x - Math.sin(angle) * side,
        a.y + Math.cos(angle) * side,
        4,
        2.5,
        angle,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/** A little wooden bridge where the midway crosses the stream. */
function drawBridge(ctx: CanvasRenderingContext2D, layout: MapLayout) {
  const { bridge } = layout;
  const [midway] = layout.paths;
  const deck = midway.width + 20;
  ctx.save();
  ctx.translate(bridge.x, bridge.y);
  ctx.fillStyle = colors.gingerbread;
  ctx.fillRect(-56, -deck / 2, 112, deck);
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 2;
  for (let x = -50; x <= 50; x += 10) {
    ctx.beginPath();
    ctx.moveTo(x, -deck / 2);
    ctx.lineTo(x, deck / 2);
    ctx.stroke();
  }
  // Rails along both sides, with snow along their tops.
  for (const y of [-deck / 2 - 4, deck / 2 - 2]) {
    ctx.fillStyle = colors.cocoa;
    ctx.fillRect(-60, y, 120, 6);
    for (const x of [-60, -20, 20, 54]) ctx.fillRect(x, y - 4, 6, 10);
    ctx.fillStyle = colors.snow;
    ctx.fillRect(-60, y - 2, 120, 2);
  }
  ctx.restore();
}

/** A snowy pine tree. */
function drawTree(ctx: CanvasRenderingContext2D, item: SceneryItem) {
  const scale = 0.8 + 0.5 * item.seed;
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.scale(scale, scale);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(-3, 8, 6, 10);
  for (const [y, half, height] of [
    [-26, 12, 18],
    [-14, 17, 20],
    [-2, 22, 20],
  ]) {
    ctx.fillStyle = colors.pineDark;
    ctx.beginPath();
    ctx.moveTo(0, y - height / 2);
    ctx.lineTo(half, y + height / 2);
    ctx.lineTo(-half, y + height / 2);
    ctx.fill();
    ctx.fillStyle = colors.pine;
    ctx.beginPath();
    ctx.moveTo(0, y - height / 2);
    ctx.lineTo(-half, y + height / 2);
    ctx.lineTo(-half / 3, y + height / 2);
    ctx.fill();
    ctx.fillStyle = colors.snow;
    ctx.beginPath();
    ctx.moveTo(0, y - height / 2);
    ctx.lineTo(half * 0.45, y);
    ctx.lineTo(-half * 0.45, y);
    ctx.fill();
  }
  ctx.restore();
}

function drawDrift(ctx: CanvasRenderingContext2D, item: SceneryItem) {
  const width = 18 + 10 * item.seed;
  ctx.fillStyle = colors.muted;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.ellipse(item.x, item.y + 3, width, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.snow;
  ctx.beginPath();
  ctx.ellipse(item.x, item.y, width, 8, 0, Math.PI, 0);
  ctx.ellipse(item.x + width * 0.3, item.y, width * 0.5, 12, 0, Math.PI, 0);
  ctx.fill();
}

/** A short run of picket fence with snow on its rails. */
function drawFence(ctx: CanvasRenderingContext2D, item: SceneryItem) {
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate((item.seed - 0.5) * 0.6);
  ctx.fillStyle = colors.wood;
  ctx.fillRect(-30, -8, 60, 3);
  ctx.fillRect(-30, 0, 60, 3);
  for (let x = -28; x <= 28; x += 14) ctx.fillRect(x - 2, -14, 4, 20);
  ctx.fillStyle = colors.snow;
  ctx.fillRect(-30, -10, 60, 2);
  for (let x = -28; x <= 28; x += 14) ctx.fillRect(x - 2, -16, 4, 3);
  ctx.restore();
}

/** A lamp post whose soft glow breathes slowly. */
function drawLamp(ctx: CanvasRenderingContext2D, item: SceneryItem, time: number) {
  const breath = 0.75 + 0.25 * Math.sin(time / 900 + item.seed * 20);
  ctx.fillStyle = colors.glow;
  for (const radius of [26, 18, 11]) {
    ctx.globalAlpha = 0.12 * breath;
    ctx.beginPath();
    ctx.arc(item.x, item.y - 22, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.night;
  ctx.fillRect(item.x - 1.5, item.y - 20, 3, 22);
  ctx.fillRect(item.x - 4, item.y, 8, 3);
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(item.x, item.y - 22, 4, 0, Math.PI * 2);
  ctx.fill();
}

function drawScenery(
  ctx: CanvasRenderingContext2D,
  scenery: readonly SceneryItem[],
  view: View,
  time: number,
) {
  for (const item of scenery) {
    if (!inView(view, item.x, item.y, 60)) continue;
    if (item.kind === 'tree') drawTree(ctx, item);
    else if (item.kind === 'drift') drawDrift(ctx, item);
    else if (item.kind === 'fence') drawFence(ctx, item);
    else drawLamp(ctx, item, time);
  }
}

/** The big tree in the middle of the town square, its baubles twinkling. */
function drawTownTree(ctx: CanvasRenderingContext2D, layout: MapLayout, time: number) {
  const { x, y } = layout.plaza;
  ctx.save();
  ctx.translate(x, y - 40);
  ctx.scale(2.6, 2.6);
  drawTree(ctx, { kind: 'tree', x: 0, y: 0, seed: 0 });
  const baubles = [
    [-6, -18],
    [5, -12],
    [-10, -4],
    [9, 0],
    [-3, 6],
    [14, 10],
    [-15, 10],
  ];
  baubles.forEach(([bx, by], n) => {
    ctx.globalAlpha = Math.sin(time / 500 + n * 1.9) > -0.2 ? 1 : 0.35;
    ctx.fillStyle = n % 2 ? colors.gold : colors.berry;
    ctx.beginPath();
    ctx.arc(bx, by, 1.6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(0, -36, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Snow falling gently over whatever part of the town is on screen. */
function drawSnowfall(ctx: CanvasRenderingContext2D, view: View, time: number) {
  ctx.fillStyle = colors.snow;
  const flakes = Math.round((view.width * view.height) / 9000);
  for (let n = 0; n < flakes; n++) {
    const speed = 0.015 + 0.02 * hash(n, 20);
    const fall = (hash(n, 21) * view.height + time * speed) % (view.height + 20);
    const sway = Math.sin(time / 1500 + n) * 12;
    ctx.globalAlpha = 0.5 + 0.4 * hash(n, 22);
    ctx.beginPath();
    ctx.arc(
      view.x + hash(n, 23) * view.width + sway,
      view.y + fall - 10,
      1 + 1.5 * hash(n, 24),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** An open spot: a staked-out square of fresh snow, waiting for a booth. */
function drawOpenSpot(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = colors.snow;
  ctx.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
  ctx.save();
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(x + 4, y + 4, SQUARE_SIZE - 8, SQUARE_SIZE - 8);
  ctx.restore();
  ctx.fillStyle = colors.muted;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'center';
  ctx.fillText('+', x + SQUARE_SIZE / 2, y + SQUARE_SIZE / 2);
}

/** The sign under a square: its name, and whose it is. */
function drawSign(ctx: CanvasRenderingContext2D, name: string, by: string, x: number, y: number) {
  const width = SQUARE_SIZE + 40;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.night;
  ctx.font = canvasFont('small', 'bold');
  ctx.fillText(name, x + SQUARE_SIZE / 2, y + SQUARE_SIZE + 6, width);
  ctx.fillStyle = colors.surface;
  ctx.font = canvasFont('small');
  ctx.fillText(by, x + SQUARE_SIZE / 2, y + SQUARE_SIZE + 22, width);
  ctx.textBaseline = 'alphabetic';
}

export type SquareKind = 'attraction' | 'booth';

export interface MapOptions {
  /** The North Pole's own attractions, round the town square. */
  attractions: readonly NorthPoleSquare[];
  /** Participants' booths, along the lanes. */
  booths: readonly NorthPoleSquare[];
  /** Opens a square: `id` is a booth's owner or an attraction's id. */
  onOpen(kind: SquareKind, id: string): void;
}

/** How far a mouse may move while pressed and still count as a click, not a drag. */
const DRAG = 6;

/**
 * Draws the town and animates it, and returns a function that stops it.
 * `frame` scrolls over `town`, which is as big as the whole town, and `canvas`
 * sticks to the frame's corner and draws only the part of the town on show,
 * so the town can be far larger than the screen. It starts centred on the town
 * square, and scrolls, swipes or drags to anywhere else.
 */
export function startMap(
  frame: HTMLElement,
  town: HTMLElement,
  canvas: HTMLCanvasElement,
  options: MapOptions,
): () => void {
  const ctx = canvas.getContext('2d')!;
  const scratch = document.createElement('canvas');
  const { attractions, booths } = options;
  const squareAt = (slot: Slot) =>
    slot.kind === 'attraction'
      ? attractions[slot.index]
      : slot.kind === 'booth'
        ? booths[slot.index]
        : undefined;
  const layout = layoutMap(attractions.length, booths.length);
  const scenery = placeScenery(layout);
  const { bounds } = layout;
  let frameId = 0;
  let scale = 1;

  town.style.width = `${bounds.width}px`;
  town.style.height = `${bounds.height}px`;

  const view = (): View => ({
    x: bounds.x + frame.scrollLeft,
    y: bounds.y + frame.scrollTop,
    width: frame.clientWidth,
    height: frame.clientHeight,
  });

  const resize = () => {
    scale = Math.min(2, window.devicePixelRatio || 1);
    canvas.style.width = `${frame.clientWidth}px`;
    canvas.style.height = `${frame.clientHeight}px`;
    canvas.width = Math.round(frame.clientWidth * scale);
    canvas.height = Math.round(frame.clientHeight * scale);
  };

  const render = (time: number) => {
    const shown = view();
    ctx.setTransform(scale, 0, 0, scale, -shown.x * scale, -shown.y * scale);
    ctx.fillStyle = colors.snowShade;
    ctx.fillRect(shown.x, shown.y, shown.width, shown.height);
    drawPaths(ctx, layout, time);
    drawScenery(ctx, scenery, shown, time);
    drawTownTree(ctx, layout, time);

    for (const slot of layout.slots) {
      if (!inView(shown, slot.x, slot.y, SQUARE_SIZE)) continue;
      const square = squareAt(slot);
      const corner = -SQUARE_SIZE / 2;
      ctx.save();
      ctx.translate(slot.x, slot.y);
      ctx.rotate(slot.angle);
      ctx.fillStyle = colors.night;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(corner + 5, corner + 7, SQUARE_SIZE, SQUARE_SIZE);
      ctx.globalAlpha = 1;
      if (square) {
        drawSquare(ctx, scratch, square, corner, corner, SQUARE_SIZE, time);
        const by = slot.kind === 'attraction' ? 'North Pole' : `@${square.id}`;
        drawSign(ctx, square.name, by, corner, corner);
      } else {
        drawOpenSpot(ctx, corner, corner);
        drawSign(ctx, 'Open booth', 'Claim it', corner, corner);
      }
      ctx.restore();
    }

    drawSnowfall(ctx, shown, time);
    frameId = requestAnimationFrame(render);
  };

  const slotUnder = (event: MouseEvent) => {
    const box = canvas.getBoundingClientRect();
    const shown = view();
    const slot = slotAt(
      layout,
      event.clientX - box.left + shown.x,
      event.clientY - box.top + shown.y,
    );
    return slot && slot.kind !== 'open' ? slot : undefined;
  };

  // A mouse drags the town about. Touch screens swipe it with the frame's own scrolling.
  let press: { x: number; y: number; left: number; top: number; moved: boolean } | undefined;
  let dragged = false;
  const onDown = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    press = {
      x: event.clientX,
      y: event.clientY,
      left: frame.scrollLeft,
      top: frame.scrollTop,
      moved: false,
    };
  };
  const onMove = (event: PointerEvent) => {
    if (press && event.buttons & 1) {
      const [dx, dy] = [event.clientX - press.x, event.clientY - press.y];
      press.moved ||= Math.hypot(dx, dy) > DRAG;
      if (press.moved) {
        frame.scrollLeft = press.left - dx;
        frame.scrollTop = press.top - dy;
        canvas.style.cursor = 'grabbing';
        return;
      }
    }
    if (event.target !== canvas) return;
    canvas.style.cursor = slotUnder(event) ? 'pointer' : 'grab';
  };
  const onUp = () => {
    dragged = press?.moved ?? false;
    press = undefined;
  };
  const onClick = (event: MouseEvent) => {
    if (dragged) return void (dragged = false);
    const slot = slotUnder(event);
    const square = slot && squareAt(slot);
    if (slot && square) options.onOpen(slot.kind as SquareKind, square.id);
  };

  resize();
  // Start on the town square, in the middle of the frame.
  frame.scrollLeft = layout.plaza.x - bounds.x - frame.clientWidth / 2;
  frame.scrollTop = layout.plaza.y - bounds.y - frame.clientHeight / 2;
  window.addEventListener('resize', resize);
  canvas.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  canvas.addEventListener('click', onClick);
  frameId = requestAnimationFrame(render);

  return () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('click', onClick);
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
