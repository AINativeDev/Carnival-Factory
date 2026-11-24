import { REPO_URL } from './links';
import { cleanChoice, type PeoplesChoice } from './peoples-choice';

declare const __PEOPLES_CHOICE__: unknown;

/**
 * The People's Choice standings as the build found them. The build already left out the booths the
 * kill switch closed (vite.config.ts), so this module imports no JSON and the smoke test can load
 * the map's drawing in Node.
 */
export const PEOPLES_CHOICE: PeoplesChoice | undefined = cleanChoice(
  typeof __PEOPLES_CHOICE__ === 'undefined' ? undefined : __PEOPLES_CHOICE__,
  [],
  REPO_URL,
);
