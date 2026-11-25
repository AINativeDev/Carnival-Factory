import { theme } from '../../../src/northpole/theme';

const { colors } = theme;

/** The repository the gifts install from. */
export const GIFT_SOURCE = 'github:AINativeDev/Northpole-Carnival-Factory';

/**
 * The gifts on the shelves: the skills in `plugins/north-pole-gifts/`, each
 * with what it does and the colour of its wrapping.
 */
export const GIFTS = [
  {
    skill: 'stocking-stuffer',
    name: 'Stocking stuffer',
    does: 'Bumps one outdated dependency a week',
    wrap: colors.berry,
  },
  {
    skill: 'tidy-elf',
    name: 'Tidy elf',
    does: "Lists the README's broken commands and links",
    wrap: colors.pine,
  },
  {
    skill: 'gift-tag',
    name: 'Gift tag',
    does: 'Labels new issues, asks when one is vague',
    wrap: colors.violet,
  },
  {
    skill: 'snow-plough',
    name: 'Snow plough',
    does: 'Lists stale branches and drafts, deletes nothing',
    wrap: colors.ice,
  },
  {
    skill: 'wrapping-paper',
    name: 'Wrapping paper',
    does: 'Drafts release notes since the last tag',
    wrap: colors.gold,
  },
] as const;

/** One gift on the shelf, as the gift tag shows it. */
export type Gift = (typeof GIFTS)[number];

/** How long the shop keeps each gift in the spotlight, in milliseconds. */
export const SHOW = 4_000;

/** Which gift is in the spotlight at `time`: each in turn, for `SHOW` each. */
export function inSpotlight(time: number): number {
  const turn = Math.floor(time / SHOW) % GIFTS.length;
  return (turn + GIFTS.length) % GIFTS.length;
}

/** The gift whose turn `inSpotlight` says it is, so the tag always has one to show. */
export function giftInSpotlight(time: number): Gift {
  return GIFTS[inSpotlight(time)] ?? GIFTS[0];
}

/** The one command that installs gift `skill` from this repository. */
export function installCommand(skill: string): string {
  return `tessl install ${GIFT_SOURCE} --skill ${skill}`;
}
