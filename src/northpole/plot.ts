import { canvasFont, theme } from './theme';

/**
 * One person's square of the North Pole map.
 *
 * `draw` paints the plot into a `size` by `size` square whose top-left corner
 * is the context's origin. Each plot draws on a canvas of its own that size,
 * so nothing a plot draws can spill onto a neighbour. `time` is milliseconds since the page
 * loaded, for plots that animate.
 */
export interface NorthPolePlot {
  /** The owner's GitHub login in lower case, and the same as the plot's folder name. */
  owner: string;
  name: string;
  /** One sentence, shown on the map. */
  description: string;
  draw(ctx: CanvasRenderingContext2D, size: number, time: number): void;
}

/** A GitHub login: letters, digits and single hyphens, up to 39 characters. */
const LOGIN_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/;

export function isPlotOwner(login: string): boolean {
  return LOGIN_PATTERN.test(login);
}

export function createPlotRegistry(plots: readonly NorthPolePlot[]) {
  const byOwner = new Map<string, NorthPolePlot>();

  for (const plot of plots) {
    if (!isPlotOwner(plot.owner)) {
      throw new Error(`Plot owner "${plot.owner}" must be a GitHub login in lower case`);
    }
    if (byOwner.has(plot.owner)) {
      throw new Error(`Two plots belong to "${plot.owner}"`);
    }
    byOwner.set(plot.owner, plot);
  }

  return {
    all: (): NorthPolePlot[] => [...byOwner.values()],
    get: (owner: string): NorthPolePlot | undefined => byOwner.get(owner.toLowerCase()),
  };
}

/**
 * A stand-in for a plot a maintainer switched off in `disabled.json`: the same
 * square, name and owner, but its own `draw` never runs. The plot's module is
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

/** Swaps every plot whose owner is in `disabled` for its closed stand-in. */
export function applyKillSwitch(
  plots: readonly NorthPolePlot[],
  disabled: readonly string[],
): NorthPolePlot[] {
  const off = new Set(disabled.map((owner) => owner.toLowerCase()));
  return plots.map((plot) => (off.has(plot.owner) ? closeForRepairs(plot) : plot));
}
