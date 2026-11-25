/**
 * What each plot on the map is and says: the square that stands on it, its
 * sleigh platform's or construction site's sign, and the owner whose colour
 * and avatar a booth shows. The scene, the tags and the prompt all ask these,
 * so they live in one place apart from the drawing.
 */
import type { SquareKind } from './map-options';
import type { MapRun } from './map-state';
import { avatarPath, ownerColor } from './owners';
import { STAGE_TEXT } from './construction-sites';
import { type Owner } from './name-board';
import { theme } from './theme';
import { targetAt } from './visit';
import type { Plot, Tile } from './world';

const { colors } = theme;

/** The square that stands on a plot, if it's a booth's or an attraction's. */
export const squareOf = (m: MapRun, plot: Plot) =>
  plot.kind === 'attraction' || plot.kind === 'booth'
    ? m.squares[plot.kind].get(plot.id ?? '')
    : undefined;

/** The plot a square stands on. */
export const plotOf = (m: MapRun, kind: SquareKind, id: string) =>
  m.world.plots.find((plot) => plot.kind === kind && plot.id === id);

/** The plot whose structure or sign is under a point of the world, frontmost first. */
export const plotUnder = (m: MapRun, point: Tile) => targetAt(m.targets, point)?.plot;

/** What a sleigh platform's sign says: the level it goes to, or, inside a level, the way home. */
export function platformLabel(m: MapRun, plot: Plot) {
  if (plot.kind === 'exit')
    return {
      name: 'The North Pole',
      by: 'Sleigh home',
      color: m.options.level?.tint ?? colors.gold,
      closed: false,
    };
  const entry = m.stations.get(plot.id ?? '');
  return {
    name: entry?.name ?? plot.id ?? '',
    by: entry?.owner ?? `@${String(plot.id)}`,
    color: entry?.color ?? colors.gold,
    closed: entry?.closed ?? true,
  };
}

/** What a construction site's sign says. */
export function siteLabel(m: MapRun, plot: Plot) {
  const entry = m.pending.get(plot.id ?? '');
  return { login: plot.id ?? '', stage: entry ? STAGE_TEXT[entry.stage] : STAGE_TEXT.building };
}

/** A booth owner's avatar once it has loaded, if the build downloaded one; the elf otherwise. */
export function avatarOf(m: MapRun, login: string) {
  if (!m.options.avatars?.has(login)) return undefined;
  if (!m.avatars.has(login)) {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('error', () => m.avatars.set(login, undefined));
    image.src = avatarPath(login);
    m.avatars.set(login, image);
  }
  const image = m.avatars.get(login);
  return image?.complete && image.naturalWidth > 0 ? image : undefined;
}

/** Who owns a booth's plot: their colour, their avatar, and whether it's the visitor's own. */
export function ownerOf(m: MapRun, plot: Plot): Owner | undefined {
  if (plot.kind !== 'booth') return undefined;
  const login = plot.id ?? '';
  const avatar = avatarOf(m, login);
  return { color: ownerColor(login), ...(avatar && { avatar }), you: plot.id === m.me };
}
