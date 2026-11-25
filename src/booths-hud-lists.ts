/**
 * The Booths panel's lists (src/booths-hud.ts): Near you, Recently added,
 * Attractions, All booths A to Z a page at a time, and the search results.
 * Kept apart from the panel's picking and keys, which only need to know
 * what the search found and how to list again by the names known now.
 */
import {
  PAGE_SIZE,
  RECENT_COUNT,
  NEAR_COUNT,
  byName,
  heading,
  page,
  recentlyAdded,
  search,
} from './booth-panel';
import type { HudEntry } from './booths-hud-markup';
import { the } from './dom';
import type { MapControls, SquareKind } from './northpole/map';

/** The lists' running parts, for the panel's keys and names. */
export interface PanelLists {
  /** What the search box found, empty while it's empty. */
  found(): readonly HudEntry[];
  /** Searches again for what's in the search box. */
  showSearch(): void;
  /** Sorts and searches again by the names known now, keeping the page of All booths shown. */
  relist(): void;
  stop(): void;
}

/** What the lists need: the panel, the map, every entry, and how to make one entry's item. */
interface ListParts {
  panel: HTMLElement;
  map: MapControls;
  entries: readonly HudEntry[];
  /** When each booth's folder first appeared, by login. */
  added: Record<string, string>;
  item(entry: HudEntry): HTMLLIElement;
}

const listIn = (parts: ListParts, selector: string) => the(parts.panel, selector, HTMLElement);

const fill = (parts: ListParts, selector: string, items: readonly HudEntry[]) => {
  listIn(parts, selector).replaceChildren(...items.map((entry) => parts.item(entry)));
};

const title = (parts: ListParts, section: string, text: string, count: number) => {
  listIn(parts, `.hud-section[data-section="${section}"] > summary`).textContent = heading(
    text,
    count,
  );
};

const entryOf = (entries: readonly HudEntry[], kind: SquareKind, id: string) =>
  entries.find((entry) => entry.kind === kind && entry.id === id);

/** Near you: the closest squares, updated every second as the player walks. Returns how to stop. */
function startNear(parts: ListParts) {
  let nearIds = '';
  const showNear = () => {
    const near = parts.map.nearest(NEAR_COUNT);
    const ids = near.map((n) => `${n.kind}:${n.id}`).join(' ');
    if (ids === nearIds) return;
    nearIds = ids;
    const found = near.map((n) => entryOf(parts.entries, n.kind, n.id)).filter((entry) => !!entry);
    title(parts, 'near', 'Near you', found.length);
    fill(parts, '.hud-near', found);
  };
  showNear();
  const timer = window.setInterval(showNear, 1000);
  return () => {
    window.clearInterval(timer);
  };
}

/** All booths, A to Z, a page at a time. Returns how to list them again. */
function startAllBooths(parts: ListParts, booths: readonly HudEntry[]) {
  let shown = PAGE_SIZE;
  const more = the(parts.panel, '.hud-more', HTMLButtonElement);
  const showAll = () => {
    const sorted = byName(booths);
    const { items, more: hasMore } = page(sorted, shown);
    title(parts, 'all', 'All booths', sorted.length);
    fill(parts, '.hud-all', items);
    more.hidden = !hasMore;
  };
  showAll();
  more.addEventListener('click', () => {
    shown += PAGE_SIZE;
    showAll();
  });
  return showAll;
}

/** The search box: while it has text, its results take the sections' place. */
function startSearch(parts: ListParts) {
  const input = the(parts.panel, '.hud-search-input', HTMLInputElement);
  const results = listIn(parts, '.hud-results');
  const sections = listIn(parts, '.hud-sections');
  let found: HudEntry[] = [];
  const showSearch = () => {
    const query = input.value;
    const searching = query.trim() !== '';
    results.hidden = !searching;
    sections.hidden = searching;
    if (!searching) {
      found = [];
      return;
    }
    found = search(parts.entries, query);
    listIn(parts, '.hud-results-title').textContent = heading('Results', found.length);
    fill(parts, '.hud-found', found);
  };
  input.addEventListener('input', showSearch);
  return { showSearch, found: () => found };
}

/** Starts every list in the panel. */
export function startLists(parts: ListParts): PanelLists {
  const booths = parts.entries.filter((entry) => entry.kind === 'booth');
  const attractions = parts.entries.filter((entry) => entry.kind === 'attraction');
  const stopNear = startNear(parts);

  const recent = recentlyAdded(booths, parts.added, RECENT_COUNT);
  if (recent.length) {
    listIn(parts, '.hud-section[data-section="recent"]').hidden = false;
    title(parts, 'recent', 'Recently added', recent.length);
    fill(parts, '.hud-recent', recent);
  }
  title(parts, 'attractions', 'Attractions', attractions.length);
  fill(parts, '.hud-attractions', byName(attractions));
  const showAll = startAllBooths(parts, booths);
  const { showSearch, found } = startSearch(parts);

  return {
    found,
    showSearch,
    relist() {
      fill(parts, '.hud-attractions', byName(attractions));
      showAll();
      showSearch();
    },
    stop: stopNear,
  };
}
