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

/**
 * The opt-in "keep me posted" form: a private form, run outside this site,
 * that asks for a GitHub handle and an email with explicit consent. The site
 * only links to it. Empty until a maintainer fills it in, and until then the
 * link goes to a page here that says the list opens soon and collects nothing.
 */
export const KEEP_POSTED_URL = '';

/** Where "Keep me posted" links go: the real form once it's set, or the placeholder page. */
export const keepPostedHref = (url: string = KEEP_POSTED_URL) => url || '#/keep-posted';

/** How a booth request becomes a booth on the map, for visitors who wonder. */
export const HOW_IT_WORKS_URL = `${REPO_URL}/blob/main/docs/how-it-works.md`;

/** "Run this on your own repo": how to set up a Tessl factory on a repository of your own. */
export const OWN_REPO_URL = `${REPO_URL}#try-it-on-your-own`;

/**
 * The free credits offer for people who sign up for Tessl, shown beside the
 * "own repo" link: where it goes, and its one short line. Both empty until a
 * maintainer fills them in, and until then the offer stays hidden.
 */
export const TESSL_SIGNUP_URL = '';
export const TESSL_SIGNUP_OFFER = '';

/** The offer to show, or nothing while either half is missing or the link isn't https. */
export function signupOffer(
  url: string = TESSL_SIGNUP_URL,
  text: string = TESSL_SIGNUP_OFFER,
): { url: string; text: string } | undefined {
  return /^https:\/\//i.test(url) && text.trim() ? { url, text: text.trim() } : undefined;
}
