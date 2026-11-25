/**
 * Keeps the page on the latest build. GitHub Pages lets browsers and its CDN
 * keep the page for up to 10 minutes, so a new build can stay hidden that
 * long. Each build writes `version.json` with its id; the page asks for it
 * with a query that changes every time, so no cache answers, and moves to the
 * new build as soon as there is one.
 *
 * This is the page's own file on its own site: squares still never reach the
 * network.
 */

/**
 * This build's id, set by Vite when it builds, and `dev` while developing or
 * testing: vite.config.ts defines it in every mode, so it is always there.
 */
declare const __BUILD_ID__: string;
export const BUILD_ID: string = __BUILD_ID__;

/** How often an open page checks for a new build. */
const CHECK_EVERY_MS = 5 * 60 * 1000;
/** A page this young reloads quietly: nobody has started looking around yet. */
export const QUIET_RELOAD_MS = 10 * 1000;

export type UpdateAction = 'none' | 'reload' | 'offer';

/**
 * What to do when the published build is `latest`, this page has been open for
 * `openForMs`, and `triedFor` is the build its address already asked for
 * (`?v=`). A page that already asked for `latest` and still isn't it never
 * reloads again: it offers instead, so a stale cache can't cause a loop.
 */
export function decideUpdate(
  current: string,
  latest: string | undefined,
  openForMs: number,
  triedFor?: string | null,
): UpdateAction {
  if (current === 'dev' || !latest || latest === current) return 'none';
  if (triedFor === latest) return 'offer';
  return openForMs < QUIET_RELOAD_MS ? 'reload' : 'offer';
}

/**
 * Goes to the new build at an address no cache has seen: the same page with
 * `?v=<build>`, keeping the hash, so the request reaches the newest page.
 */
function moveTo(latest: string) {
  const url = new URL(location.href);
  url.searchParams.set('v', latest);
  location.replace(url.href);
}

/** Reads the published build's id, bypassing every cache; undefined if it can't. */
async function latestBuild(base = document.baseURI): Promise<string | undefined> {
  try {
    const url = new URL(`version.json?t=${Date.now()}`, base);
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return undefined;
    const { build } = (await response.json()) as { build?: unknown };
    return typeof build === 'string' ? build : undefined;
  } catch {
    return undefined;
  }
}

/** Shows a small note offering the new build, once. */
function offerReload(latest: string) {
  if (document.querySelector('.update-note')) return;
  const note = document.createElement('div');
  note.className = 'update-note';
  note.setAttribute('role', 'status');
  note.innerHTML = `The North Pole just changed. <button type="button">See what's new</button>`;
  note.querySelector('button')!.addEventListener('click', () => moveTo(latest));
  document.body.append(note);
}

/**
 * Checks now, again every few minutes, and whenever the page comes back into
 * view. `build` is this page's build, never checked while developing.
 */
export function keepUpToDate(build = BUILD_ID) {
  if (build === 'dev') return;
  const openedAt = performance.now();
  const triedFor = new URL(location.href).searchParams.get('v');
  const check = async () => {
    const latest = await latestBuild();
    const action = decideUpdate(build, latest, performance.now() - openedAt, triedFor);
    if (latest && action === 'reload') moveTo(latest);
    if (latest && action === 'offer') offerReload(latest);
  };
  void check();
  setInterval(() => void check(), CHECK_EVERY_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void check();
  });
}
