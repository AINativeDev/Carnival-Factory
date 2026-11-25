import { describe, expect, it } from 'vitest';
import { analyticsConfig, capture, startAnalytics, type Page } from './analytics';

const config = { key: 'phc_test', host: 'https://eu.i.posthog.com' };

describe('analyticsConfig: off until it is set', () => {
  it('stays off without a key and a host, as in previews and forks', () => {
    expect(analyticsConfig({})).toBeUndefined();
    expect(analyticsConfig({ VITE_POSTHOG_KEY: 'phc_test' })).toBeUndefined();
    expect(analyticsConfig({ VITE_POSTHOG_HOST: config.host })).toBeUndefined();
  });

  it('switches on with both, and only for an https host', () => {
    expect(
      analyticsConfig({ VITE_POSTHOG_KEY: 'phc_test', VITE_POSTHOG_HOST: `${config.host}/` }),
    ).toEqual(config);
    expect(
      analyticsConfig({ VITE_POSTHOG_KEY: 'phc_test', VITE_POSTHOG_HOST: 'http://x.test' }),
    ).toBeUndefined();
  });
});

describe('capture: one cookieless event', () => {
  it('sends an anonymous event with no person profile to the capture endpoint', () => {
    const sent: { url: string; body: string }[] = [];
    capture(
      config,
      'page-1',
      { event: 'map_viewed', properties: {} },
      'https://x.test/#/',
      (url, body) => {
        sent.push({ url, body });
        return true;
      },
    );
    expect(sent[0]?.url).toBe('https://eu.i.posthog.com/i/v0/e/');
    const body = JSON.parse(sent[0]?.body ?? '{}') as Record<string, unknown>;
    expect(body).toMatchObject({
      api_key: 'phc_test',
      event: 'map_viewed',
      distinct_id: 'page-1',
      properties: { $process_person_profile: false, $current_url: 'https://x.test/#/' },
    });
  });
});

/** A page that records its listeners, so the test can fire them. */
function fakePage(hash: string) {
  const listeners: Partial<Record<string, (event: { target: unknown }) => void>> = {};
  const page: Page = {
    location: { hash, href: `https://x.test/${hash}` },
    addEventListener: (type, listener) => (listeners[type] = listener as never),
  };
  return { page, listeners };
}

describe('startAnalytics', () => {
  it('does nothing at all when analytics is off', () => {
    const { page, listeners } = fakePage('#/');
    const sent: string[] = [];
    startAnalytics(
      undefined,
      page,
      () => 'id',
      (_url, body) => sent.push(body) > 0,
    );
    expect(sent).toEqual([]);
    expect(listeners).toEqual({});
  });

  it('counts the first view, every route change, and the clicks that matter', () => {
    const { page, listeners } = fakePage('#/booth/ana');
    const events: string[] = [];
    const send = (_url: string, body: string) =>
      events.push((JSON.parse(body) as { event: string }).event) > 0;
    startAnalytics(config, page, () => 'id', send);
    page.location.hash = '#/factory';
    listeners.hashchange?.({ target: null });
    listeners.click?.({ target: { closest: () => null } });
    listeners.click?.({ target: null });
    expect(events).toEqual(['square_opened', 'factory_viewed']);
  });
});
