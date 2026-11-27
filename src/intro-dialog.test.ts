// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { SITE_TITLE } from './edition';
import { buildDialog } from './intro-dialog';
import { BOOTH_REQUEST_URL } from './northpole/links';

describe("the intro's steps", () => {
  it('opens the booth form from "Write an issue", in a new tab, as Get a booth does', () => {
    const { dialog } = buildDialog();
    const steps = [...dialog.querySelectorAll('.intro-beat')];
    const link = dialog.querySelector<HTMLAnchorElement>('.intro-beat:first-child > a');
    expect(link?.getAttribute('href')).toBe(BOOTH_REQUEST_URL);
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toBe('noopener');
    expect(link?.textContent).toContain('Write an issue.');
    expect(link?.querySelector('canvas')).not.toBeNull();
    // The factory building it, and it landing on the map, are nothing to click.
    expect(steps.slice(1).map((step) => step.querySelector('a'))).toEqual([null, null]);
  });
});

describe("the intro's dialog", () => {
  it('is a labelled modal dialog over its backdrop: the title, the lead, three beats and two ways on', () => {
    const { backdrop, dialog, explore, build, write, scenes } = buildDialog();
    expect(
      backdrop.outerHTML
        .replaceAll(BOOTH_REQUEST_URL, 'BOOTH_FORM')
        .replace(SITE_TITLE, 'SITE_TITLE'),
    ).toMatchInlineSnapshot(
      `"<div class="intro-backdrop"><section class="intro" role="dialog" aria-modal="true" aria-labelledby="intro-title"><h2 class="intro-title" id="intro-title">Welcome to SITE_TITLE</h2><p class="intro-lead">Every stall here was asked for by someone. Here is how.</p><ol class="intro-beats"><li class="intro-beat"><a class="intro-beat-link" href="BOOTH_FORM" target="_blank" rel="noopener"><canvas class="intro-scene" height="240" width="240" aria-hidden="true"></canvas><p class="intro-line"><strong class="">Write an issue.</strong> Describe the booth you want in a GitHub issue.</p></a></li><li class="intro-beat"><canvas class="intro-scene" height="240" width="240" aria-hidden="true"></canvas><p class="intro-line"><strong class="">The factory builds it.</strong> A software factory builds it, tests it and checks it's safe.</p></li><li class="intro-beat"><canvas class="intro-scene" height="240" width="240" aria-hidden="true"></canvas><p class="intro-line"><strong class="">It lands on the map.</strong> Minutes later, it's on the map for everyone to visit.</p></li></ol><div class="intro-actions"><button class="intro-explore">Explore the North Pole</button><a class="intro-build" href="BOOTH_FORM" target="_blank" rel="noopener">Get a booth</a></div></section></div>"`,
    );
    expect(dialog.parentElement).toBe(backdrop);
    expect(explore.textContent).toBe('Explore the North Pole');
    expect([build.textContent, build.getAttribute('href'), build.target, build.rel]).toEqual([
      'Get a booth',
      BOOTH_REQUEST_URL,
      '_blank',
      'noopener',
    ]);
    expect(write.className).toBe('intro-beat-link');
    expect(scenes).toHaveLength(3);
  });
});

describe("the intro's scenes", () => {
  it('each draws on a 2D canvas of its own', () => {
    const asked = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    buildDialog();
    expect(asked.mock.calls).toEqual([['2d'], ['2d'], ['2d']]);
    asked.mockRestore();
  });
});
