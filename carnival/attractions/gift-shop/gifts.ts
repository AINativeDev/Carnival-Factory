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

/** One of the shop's gifts, as the gift tag shows it. */
export type Gift = (typeof GIFTS)[number];

/** The one command that installs gift `skill` from this repository. */
export function installCommand(skill: string): string {
  return `tessl install ${GIFT_SOURCE} --skill ${skill}`;
}
