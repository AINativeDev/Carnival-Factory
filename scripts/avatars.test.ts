import { describe, expect, it } from 'vitest';
import { AVATAR_MAX_BYTES, avatarUrl, isAvatar, isLogin } from './avatars';

describe('build-time avatars', () => {
  it('asks GitHub only for real logins', () => {
    expect(isLogin('jedi4ever')).toBe(true);
    expect(isLogin('a-b')).toBe(true);
    expect(isLogin('-a')).toBe(false);
    expect(isLogin('a--b')).toBe(false);
    expect(isLogin('../x')).toBe(false);
    expect(isLogin('x'.repeat(40))).toBe(false);
  });

  it('asks for a 128 pixel avatar', () => {
    expect(avatarUrl('jedi4ever')).toBe('https://github.com/jedi4ever.png?size=128');
  });

  it('keeps only small images', () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]);
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(isAvatar(png)).toBe(true);
    expect(isAvatar(jpeg)).toBe(true);
    expect(isAvatar(new TextEncoder().encode('GIF89a and more'))).toBe(true);
    // Only the whole signature counts: a first byte or two alone is something else.
    expect(isAvatar(new TextEncoder().encode('Gx-------'))).toBe(false);
    expect(isAvatar(new TextEncoder().encode('GIx------'))).toBe(false);
    expect(isAvatar(new Uint8Array([0xff, 0xd8, 0, 0, 0, 0, 0, 0]))).toBe(false);
    expect(isAvatar(new TextEncoder().encode('<html>not found</html>'))).toBe(false);
    const huge = new Uint8Array(AVATAR_MAX_BYTES + 1);
    huge.set(png);
    expect(isAvatar(huge)).toBe(false);
  });
});
