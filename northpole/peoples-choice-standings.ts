import disabled from './disabled.json';
import { REPO_URL } from './links';
import { cleanChoice, type PeoplesChoice } from './peoples-choice';

declare const __PEOPLES_CHOICE__: unknown;

/** The People's Choice standings as the build found them, without the booths the kill switch closed. */
export const PEOPLES_CHOICE: PeoplesChoice | undefined = cleanChoice(
  typeof __PEOPLES_CHOICE__ === 'undefined' ? undefined : __PEOPLES_CHOICE__,
  disabled.booths,
  REPO_URL,
);
