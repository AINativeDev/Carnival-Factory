/**
 * The Booths panel's keys (src/booths-hud.ts): `/` focuses the search from
 * anywhere but a text field or inside a square, the arrow keys move through
 * the entries, Enter jumps to the first result and Esc clears the search, or
 * lets go of the picked square. Kept apart from the lists they move through.
 */
import { step } from './booth-panel';
import type { HudEntry } from './booths-hud-markup';
import type { MapControls, SquareKind } from './northpole/map';

/** What the keys work on. */
interface KeyParts {
  panel: HTMLDetailsElement;
  input: HTMLInputElement;
  map: MapControls;
  /** What the search found, the first of which Enter picks. */
  found(): readonly HudEntry[];
  showSearch(): void;
  pick(kind: SquareKind, id: string, walk: boolean): void;
}

/** The entries the arrow keys move through: the results while searching, otherwise every section shown. */
const buttons = (panel: HTMLElement) =>
  [...panel.querySelectorAll<HTMLButtonElement>('.hud-go')].filter(
    (button) => button.offsetParent !== null,
  );

/** A key pressed in the panel, on the search box or on an entry. */
function onPanelKey(parts: KeyParts, event: KeyboardEvent) {
  const { input } = parts;
  const target = event.target as HTMLElement;
  const inSearch = target === input;
  const onEntry = target.classList.contains('hud-go');
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    if (!inSearch && !onEntry) return;
    const list = buttons(parts.panel);
    const at = onEntry ? list.indexOf(target as HTMLButtonElement) : -1;
    const next = step(at, list.length, event.key === 'ArrowDown' ? 1 : -1);
    if (next >= 0) list.at(next)?.focus();
    // The arrow keys move through the list here, not the player.
    event.preventDefault();
    event.stopPropagation();
  } else if (event.key === 'Enter' && inSearch) {
    event.preventDefault();
    const first = parts.found().at(0);
    if (first) parts.pick(first.kind, first.id, false);
  } else if (event.key === 'Escape' && (inSearch || onEntry)) {
    event.stopPropagation();
    if (input.value) {
      input.value = '';
      parts.showSearch();
      input.focus();
    } else {
      parts.map.clearSelection();
    }
  }
}

/** `/` focuses the search, from anywhere but a text field or inside a square. */
function onSlash(parts: KeyParts, event: KeyboardEvent) {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target as HTMLElement | null;
  if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
    return;
  if (parts.map.visiting) return;
  event.preventDefault();
  parts.panel.open = true;
  parts.input.focus();
}

/** Listens for the panel's keys. Returns how to stop. */
export function startPanelKeys(parts: KeyParts): () => void {
  const panelKey = (event: KeyboardEvent) => {
    onPanelKey(parts, event);
  };
  const slash = (event: KeyboardEvent) => {
    onSlash(parts, event);
  };
  parts.panel.addEventListener('keydown', panelKey);
  window.addEventListener('keydown', slash);
  return () => {
    window.removeEventListener('keydown', slash);
    parts.panel.removeEventListener('keydown', panelKey);
  };
}
