import { describe, expect, it } from 'vitest';
import { keepPostedHref } from './links';

describe('keepPostedHref', () => {
  it('goes to the placeholder page while there is no form yet', () => {
    expect(keepPostedHref('')).toBe('#/keep-posted');
  });

  it('goes straight to the form once its address is set', () => {
    expect(keepPostedHref('https://forms.example.com/north-pole')).toBe(
      'https://forms.example.com/north-pole',
    );
  });
});
