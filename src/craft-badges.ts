/**
 * A square's craft badges on its panel (docs/adr/0029-booth-craft.md): the code
 * conventions its folder meets, worked out by the build from the square's own
 * files. Only badges a square earned are shown, never one it missed, since a
 * participant's work is on public display.
 */
import { REPO_URL } from './northpole/links';
import type { SquareKind } from './northpole/map';

declare const __SQUARE_CRAFT__: unknown;

/** Each badge, in the order the panel shows them, with what it means. */
const BADGES = [
  { id: 'small-files', label: 'Small files', title: 'Every code file is 200 lines or fewer.' },
  { id: 'tested', label: 'Tested', title: 'Tests check what its code does.' },
  {
    id: 'documented',
    label: 'Documented',
    title: 'A README, and a comment on everything it shares saying what it is for.',
  },
  { id: 'clear-names', label: 'Clear names', title: 'Its names say what things are in the scene.' },
] as const;

export type CraftBadge = (typeof BADGES)[number];
type Craft = Partial<Record<string, string[]>>;

const KNOWN = new Set<string>(BADGES.map((badge) => badge.id));
const KEY = /^(booth|attraction)\/[a-z0-9-]+$|^level\/[a-z0-9-]+\/[a-z0-9-]+$/;

/** The build's badges, keeping only well-formed squares and badges it knows. */
export function cleanCraft(raw: unknown): Craft {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const craft: Craft = {};
  for (const [key, badges] of Object.entries(raw)) {
    if (!KEY.test(key) || !Array.isArray(badges)) continue;
    craft[key] = badges.filter((badge): badge is string => KNOWN.has(String(badge)));
  }
  return craft;
}

/** The badges this build baked in. */
export const SQUARE_CRAFT = cleanCraft(
  typeof __SQUARE_CRAFT__ === 'undefined' ? undefined : __SQUARE_CRAFT__,
);

/** A square's key, as the build writes it: a level's own squares under the level. */
export const craftKey = (kind: SquareKind, id: string, level?: string) =>
  level ? `level/${level.toLowerCase()}/${id}` : `${kind}/${id.toLowerCase()}`;

/** The badges a square earned, with their labels and meanings. */
export const earnedBadges = (craft: Craft, key: string): CraftBadge[] =>
  BADGES.filter((badge) => craft[key]?.includes(badge.id));

/** Makes an element, as document.createElement does. */
export type Maker = (tag: string) => HTMLElement;

/**
 * Fills `line` with one quiet line of the earned badges, "Code: small files · tested",
 * and a link to what they mean; hides it when there are none.
 */
export function renderCraft(line: HTMLElement, badges: CraftBadge[], make: Maker) {
  line.hidden = badges.length === 0;
  if (line.hidden) return;
  const label = make('span');
  label.className = 'visit-craft-label';
  label.textContent = 'Code:';
  line.append(label);
  for (const badge of badges) {
    const tag = make('span');
    tag.className = 'visit-craft-badge';
    tag.textContent = badge.label;
    tag.title = badge.title;
    line.append(tag);
  }
  const about = make('a') as HTMLAnchorElement;
  about.className = 'visit-craft-about';
  about.textContent = 'How squares are checked';
  about.href = `${REPO_URL}/blob/main/docs/specs/booth-craft.md`;
  about.target = '_blank';
  about.rel = 'noopener';
  line.append(about);
}
