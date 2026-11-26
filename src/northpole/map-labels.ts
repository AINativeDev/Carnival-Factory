/**
 * What each spot on the map is and says: the square that stands on it, its
 * sleigh platform's or construction site's sign, and the owner whose colour
 * and avatar a booth shows. The scene, the tags and the prompt all ask these,
 * so they live in one place apart from the drawing.
 */
import { offMapSpot } from './off-map';
import type { SquareKind } from './map-options';
import type { MapRun } from './map-state';
import { avatarPath, ownerColor } from './owners';
import { STAGE_TEXT } from './construction-sites';
import { type Owner } from './name-board';
import { theme } from './theme';
import { targetAt } from './visit';
import type { Spot, Tile } from './world';

const { colors } = theme;

/** The square that stands on a spot, if it's a booth's or an attraction's. */
export const squareOf = (m: MapRun, spot: Spot) =>
  spot.kind === 'attraction' || spot.kind === 'booth'
    ? m.squares[spot.kind].get(spot.id ?? '')
    : undefined;

/** The spot a square stands on, or an off-map attraction's way in (off-map.ts). */
export const spotOf = (m: MapRun, kind: SquareKind, id: string) =>
  m.world.spots.find((spot) => spot.kind === kind && spot.id === id) ??
  offMapSpot(m.world, kind, id);

/** The spot whose structure or sign is under a point of the world, frontmost first. */
export const spotUnder = (m: MapRun, point: Tile) => targetAt(m.targets, point)?.spot;

/** What a sleigh platform's sign says: the level it goes to, or, inside a level, the way home. */
export function platformLabel(m: MapRun, spot: Spot) {
  if (spot.kind === 'exit')
    return {
      name: 'The North Pole',
      by: 'Sleigh home',
      color: m.options.level?.tint ?? colors.gold,
      closed: false,
    };
  const entry = m.stations.get(spot.id ?? '');
  return {
    name: entry?.name ?? spot.id ?? '',
    by: entry?.owner ?? `@${String(spot.id)}`,
    color: entry?.color ?? colors.gold,
    closed: entry?.closed ?? true,
  };
}

/** What a construction site's sign says. */
export function siteLabel(m: MapRun, spot: Spot) {
  const entry = m.pending.get(spot.id ?? '');
  return { login: spot.id ?? '', stage: entry ? STAGE_TEXT[entry.stage] : STAGE_TEXT.building };
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

/** Who owns a booth's spot: their colour, their avatar, and whether it's the visitor's own. */
export function ownerOf(m: MapRun, spot: Spot): Owner | undefined {
  if (spot.kind !== 'booth') return undefined;
  const login = spot.id ?? '';
  const avatar = avatarOf(m, login);
  return { color: ownerColor(login), ...(avatar && { avatar }), you: spot.id === m.me };
}
