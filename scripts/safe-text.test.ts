import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hiddenCharacters } from './injection-scan.ts';
import * as loadedOnce from './safe-text.ts';

/** Loaded afresh before each test, since the characters it escapes are set as it loads. */
let { safeInline } = loadedOnce;
beforeEach(async () => {
  vi.resetModules();
  ({ safeInline } = await import('./safe-text.ts'));
});

describe('safeInline', () => {
  it('keeps ordinary text as it is', () => {
    expect(safeInline("Santa's Toy Factory")).toBe("Santa's Toy Factory");
  });

  it('keeps @mentions from pinging anyone', () => {
    expect(safeInline('cc @everyone and @jedi4ever')).not.toMatch(/@\w/);
  });

  it('stops Markdown and HTML from rendering', () => {
    const out = safeInline('[click](https://evil.example) ![x](y) <img src=x> # Heading `code`');
    expect(out).not.toMatch(/(^|[^\\])[[\]()<>`#!]/);
  });

  it('keeps the text on one line, without hidden characters', () => {
    const sneaky = `a\nb\r${String.fromCodePoint(0x202e)}c${String.fromCodePoint(0x200b)}d`;
    const out = safeInline(sneaky);
    expect(out).not.toMatch(/[\n\r]/);
    expect(hiddenCharacters(out)).toEqual([]);
  });

  it('caps the length', () => {
    expect([...safeInline('x'.repeat(500), 40)]).toHaveLength(40);
  });

  it('escapes every Markdown and HTML character with a backslash', () => {
    expect(safeInline('a\\b`c*d_e[f]g(h)i<j>k#l!m|n~o{p}q')).toBe(
      'a\\\\b\\`c\\*d\\_e\\[f\\]g\\(h\\)i\\<j\\>k\\#l\\!m\\|n\\~o\\{p\\}q',
    );
    expect(safeInline('a-b.c,d\'e"f+g=h:i;j/k?l$m%n^o&p')).toBe('a-b.c,d\'e"f+g=h:i;j/k?l$m%n^o&p');
  });

  it('turns every @ into a full-width one, which pings nobody', () => {
    expect(safeInline('cc @everyone, me@home')).toBe('cc ＠everyone, me＠home');
  });

  it('turns control characters into spaces, and keeps the printable ones beside them', () => {
    const controls = [0x00, 0x09, 0x0a, 0x0d, 0x1f, 0x7f].map((code) => String.fromCodePoint(code));
    expect(safeInline(controls.map((c) => `x${c}`).join(''))).toBe('x x x x x x');
    expect(safeInline(`a${String.fromCodePoint(0x7e)}b ${String.fromCodePoint(0x80)}c`)).toBe(
      `a\\~b ${String.fromCodePoint(0x80)}c`,
    );
  });

  it('drops hidden characters without leaving a gap', () => {
    const hidden = [0x200b, 0x202e, 0x2066, 0xfeff, 0x00ad].map((code) =>
      String.fromCodePoint(code),
    );
    expect(safeInline(`sl${hidden.join('')}eigh`)).toBe('sleigh');
  });

  it('runs spaces together and trims them', () => {
    expect(safeInline('  a \t\n b   c  ')).toBe('a b c');
  });

  it('cuts at the cap with an ellipsis, counting characters, not code units', () => {
    expect(safeInline('abcdef', 6)).toBe('abcdef');
    expect(safeInline('abcdefg', 6)).toBe('abcde…');
    expect(safeInline('🎄'.repeat(6), 6)).toBe('🎄'.repeat(6));
    expect(safeInline('🎄'.repeat(7), 6)).toBe(`${'🎄'.repeat(5)}…`);
    expect(safeInline('y'.repeat(120))).toBe('y'.repeat(120));
    expect(safeInline('y'.repeat(121))).toBe(`${'y'.repeat(119)}…`);
  });
});
