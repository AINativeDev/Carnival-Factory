/**
 * Cookieless analytics with PostHog (docs/adr/0028-analytics.md). Off unless the
 * deploy sets VITE_POSTHOG_KEY and VITE_POSTHOG_HOST (the repository variables
 * POSTHOG_KEY and POSTHOG_HOST), so previews, forks and local runs send nothing.
 * When on, it sends the named events in analytics-events.ts as anonymous events:
 * no cookies, no storage, no person profiles, and an id that lives only as long
 * as the page.
 */
import {
  clickEvent,
  INTRO_EVENT,
  introEvent,
  routeEvent,
  type AnalyticsEvent,
  type Clicked,
} from './analytics-events';
import { parseHash } from './route';

export interface AnalyticsConfig {
  key: string;
  host: string;
}

/** The PostHog project to send to, or undefined (off) unless both are set. */
export function analyticsConfig(env: Record<string, string | undefined>) {
  const key = env.VITE_POSTHOG_KEY ?? '';
  const host = (env.VITE_POSTHOG_HOST ?? '').replace(/\/+$/, '');
  if (!key || !host.startsWith('https://')) return undefined;
  return { key, host } satisfies AnalyticsConfig;
}

/** Sends a body to a URL without waiting, as navigator.sendBeacon does. */
export type Send = (url: string, body: string) => boolean;

/** Sends one anonymous event to PostHog's capture endpoint. */
export function capture(
  config: AnalyticsConfig,
  pageId: string,
  { event, properties }: AnalyticsEvent,
  url: string,
  send: Send,
) {
  const body = JSON.stringify({
    api_key: config.key,
    event,
    distinct_id: pageId,
    timestamp: new Date().toISOString(),
    properties: { ...properties, $process_person_profile: false, $current_url: url },
  });
  send(`${config.host}/i/v0/e/`, body);
}

/** What startAnalytics needs of the window. */
export interface Page {
  location: { hash: string; href: string };
  addEventListener(
    type: 'hashchange' | 'click' | typeof INTRO_EVENT,
    listener: (event: { target: unknown; detail?: unknown }) => void,
  ): void;
}

/** Counts the first view, each change of view, the clicks that matter, and the intro opening and closing. */
export function startAnalytics(
  config: AnalyticsConfig | undefined,
  page: Page,
  newId: () => string,
  send: Send,
) {
  if (!config) return;
  const pageId = newId();
  // index.html runs this before the map in one bundle, so a send that throws
  // (sendBeacon switched off) must never stop the map from starting.
  const track = (event: AnalyticsEvent) => {
    try {
      capture(config, pageId, event, page.location.href, send);
    } catch {
      // A lost event is fine; a page that won't start is not.
    }
  };
  track(routeEvent(parseHash(page.location.hash)));
  page.addEventListener('hashchange', () => {
    track(routeEvent(parseHash(page.location.hash)));
  });
  page.addEventListener('click', ({ target }) => {
    const event = target ? clickEvent(target as Clicked) : undefined;
    if (event) track(event);
  });
  page.addEventListener(INTRO_EVENT, ({ detail }) => {
    const event = introEvent(detail);
    if (event) track(event);
  });
}

/* v8 ignore start -- the page's entry point, loaded by index.html */
if (typeof window !== 'undefined') {
  startAnalytics(
    analyticsConfig(import.meta.env),
    window,
    () => crypto.randomUUID(),
    (url, body) => navigator.sendBeacon(url, body),
  );
}
/* v8 ignore stop */
