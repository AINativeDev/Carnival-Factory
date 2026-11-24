import { describe, expect, it } from 'vitest';
import { hiddenCharacters } from './injection-scan.ts';
import { safeInline } from './safe-text.ts';

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
});
