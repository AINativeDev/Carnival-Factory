// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { bannerTitle } from './visit-banner';

afterEach(() => {
  document.body.replaceChildren();
});

describe("the square's name in the top bar", () => {
  it("stands beside the site's name with its maker, as text, until the visit ends", () => {
    document.body.innerHTML = '<header class="banner"><a class="brand"></a><nav></nav></header>';
    const title = bannerTitle('@ana');
    title.name('<b>Night Run</b>');
    const pill = document.querySelector('.brand + .banner-square');
    expect(pill?.textContent).toBe('<b>Night Run</b> by @ana');
    title.stop();
    expect(document.querySelector('.banner-square')).toBeNull();
  });

  it("names the North Pole's own squares alone, and copes with a page without a top bar", () => {
    const title = bannerTitle('');
    title.name('Ferris Wheel');
    expect(document.querySelector('.banner-square')).toBeNull();
    document.body.innerHTML = '<header class="banner"><a class="brand"></a></header>';
    bannerTitle('').name('Ferris Wheel');
    expect(document.querySelector('.banner-square')?.textContent).toBe('Ferris Wheel');
  });
});
