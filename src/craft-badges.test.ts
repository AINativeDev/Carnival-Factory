import { describe, expect, it } from 'vitest';
import { cleanCraft, craftKey, earnedBadges, renderCraft, type Maker } from './craft-badges';

describe('cleanCraft: the badges baked into the page, checked', () => {
  it('keeps known badges for well-formed squares, and drops anything else', () => {
    expect(
      cleanCraft({
        'booth/ana': ['tested', 'small-files', 'made-up'],
        'level/bo/hut': ['documented'],
        'nonsense key': ['tested'],
        'booth/cy': 'tested',
      }),
    ).toEqual({ 'booth/ana': ['tested', 'small-files'], 'level/bo/hut': ['documented'] });
    expect(cleanCraft(null)).toEqual({});
    expect(cleanCraft([])).toEqual({});
  });
});

describe('craftKey', () => {
  it("names a square the way the build does, a level's own squares included", () => {
    expect(craftKey('booth', 'Ana')).toBe('booth/ana');
    expect(craftKey('attraction', 'big-top')).toBe('attraction/big-top');
    expect(craftKey('attraction', 'hut', 'bo')).toBe('level/bo/hut');
  });
});

describe('earnedBadges', () => {
  it('lists only what a square earned, in a fixed order, with what each means', () => {
    const craft = { 'booth/ana': ['tested', 'small-files'] };
    expect(earnedBadges(craft, 'booth/ana').map((badge) => badge.label)).toEqual([
      'Small files',
      'Tested',
    ]);
    expect(earnedBadges(craft, 'booth/ana')[0]?.title).toMatch(/200 lines/);
    expect(earnedBadges(craft, 'booth/nobody')).toEqual([]);
  });
});

/** A document that records what it was asked to build. */
interface Fake {
  tag: string;
  className: string;
  textContent: string;
  title: string;
  href: string;
  target: string;
  rel: string;
  hidden: boolean;
  children: Fake[];
  append(...nodes: Fake[]): void;
}
const make: Maker = (tag) => {
  const node: Fake = {
    tag,
    className: '',
    textContent: '',
    title: '',
    href: '',
    target: '',
    rel: '',
    hidden: false,
    children: [],
    append: (...nodes) => node.children.push(...nodes),
  };
  return node as unknown as HTMLElement;
};

describe('renderCraft', () => {
  it('shows each earned badge as text with its meaning, and how squares are checked', () => {
    const line = make('p') as unknown as Fake;
    renderCraft(
      line as unknown as HTMLElement,
      earnedBadges({ 'booth/ana': ['tested'] }, 'booth/ana'),
      make,
    );
    const label = line.children.at(0);
    const badge = line.children.at(1);
    const link = line.children.at(2);
    expect(label).toMatchObject({ className: 'visit-craft-label', textContent: 'Code:' });
    expect(badge).toMatchObject({ className: 'visit-craft-badge', textContent: 'Tested' });
    expect(link?.href).toMatch(/docs\/specs\/booth-craft\.md$/);
    expect(line.hidden).toBe(false);
  });

  it('hides the line for a square with no badges, so nothing reads as a mark against it', () => {
    const line = make('p') as unknown as Fake;
    renderCraft(line as unknown as HTMLElement, [], make);
    expect(line.hidden).toBe(true);
    expect(line.children).toEqual([]);
  });
});
