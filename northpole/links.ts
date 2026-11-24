export const REPO_URL = 'https://github.com/AINativeDev/Northpole-Carnival-Factory';

/**
 * The one issue form for a booth: it builds your booth if you don't have one
 * yet, and changes it if you do.
 */
export const BOOTH_REQUEST_URL = `${REPO_URL}/issues/new?template=01-your-booth.yml`;

/** Where "claim a booth" links go: the same form, for someone without a booth. */
export const CLAIM_URL = BOOTH_REQUEST_URL;

/** Where "ask for a change" links go: the same form, for someone with a booth. */
export const CHANGE_URL = BOOTH_REQUEST_URL;
