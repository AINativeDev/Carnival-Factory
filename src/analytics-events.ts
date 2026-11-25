/**
 * The deliberate list of what the map tells PostHog (docs/adr/0028-analytics.md):
 * which view people open, and the few things they do that show whether the
 * carnival works: starting a request, sharing, going to the repository. Only
 * public ids travel (a booth's login, a level's), never anything a visitor typed.
 */
import { REPO_URL } from './northpole/links';
import type { Route } from './route';

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, string>;
}

/** The event for a view of the page, from its parsed route. */
export function routeEvent(route: Route): AnalyticsEvent {
  switch (route.view) {
    case 'square':
      return { event: 'square_opened', properties: { kind: route.kind, id: route.id } };
    case 'level':
      return {
        event: 'level_opened',
        properties: { level: route.login, ...(route.inside ? { square: route.inside } : {}) },
      };
    case 'season':
      return { event: 'season_viewed', properties: { login: route.login } };
    case 'factory':
      return { event: 'factory_viewed', properties: {} };
    case 'advent':
      return { event: 'advent_viewed', properties: {} };
    case 'map':
      return { event: 'map_viewed', properties: route.focus ? { ...route.focus } : {} };
    case 'legacy':
      return { event: 'map_viewed', properties: {} };
  }
}

/** What clickEvent needs of a clicked element: the DOM's `closest`. */
export interface Clicked {
  closest(selector: string): { href?: string; className?: string } | null;
}

const ISSUE_FORM = `${REPO_URL}/issues/new?template=`;

/** The event for a click, if it's one of the few that matter. */
export function clickEvent(target: Clicked): AnalyticsEvent | undefined {
  const href = target.closest('a[href]')?.href ?? '';
  if (href.startsWith(ISSUE_FORM)) {
    // The link starts with `?template=`, so the parameter is always there.
    const form = String(new URL(href).searchParams.get('template'));
    return { event: 'request_started', properties: { form } };
  }
  if (target.closest('.visit-copy')) return { event: 'share_copied', properties: {} };
  if (target.closest('.repo-link')) return { event: 'repo_opened', properties: {} };
  return undefined;
}

/**
 * The page event the first-visit intro (src/intro.ts) sends when it opens or
 * closes, for analytics to count: its detail is `opened`, or how it closed.
 */
export const INTRO_EVENT = 'north-pole-intro';

/** How the intro closed: Skip (or Esc, or a click outside it), Explore, or Build. */
export type IntroClose = 'skip' | 'explore' | 'build';

/** The event for the intro opening or closing, if the detail is one it sends. */
export function introEvent(detail: unknown): AnalyticsEvent | undefined {
  if (detail === 'opened') return { event: 'intro_opened', properties: {} };
  if (detail === 'skip' || detail === 'explore' || detail === 'build')
    return { event: 'intro_closed', properties: { how: detail } };
  return undefined;
}
