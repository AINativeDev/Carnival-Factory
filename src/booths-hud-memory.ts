/**
 * What the Booths panel (src/booths-hud.ts) remembers: which booth is the
 * visitor's own, and which sections they folded. It lives in the page's own
 * storage only, never given to any square (docs/specs/booths-panel.md), and
 * a page without storage just forgets.
 */
import { byName, readState } from './booth-panel';
import type { HudEntry } from './booths-hud-markup';
import { the } from './dom';

/** Where the panel remembers who you are and which sections are folded: the page's storage, never a square's. */
const STORAGE_KEY = 'north-pole-booths-panel';

/** Who the visitor said they are, and the sections they folded. */
export interface PanelMemory {
  me: string | undefined;
  closed: string[];
}

/** Reads the panel's saved state, or nothing when the page's storage is off. */
export function loadMemory(): PanelMemory {
  try {
    const { me, closed } = readState(localStorage.getItem(STORAGE_KEY));
    return { me, closed };
  } catch {
    return { me: undefined, closed: [] };
  }
}

function saveMemory(memory: PanelMemory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // No storage: the panel just forgets.
  }
}

/** Folds the sections as remembered, and remembers them again as the visitor folds them. */
export function rememberFolds(panel: HTMLElement, memory: PanelMemory) {
  const sections = () => [...panel.querySelectorAll<HTMLDetailsElement>('.hud-section')];
  for (const section of sections()) {
    section.open = !memory.closed.includes(String(section.dataset.section));
    section.addEventListener('toggle', () => {
      memory.closed = sections()
        .filter((folded) => !folded.open)
        .map((folded) => String(folded.dataset.section));
      saveMemory(memory);
    });
  }
}

/**
 * "This is me": the visitor picks their own booth from every booth A to Z,
 * and the page remembers it. `onMe` tells the map. Returns how to say who
 * the visitor is from elsewhere, such as a visit's "Share it as yours".
 */
export function startThisIsMe(
  panel: HTMLElement,
  booths: readonly HudEntry[],
  memory: PanelMemory,
  onMe: (login: string | undefined) => void,
): (login: string | undefined) => void {
  const mine = the(panel, '.hud-me-select', HTMLSelectElement);
  for (const entry of byName(booths)) {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = `@${entry.id}`;
    mine.append(option);
  }
  const showMe = () => {
    const { me } = memory;
    mine.value = me && booths.some((booth) => booth.id === me) ? me : '';
  };
  const setMe = (login: string | undefined) => {
    memory.me = login;
    onMe(login);
    showMe();
    saveMemory(memory);
  };
  showMe();
  mine.addEventListener('change', () => {
    setMe(mine.value || undefined);
  });
  onMe(memory.me);
  return setMe;
}
