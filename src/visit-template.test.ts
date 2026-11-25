import { describe, expect, it } from 'vitest';
import { keepPostedLink } from './visit-template';

describe('keepPostedLink', () => {
  it('opens the real form in a new tab once it is set', () => {
    expect(keepPostedLink('https://form.test', 'https://form.test')).toContain('target="_blank"');
  });

  it('stays on the site for the placeholder page until then', () => {
    expect(keepPostedLink('', '#/keep-posted')).not.toContain('target=');
  });
});
