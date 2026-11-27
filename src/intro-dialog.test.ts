// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
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
