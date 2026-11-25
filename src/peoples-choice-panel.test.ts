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

  it('stays hidden when the build has no standings', () => {
    const list = panel();
    renderChoice(list, undefined);
    expect(list.hidden).toBe(true);
  });
});
