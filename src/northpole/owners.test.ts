import { describe, expect, it } from 'vitest';
import {
  OWNER_COLORS,
  arrowBounce,
  avatarPath,
  highlightAt,
  inviteFor,
  inviteOpacity,
  ownerColor,
  shorten,
} from './owners';
import { theme } from './theme';

describe('owner colours', () => {
  it('picks the same colour for a login every time, ignoring case', () => {
    expect(ownerColor('jedi4ever')).toBe(ownerColor('Jedi4ever'));
    expect(OWNER_COLORS).toContain(ownerColor('jedi4ever'));
  });

  it('spreads logins over the palette', () => {
    const logins = Array.from({ length: 80 }, (_, n) => `elf-${n}`);
    expect(new Set(logins.map((login) => ownerColor(login))).size).toBe(OWNER_COLORS.length);
  });

  it('keeps the North Pole red and white for the attractions', () => {
    expect(OWNER_COLORS).not.toContain(theme.colors.berry);
    expect(OWNER_COLORS).not.toContain(theme.colors.snow);
  });
});

describe('signs', () => {
  it('finds the build-time avatar by login, in lower case', () => {
    expect(avatarPath('Jedi4ever')).toBe('avatars/jedi4ever.png');
  });

  it('shortens a long name with an ellipsis', () => {
    expect(shorten("Santa's Toy Factory", 30)).toBe("Santa's Toy Factory");
    expect(shorten("Santa's Toy Factory", 8)).toBe("Santa's…");
  });
});

describe('the highlight on a picked square', () => {
  it('stays full for a while, then fades out', () => {
    expect(highlightAt(0)).toBe(1);
    expect(highlightAt(4000)).toBe(1);
    expect(highlightAt(5250)).toBeCloseTo(0.5);
    expect(highlightAt(6000)).toBe(0);
    expect(highlightAt(-1)).toBe(0);
  });

  it('keeps the arrow still with reduced motion', () => {
    expect(arrowBounce(1234, true)).toBe(0);
    expect(arrowBounce(500, false)).toBeGreaterThan(0);
  });
});

describe('the call to action over a door', () => {
  it('waits a moment, then fades in', () => {
    expect(inviteOpacity(0)).toBe(0);
    expect(inviteOpacity(400)).toBe(0);
    expect(inviteOpacity(550)).toBeCloseTo(0.5);
    expect(inviteOpacity(2000)).toBe(1);
  });

  it('invites into the picked square first, otherwise the one you stand at', () => {
    expect(inviteFor('picked', 'near')).toBe('picked');
    expect(inviteFor(undefined, 'near')).toBe('near');
    expect(inviteFor(undefined, undefined)).toBeUndefined();
  });
});
