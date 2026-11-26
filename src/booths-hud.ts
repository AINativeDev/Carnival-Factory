import type { MapControls, SquareKind } from './northpole/map';
import type { NorthPoleSquare } from './northpole/square';
import { startPanelKeys } from './booths-hud-keys';
import { startLists, type PanelLists } from './booths-hud-lists';
import { entryItem, type HudEntry } from './booths-hud-markup';
import { loadMemory, rememberFolds, startThisIsMe } from './booths-hud-memory';
import { the } from './dom';

/**
 * When each booth's folder first appeared, and every square's name, set by
 * Vite in every mode, tests included (vite.config.ts): only the page loads this.
 */
declare const __BOOTH_ADDED__: Record<string, string>;
declare const __SQUARE_NAMES__: Record<string, string>;
const ADDED: Record<string, string> = __BOOTH_ADDED__;
const NAMES: Record<string, string> = __SQUARE_NAMES__;

export interface BoothsPanelOptions {
  attractions: readonly NorthPoleSquare[];
  booths: readonly NorthPoleSquare[];
  /** The square featured at the top. */
  featured?: { kind: SquareKind; square: NorthPoleSquare } | undefined;
  /** Calls `show` now and again once the square has said its name. */
  whenNamed(square: NorthPoleSquare, show: () => void): void;
  /** Called after a pick, so the page can update anything it shows. */
  onPicked?(): void;
  /** Goes inside a square, as E at its door does: a double-click on its entry. */
  onOpen?(kind: SquareKind, id: string): void;
}

/** The Booths panel's running parts: what the page tells it, and how to stop it. */
export interface BoothsPanel {
  /** The map's picked square changed: highlight its entries. */
  showSelected(selected: { kind: SquareKind; id: string } | undefined): void;
  /** The visitor said a booth is theirs. */
  setMe(login: string | undefined): void;
  /** Who the visitor said they are, if they did. */
  readonly me: string | undefined;
  stop(): void;
}

/** Every square the panel lists, by the name the build read until its frame says its own. */
function entriesOf(options: BoothsPanelOptions): HudEntry[] {
  return [
    ...options.attractions.map((square) => ({
      kind: 'attraction' as const,
      id: square.id,
      name: NAMES[`attraction/${square.id}`] ?? square.name,
      square,
    })),
    ...options.booths.map((square) => ({
      kind: 'booth' as const,
      id: square.id,
      name: NAMES[`booth/${square.id}`] ?? square.name,
      square,
    })),
  ];
}

/** The featured square, at the top, when it's one the panel lists. */
function showFeatured(
  panel: HTMLElement,
  entry: HudEntry | undefined,
  item: (entry: HudEntry, label: string) => HTMLLIElement,
) {
  if (!entry) return;
  const box = the(panel, '.hud-featured', HTMLElement);
  const list = document.createElement('ul');
  list.className = 'hud-list';
  list.append(item(entry, 'Featured: '));
  box.append(list);
  box.hidden = false;
}

/**
 * Sorts and searches again by the names known now, keeping the page of All
 * booths shown and the entry that has the focus.
 */
function relist(panel: HTMLElement, lists: PanelLists) {
  const focused = document.activeElement;
  const had =
    focused instanceof HTMLElement &&
    focused.classList.contains('hud-go') &&
    panel.contains(focused);
  const key = had && `${focused.dataset.kind}:${focused.dataset.id}`;
  const list = had && focused.closest('.hud-list');
  lists.relist();
  if (!key || !list || focused.isConnected) return;
  for (const button of list.querySelectorAll<HTMLButtonElement>('.hud-go'))
    if (`${button.dataset.kind}:${button.dataset.id}` === key) button.focus();
}

/**
 * Once a square's frame says its name, every entry for it shows that name,
 * and the lists sorted or searched by name follow it.
 */
function followNames(
  panel: HTMLElement,
  entries: readonly HudEntry[],
  whenNamed: BoothsPanelOptions['whenNamed'],
  lists: PanelLists,
) {
  for (const entry of entries)
    whenNamed(entry.square, () => {
      if (entry.square.name === entry.id) return;
      const name = entry.square.name.slice(0, 80);
      if (name === entry.name) return;
      entry.name = name;
      for (const button of panel.querySelectorAll<HTMLButtonElement>('.hud-go'))
        if (button.dataset.kind === entry.kind && button.dataset.id === entry.id)
          button.dispatchEvent(new Event('named'));
      relist(panel, lists);
    });
}

/** Highlights the entries of the map's picked square, and no others. */
function showSelected(panel: HTMLElement, next: { kind: SquareKind; id: string } | undefined) {
  for (const button of panel.querySelectorAll<HTMLButtonElement>('.hud-go')) {
    const on = next?.kind === button.dataset.kind && next?.id === button.dataset.id;
    button.classList.toggle('selected', on);
    button.setAttribute('aria-pressed', `${on}`);
  }
}

/**
 * The Booths panel: a search box, then Featured, Near you, Recently added,
 * Attractions, and All booths A to Z a page at a time, each section with its
 * count and folding, remembered. Picking a square glides the map to it and
 * highlights it; picking it again, or Esc, lets go. Shift-click or the walk
 * icon walks there, and a double-click goes inside. `/` focuses the search, the arrow keys move through the
 * results, Enter jumps and Esc clears. Every name and login is set as text.
 */
export function startBoothsPanel(
  panel: HTMLDetailsElement,
  map: MapControls,
  canvas: HTMLCanvasElement,
  options: BoothsPanelOptions,
): BoothsPanel {
  const memory = loadMemory();
  const entries = entriesOf(options);
  let selected = map.selected;
  const pick = (kind: SquareKind, id: string, walk: boolean) => {
    if (walk) {
      map.walkTo(kind, id);
      canvas.focus({ preventScroll: true });
    } else if (selected?.kind === kind && selected.id === id) {
      map.clearSelection();
    } else {
      map.jumpTo(kind, id);
    }
    options.onPicked?.();
  };
  const isSelected = (kind: SquareKind, id: string) =>
    selected?.kind === kind && selected.id === id;
  const open = (kind: SquareKind, id: string) => options.onOpen?.(kind, id);
  const item = (entry: HudEntry, label = '') => entryItem(entry, { isSelected, pick, open }, label);

  const { featured } = options;
  showFeatured(
    panel,
    featured &&
      entries.find((entry) => entry.kind === featured.kind && entry.id === featured.square.id),
    item,
  );
  rememberFolds(panel, memory);
  const lists = startLists({ panel, map, entries, added: ADDED, item });
  followNames(
    panel,
    entries,
    (square, show) => {
      options.whenNamed(square, show);
    },
    lists,
  );
  const input = the(panel, '.hud-search-input', HTMLInputElement);
  const stopKeys = startPanelKeys({ ...lists, panel, input, map, pick });
  const booths = entries.filter((entry) => entry.kind === 'booth');
  const setMe = startThisIsMe(panel, booths, memory, (login) => {
    map.setMe(login);
  });

  return {
    showSelected(next) {
      selected = next;
      showSelected(panel, next);
    },
    setMe,
    get me() {
      return memory.me;
    },
    stop() {
      lists.stop();
      stopKeys();
    },
  };
}
