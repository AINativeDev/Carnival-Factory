// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { applyTheme, theme } from './theme';

describe("the theme in the page's CSS", () => {
  it('sets every colour, the font and the corner radius on the page itself', () => {
    applyTheme();
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--color-gold')).toBe(theme.colors.gold);
    expect(style.getPropertyValue('--font-family')).toBe(theme.font.family);
    expect(style.getPropertyValue('--radius')).toBe(`${String(theme.radius)}px`);
  });

  it('can theme just one element', () => {
    const panel = document.createElement('section');
    applyTheme(panel);
    expect(panel.style.getPropertyValue('--color-gold')).toBe(theme.colors.gold);
  });
});
