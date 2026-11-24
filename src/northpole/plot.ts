import { canvasFont, theme } from './theme';

/**
 * One square of the North Pole map: a person's plot, or one of the North
 * Pole's own attractions, which have no owner.
 *
 * `draw` paints the square into a `size` by `size` square whose top-left corner
 * is the context's origin. Each square draws on a canvas of its own that size,
 * so nothing it draws can spill onto a neighbour. `time` is milliseconds since the page
 * loaded, for squares that animate.
 */
export interface NorthPolePlot {
  /**
   * The same as the square's folder name. For a plot, its owner's GitHub login
   * in lower case. For an attraction, which nobody owns, its kebab-case id.
   */
  owner: string;
  name: string;
  /** One sentence, shown on the map. */
  description: string;
  draw(ctx: CanvasRenderingContext2D, size: number, time: number): void;
}

/** A GitHub login: letters, digits and single hyphens, up to 39 characters. */
const LOGIN_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/;

/** An attraction's id: lower-case words joined by single hyphens. */
const ATTRACTION_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isPlotOwner(login: string): boolean {
  return LOGIN_PATTERN.test(login);
}

export function isAttractionId(id: string): boolean {
  return ATTRACTION_PATTERN.test(id);
}

function createRegistry(
  plots: readonly NorthPolePlot[],
  problems: { invalid(key: string): string | undefined; twice(key: string): string },
) {
  const byOwner = new Map<string, NorthPolePlot>();

  for (const plot of plots) {
    const invalid = problems.invalid(plot.owner);
    if (invalid) throw new Error(invalid);
    if (byOwner.has(plot.owner)) throw new Error(problems.twice(plot.owner));
    byOwner.set(plot.owner, plot);
  }

  return {
    all: (): NorthPolePlot[] => [...byOwner.values()],
    get: (key: string): NorthPolePlot | undefined => byOwner.get(key.toLowerCase()),
  };
}

export type PlotRegistry = ReturnType<typeof createRegistry>;

export function createPlotRegistry(plots: readonly NorthPolePlot[]): PlotRegistry {
  return createRegistry(plots, {
    invalid: (owner) =>
      isPlotOwner(owner) ? undefined : `Plot owner "${owner}" must be a GitHub login in lower case`,
    twice: (owner) => `Two plots belong to "${owner}"`,
  });
}

/** The North Pole's own attractions, found by id. */
export function createAttractionRegistry(attractions: readonly NorthPolePlot[]): PlotRegistry {
  return createRegistry(attractions, {
    invalid: (id) => (isAttractionId(id) ? undefined : `Attraction id "${id}" must be kebab-case`),
    twice: (id) => `Two attractions are called "${id}"`,
  });
}

/**
 * The squares in a folder of folders, from `import.meta.glob('./*\/plot.ts')`,
 * sorted by folder. Each folder's `plot.ts` must have a default export whose
 * `owner` is the folder's name.
 */
export function fromFolders(modules: Record<string, NorthPolePlot | undefined>): NorthPolePlot[] {
  return Object.keys(modules)
    .sort()
    .map((path) => {
      const plot = modules[path];
      if (!plot) throw new Error(`${path} needs a default export of its NorthPolePlot`);
      const folder = path.split('/')[1];
      if (plot.owner !== folder) {
        throw new Error(`${path} exports "${plot.owner}", but its folder is "${folder}"`);
      }
      return plot;
    });
}

/**
 * A stand-in for a plot or attraction a maintainer switched off in
 * `disabled.json`: the same square, name and owner, but its own `draw` never runs. The plot's module is
 * still loaded, so to stop code that runs on import, remove its folder.
 */
export function closeForRepairs(plot: NorthPolePlot): NorthPolePlot {
  return {
    owner: plot.owner,
    name: plot.name,
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

/** Swaps every plot or attraction whose owner or id is in `disabled` for its closed stand-in. */
export function applyKillSwitch(
  plots: readonly NorthPolePlot[],
  disabled: readonly string[],
): NorthPolePlot[] {
  const off = new Set(disabled.map((owner) => owner.toLowerCase()));
  return plots.map((plot) => (off.has(plot.owner) ? closeForRepairs(plot) : plot));
}
