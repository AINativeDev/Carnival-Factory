export const REPO_URL = 'https://github.com/AINativeDev/Northpole-Carnival-Factory';

/**
 * The one issue form for a booth: it builds your booth if you don't have one
 * yet, and changes it if you do.
 */
export const BOOTH_REQUEST_URL = `${REPO_URL}/issues/new?template=01-your-booth.yml`;

/** Where "claim a booth" links go: the same form, for someone without a booth. */
export const CLAIM_URL = BOOTH_REQUEST_URL;

/** Where "Build your own" links go: the same form, empty. */
export const BUILD_YOUR_OWN_URL = BOOTH_REQUEST_URL;

/** The longest booth name a remix link carries. */
const MAX_REMIX_NAME = 40;

/**
 * Where "Remix this booth" goes: the booth form, pre-filled to start from
 * `login`'s booth. The factory copies that booth into the new owner's own
 * folder and credits the original. The name is the booth's own text, so it's
 * capped and only ever goes in encoded.
 */
export function remixUrl(login: string, name: string): string {
  // A lone surrogate would make encodeURIComponent throw, so it becomes U+FFFD.
  const chars = [...name.replace(/\s+/g, ' ').trim()].map((char) =>
    /^[\uD800-\uDFFF]$/.test(char) ? '\uFFFD' : char,
  );
  const short =
    chars.length > MAX_REMIX_NAME
      ? `${chars.slice(0, MAX_REMIX_NAME - 1).join('')}…`
      : chars.join('');
  const start = `Start from @${login}'s ${short || 'booth'}`;
  const fields = {
    title: `My booth: a remix of @${login}'s booth`,
    what: `${start}, copied into my own booth and credited to @${login}. Then:\n\n`,
  };
  const query = Object.entries(fields)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  return `${BOOTH_REQUEST_URL}&${query}`;
}

/** A GitHub login's profile, or nothing for text that isn't a login. */
export function profileUrl(login: string): string | undefined {
  return /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i.test(login)
    ? `https://github.com/${login}`
    : undefined;
}

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
