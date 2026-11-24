import { canvasFont, theme } from './theme';

/**
 * One square of the North Pole map: a person's booth, or one of the North
 * Pole's own attractions, which have no owner.
 *
 * `draw` paints the square into a `size` by `size` square whose top-left corner
 * is the context's origin. Each square draws on a canvas of its own that size,
 * so nothing it draws can spill onto a neighbour. `time` is milliseconds since the page
 * loaded, for squares that animate. `pointer` is where the mouse or a finger is
 * over the square, for squares people can play with, or undefined when it isn't
 * over this square.
 */
export interface NorthPoleSquare {
  /**
   * The same as the square's folder name. For a booth, its owner's GitHub login
   * in lower case. For an attraction, which nobody owns, its kebab-case id.
   */
  id: string;
  name: string;
  /** One sentence, shown on the map. */
  description: string;
  /** How its stall on the map looks. Leave it out for the usual market stall. */
  stall?: StallStyle;
  draw(ctx: CanvasRenderingContext2D, size: number, time: number, pointer?: SquarePointer): void;
}

/**
 * The mouse or a finger over a square: `x` and `y` in the square's own
 * coordinates, from 0 to `size` with 0, 0 at its top-left, whether a button or
 * finger is held now, and `presses`, how many times one went down on the square
 * since its last frame. A tap can come and go between two frames, so a game
 * counts `presses`, not changes in `down`. A square only ever gets these
 * numbers, never the page's own events.
 */
export interface SquarePointer {
  x: number;
  y: number;
  down: boolean;
  presses: number;
}

/** The stall shapes the map knows how to draw. `stall` is the usual market stall. */
export const STALL_SHAPES = ['stall', 'shed', 'tent', 'cabin', 'kiosk'] as const;

export type StallShape = (typeof STALL_SHAPES)[number];

/** The name of one of the `theme` colours, such as `'gold'`. */
export type ThemeColor = keyof typeof theme.colors;

/**
 * How a booth's stall on the map looks, as plain data: its `shape`, its
 * `roof` colour, and an optional `trim` colour for stripes or the awning,
 * each a `theme` colour's name. The map draws it, never the booth's own code:
 * `stall` is a market stall with an awning, `shed` a long, low shed with a
 * flat roof, `tent` a round striped tent, `cabin` a log cabin with a snowy
 * pitched roof, and `kiosk` a small hexagonal kiosk.
 */
export interface StallStyle {
  shape: StallShape;
  roof: ThemeColor;
  trim?: ThemeColor;
}

/** The most presses one frame carries. Any more wait for the next frame. */
export const MAX_PRESSES = 20;

/** A GitHub login: letters, digits and single hyphens, up to 39 characters. */
const LOGIN_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/;

/** An attraction's id: lower-case words joined by single hyphens. */
const ATTRACTION_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isBoothOwner(login: string): boolean {
  return LOGIN_PATTERN.test(login);
}

export function isAttractionId(id: string): boolean {
  return ATTRACTION_PATTERN.test(id);
}

function createRegistry(
  booths: readonly NorthPoleSquare[],
  problems: { invalid(key: string): string | undefined; twice(key: string): string },
) {
  const byId = new Map<string, NorthPoleSquare>();

  for (const booth of booths) {
    const invalid = problems.invalid(booth.id);
    if (invalid) throw new Error(invalid);
    if (byId.has(booth.id)) throw new Error(problems.twice(booth.id));
    // Frozen, so nothing that can reach the registry can swap another square's draw.
    byId.set(booth.id, Object.freeze(booth));
  }

  return {
    all: (): NorthPoleSquare[] => [...byId.values()],
    get: (key: string): NorthPoleSquare | undefined => byId.get(key.toLowerCase()),
  };
}

export type SquareRegistry = ReturnType<typeof createRegistry>;

export function createBoothRegistry(booths: readonly NorthPoleSquare[]): SquareRegistry {
  return createRegistry(booths, {
    invalid: (id) =>
      isBoothOwner(id) ? undefined : `Booth owner "${id}" must be a GitHub login in lower case`,
    twice: (id) => `Two booths belong to "${id}"`,
  });
}

/** The North Pole's own attractions, found by id. */
export function createAttractionRegistry(attractions: readonly NorthPoleSquare[]): SquareRegistry {
  return createRegistry(attractions, {
    invalid: (id) => (isAttractionId(id) ? undefined : `Attraction id "${id}" must be kebab-case`),
    twice: (id) => `Two attractions are called "${id}"`,
  });
}

/**
 * The squares in a folder of folders, from `import.meta.glob('../booths/*\/booth.ts')`,
 * sorted by folder. Each folder's `booth.ts` must have a default export whose
 * `id` is the folder's name.
 */
export function fromFolders(
  modules: Record<string, NorthPoleSquare | undefined>,
): NorthPoleSquare[] {
  return Object.keys(modules)
    .sort()
    .map((path) => {
      const booth = modules[path];
      if (!booth) throw new Error(`${path} needs a default export of its NorthPoleSquare`);
      const folder = path.split('/').at(-2);
      if (booth.id !== folder) {
        throw new Error(`${path} exports "${booth.id}", but its folder is "${folder}"`);
      }
      return booth;
    });
}

/**
 * The ids of the squares in a folder of folders, from the keys of
 * `import.meta.glob('../booths/*\/booth.ts')`: each file's folder name, sorted.
 */
export function idsFromFolders(paths: readonly string[]): string[] {
  return paths.map((path) => path.split('/').at(-2)!).sort();
}

/**
 * A stand-in for a booth or attraction a maintainer switched off in
 * `disabled.json`: the same square, name and id, but its own `draw` never runs. The booth's module is
 * still loaded, so to stop code that runs on import, remove its folder.
 */
export function closeForRepairs(booth: Pick<NorthPoleSquare, 'id' | 'name'>): NorthPoleSquare {
  return {
    id: booth.id,
    name: booth.name,
    description: 'Closed for repairs.',
    draw(ctx, size) {
      ctx.fillStyle = theme.colors.surface;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = theme.colors.muted;
      ctx.font = canvasFont('small');
      ctx.textAlign = 'center';
      ctx.fillText('Closed for repairs', size / 2, size / 2, size);
    },
  };
}

/** Swaps every booth or attraction whose owner or id is in `disabled` for its closed stand-in. */
export function applyKillSwitch(
  booths: readonly NorthPoleSquare[],
  disabled: readonly string[],
): NorthPoleSquare[] {
  const off = new Set(disabled.map((id) => id.toLowerCase()));
  return booths.map((booth) => (off.has(booth.id) ? closeForRepairs(booth) : booth));
}
