// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { CHOICE_PANEL, renderChoice } from './peoples-choice-hud';

const BALLOT = 'https://github.com/AINativeDev/Northpole-Carnival-Factory/issues/7';

/** The panel below the map, as the page builds it, still hidden. */
function panel(): HTMLDetailsElement {
  document.body.innerHTML = CHOICE_PANEL;
  const found = document.querySelector('details');
  if (!found) throw new Error("No People's Choice panel");
  found.hidden = true;
  return found;
}

describe("the People's Choice panel", () => {
  it('shows the standings and links "Vote on GitHub" to the ballot issue', () => {
    const list = panel();
    renderChoice(list, {
      ballot: BALLOT,
      booths: [{ login: 'ana', url: `${BALLOT}#issuecomment-1`, votes: 3 }],
      factories: [],
    });
    expect(list.hidden).toBe(false);
    const vote = list.querySelector<HTMLAnchorElement>('.choice-ballot');
    expect(vote?.textContent).toBe('Vote on GitHub');
    expect(vote?.href).toBe(BALLOT);
    expect(list.querySelector('.choice-booths')?.textContent).toContain('ana');
  });

  it("lists every entry's place and votes, linking a home factory to its repository", () => {
    const list = panel();
    renderChoice(list, {
      ballot: BALLOT,
      booths: [
        { login: 'ana', url: `${BALLOT}#issuecomment-1`, votes: 1 },
        { login: 'bob', url: `${BALLOT}#issuecomment-2`, votes: 0 },
      ],
      factories: [
        { login: 'zoe', url: `${BALLOT}#issuecomment-3`, votes: 2, repo: 'zoe/elf-factory' },
        { login: 'max', url: `${BALLOT}#issuecomment-4`, votes: 2 },
      ],
    });
    const rows = (selector: string) =>
      [...list.querySelectorAll(`${selector} li`)].map((row) => row.textContent);
    expect(rows('.choice-booths')).toEqual(['1. @ana 1 vote', ' @bob 0 votes']);
    expect(rows('.choice-factories')).toEqual(['1. @zoe 2 votes', '1. @max 2 votes']);
    const links = [...list.querySelectorAll<HTMLAnchorElement>('.choice-factories a')];
    expect(links.map((link) => [link.href, link.target, link.rel])).toEqual([
      ['https://github.com/zoe/elf-factory', '_blank', 'noopener'],
      [`${BALLOT}#issuecomment-4`, '', ''],
    ]);
  });

  it('says so when a category has no entries yet', () => {
    const list = panel();
    renderChoice(list, { ballot: BALLOT, booths: [], factories: [] });
    expect(list.querySelector('.choice-factories')?.textContent).toBe('No entries yet.');
  });

  it('stays hidden when the build has no standings', () => {
    const list = panel();
    renderChoice(list, undefined);
    expect(list.hidden).toBe(true);
  });
});
