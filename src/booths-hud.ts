import type { MapControls, SquareKind } from '../northpole/map';
import type { NorthPoleSquare } from '../northpole/square';
import {
  PAGE_SIZE,
  RECENT_COUNT,
  NEAR_COUNT,
  byName,
  heading,
  page,
  readState,
  recentlyAdded,
  search,
  step,
  type PanelEntry,
} from './booth-panel';

/** When each booth's folder first appeared, and every square's name, set by Vite when it builds. */
declare const __BOOTH_ADDED__: Record<string, string>;
declare const __SQUARE_NAMES__: Record<string, string>;
const ADDED: Record<string, string> = typeof __BOOTH_ADDED__ === 'object' ? __BOOTH_ADDED__ : {};
const NAMES: Record<string, string> = typeof __SQUARE_NAMES__ === 'object' ? __SQUARE_NAMES__ : {};

/** Where the panel remembers who you are and which sections are folded: the page's storage, never a square's. */
const STORAGE_KEY = 'north-pole-booths-panel';

/** A small walking-figure icon, drawn in the button's own colour. */
const WALK_ICON = `<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="currentColor"><circle cx="9" cy="2.5" r="1.8"/><path d="M8 5.2 5.5 7.5 5 10.5h1.6l.4-2 1.2-1L7.5 11 5.3 15h1.9l1.9-3.4 1.6 3.4h1.8L10.2 11l.7-3.2.8 1.4 2.3.8.4-1.4-1.8-.6-1.4-2.4C10.7 5 9.2 4.6 8 5.2Z"/></svg>`;

/** The panel's markup. Every name and login goes in later, as text. */
export const BOOTHS_PANEL = `
  <details class="hud hud-booths">
    <summary>Booths</summary>
    <div class="hud-search">
      <label class="visually-hidden" for="hud-search-input">Find a booth or @login</label>
      <input id="hud-search-input" class="hud-search-input" type="search" placeholder="Find a booth or @login" autocomplete="off" spellcheck="false" maxlength="60" />
    </div>
    <p class="hud-hint">Click one to go there, or shift-click to walk. Press <kbd>/</kbd> to search.</p>
    <div class="hud-results" hidden>
      <h2 class="hud-group hud-results-title"></h2>
      <ul class="hud-list hud-found"></ul>
    </div>
    <div class="hud-sections">
      <div class="hud-featured" hidden></div>
      <details class="hud-section" data-section="near" open>
        <summary class="hud-group"></summary>
        <ul class="hud-list hud-near"></ul>
      </details>
      <details class="hud-section" data-section="recent" open hidden>
        <summary class="hud-group"></summary>
        <ul class="hud-list hud-recent"></ul>
      </details>
      <details class="hud-section" data-section="attractions" open>
        <summary class="hud-group"></summary>
        <ul class="hud-list hud-attractions"></ul>
      </details>
      <details class="hud-section" data-section="all" open>
        <summary class="hud-group"></summary>
        <ul class="hud-list hud-all"></ul>
        <button class="hud-more" type="button" hidden>Show more</button>
      </details>
    </div>
    <p class="hud-me">
      <label for="hud-me-select">This is me</label>
      <select id="hud-me-select" class="hud-me-select"><option value="">Pick your booth</option></select>
    </p>
  </details>`;

export interface BoothsPanelOptions {
  attractions: readonly NorthPoleSquare[];
  booths: readonly NorthPoleSquare[];
  /** The square featured at the top. */
  featured?: { kind: SquareKind; square: NorthPoleSquare };
  /** Calls `show` now and again once the square has said its name. */
  whenNamed(square: NorthPoleSquare, show: () => void): void;
  /** Called after a pick, so the page can update anything it shows. */
  onPicked?(): void;
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

/** Reads the panel's saved state, or nothing when the page's storage is off. */
function load() {
  try {
    return readState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return readState(null);
  }
}

function save(state: { me?: string; closed: string[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // No storage: the panel just forgets.
  }
}

/**
 * The Booths panel: a search box, then Featured, Near you, Recently added,
 * Attractions, and All booths A to Z a page at a time, each section with its
 * count and folding, remembered. Picking a square glides the map to it and
 * highlights it; picking it again, or Esc, lets go. Shift-click or the walk
 * icon walks there. `/` focuses the search, the arrow keys move through the
 * results, Enter jumps and Esc clears. Every name and login is set as text.
 */
export function startBoothsPanel(
  panel: HTMLDetailsElement,
  map: MapControls,
  canvas: HTMLCanvasElement,
  options: BoothsPanelOptions,
): BoothsPanel {
  const $ = <T extends Element>(selector: string) => panel.querySelector<T>(selector)!;
  const state = load();
  let me = state.me;
  const entries: (PanelEntry & { square: NorthPoleSquare })[] = [
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
  const entryOf = (kind: SquareKind, id: string) =>
    entries.find((entry) => entry.kind === kind && entry.id === id);
  const booths = entries.filter((entry) => entry.kind === 'booth');
  const attractions = entries.filter((entry) => entry.kind === 'attraction');
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

  /** A square's entry: its name picks it, and the walk icon walks there. */
  const item = (entry: (typeof entries)[number], label = '') => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hud-go';
    button.dataset.kind = entry.kind;
    button.dataset.id = entry.id;
    button.innerHTML = `<span class="label"></span><span class="name"></span> <span class="owner"></span>`;
    button.querySelector('.label')!.textContent = label;
    button.querySelector('.owner')!.textContent = entry.kind === 'booth' ? `@${entry.id}` : '';
    const walk = document.createElement('button');
    walk.type = 'button';
    walk.className = 'hud-walk';
    walk.innerHTML = WALK_ICON;
    const named = () => {
      button.querySelector('.name')!.textContent = entry.name;
      button.title = entry.name;
      walk.title = `Walk to ${entry.name}`;
      walk.setAttribute('aria-label', walk.title);
    };
    named();
    button.addEventListener('named', named);
    const isSelected = selected?.kind === entry.kind && selected.id === entry.id;
    button.classList.toggle('selected', isSelected);
    button.setAttribute('aria-pressed', `${isSelected}`);
    button.addEventListener('click', (event) => pick(entry.kind, entry.id, event.shiftKey));
    walk.addEventListener('click', () => pick(entry.kind, entry.id, true));
    li.append(button, walk);
    return li;
  };

  const fill = (list: Element, items: readonly (typeof entries)[number][]) =>
    list.replaceChildren(...items.map((entry) => item(entry)));

  // Featured, as before.
  if (options.featured) {
    const entry = entryOf(options.featured.kind, options.featured.square.id);
    if (entry) {
      const box = $<HTMLElement>('.hud-featured');
      const list = document.createElement('ul');
      list.className = 'hud-list';
      list.append(item(entry, 'Featured: '));
      box.append(list);
      box.hidden = false;
    }
  }

  // The sections' folds, remembered.
  for (const section of panel.querySelectorAll<HTMLDetailsElement>('.hud-section')) {
    section.open = !state.closed.includes(section.dataset.section!);
    section.addEventListener('toggle', () => {
      const closed = [...panel.querySelectorAll<HTMLDetailsElement>('.hud-section')]
        .filter((s) => !s.open)
        .map((s) => s.dataset.section!);
      state.closed = closed;
      save({ me, closed });
    });
  }
  const title = (section: string, text: string, count: number) =>
    ($(`.hud-section[data-section="${section}"] > summary`).textContent = heading(text, count));

  // Near you: the closest squares, updated as the player walks.
  let nearIds = '';
  const showNear = () => {
    const near = map.nearest(NEAR_COUNT);
    const ids = near.map((n) => `${n.kind}:${n.id}`).join(' ');
    if (ids === nearIds) return;
    nearIds = ids;
    const found = near.map((n) => entryOf(n.kind, n.id)).filter((entry) => !!entry);
    title('near', 'Near you', found.length);
    fill($('.hud-near'), found);
  };
  showNear();
  const nearTimer = window.setInterval(showNear, 1000);

  const recent = recentlyAdded(booths, ADDED, RECENT_COUNT);
  if (recent.length) {
    $<HTMLElement>('.hud-section[data-section="recent"]').hidden = false;
    title('recent', 'Recently added', recent.length);
    fill($('.hud-recent'), recent);
  }

  title('attractions', 'Attractions', attractions.length);
  fill($('.hud-attractions'), byName(attractions));

  // All booths, A to Z, a page at a time.
  let shown = PAGE_SIZE;
  const more = $<HTMLButtonElement>('.hud-more');
  const showAll = () => {
    const sorted = byName(booths);
    const { items, more: hasMore } = page(sorted, shown);
    title('all', 'All booths', sorted.length);
    fill($('.hud-all'), items);
    more.hidden = !hasMore;
  };
  showAll();
  more.addEventListener('click', () => {
    shown += PAGE_SIZE;
    showAll();
  });

  // Search.
  const input = $<HTMLInputElement>('.hud-search-input');
  const results = $<HTMLElement>('.hud-results');
  const sections = $<HTMLElement>('.hud-sections');
  let found: typeof entries = [];
  const showSearch = () => {
    const query = input.value;
    const searching = query.trim() !== '';
    results.hidden = !searching;
    sections.hidden = searching;
    if (!searching) {
      found = [];
      return;
    }
    found = search(entries, query);
    $('.hud-results-title').textContent = heading('Results', found.length);
    fill($('.hud-found'), found);
  };
  input.addEventListener('input', showSearch);

  /**
   * Sorts and searches again by the names known now, keeping the page of All
   * booths shown and the entry that has the focus.
   */
  const relist = () => {
    const focused = document.activeElement as HTMLElement | null;
    const had = focused?.classList.contains('hud-go') && panel.contains(focused);
    const key = had && `${focused!.dataset.kind}:${focused!.dataset.id}`;
    const list = had && focused!.closest('.hud-list');
    fill($('.hud-attractions'), byName(attractions));
    showAll();
    showSearch();
    if (!key || !list || focused!.isConnected) return;
    for (const button of list.querySelectorAll<HTMLButtonElement>('.hud-go'))
      if (`${button.dataset.kind}:${button.dataset.id}` === key) button.focus();
  };

  // Once a square's frame says its name, every entry for it shows that name,
  // and the lists sorted or searched by name follow it.
  for (const entry of entries)
    options.whenNamed(entry.square, () => {
      if (entry.square.name === entry.id) return;
      const name = entry.square.name.slice(0, 80);
      if (name === entry.name) return;
      entry.name = name;
      for (const button of panel.querySelectorAll<HTMLButtonElement>('.hud-go'))
        if (button.dataset.kind === entry.kind && button.dataset.id === entry.id)
          button.dispatchEvent(new Event('named'));
      relist();
    });

  /** The entries the arrow keys move through: the results while searching, otherwise every section shown. */
  const buttons = () =>
    [...panel.querySelectorAll<HTMLButtonElement>('.hud-go')].filter(
      (button) => button.offsetParent !== null,
    );

  const onPanelKey = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const inSearch = target === input;
    const onEntry = target.classList.contains('hud-go');
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!inSearch && !onEntry) return;
      const list = buttons();
      const at = onEntry ? list.indexOf(target as HTMLButtonElement) : -1;
      const next = step(at, list.length, event.key === 'ArrowDown' ? 1 : -1);
      if (next >= 0) list[next].focus();
      // The arrow keys move through the list here, not the player.
      event.preventDefault();
      event.stopPropagation();
    } else if (event.key === 'Enter' && inSearch) {
      event.preventDefault();
      const first = found[0];
      if (first) pick(first.kind, first.id, false);
    } else if (event.key === 'Escape' && (inSearch || onEntry)) {
      event.stopPropagation();
      if (input.value) {
        input.value = '';
        showSearch();
        input.focus();
      } else {
        map.clearSelection();
      }
    }
  };
  panel.addEventListener('keydown', onPanelKey);

  /** `/` focuses the search, from anywhere but a text field or inside a square. */
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)))
      return;
    if (map.visiting) return;
    event.preventDefault();
    panel.open = true;
    input.focus();
  };
  window.addEventListener('keydown', onKey);

  // This is me: remembered on the page only, never given to any square.
  const mine = $<HTMLSelectElement>('.hud-me-select');
  for (const entry of byName(booths)) {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = `@${entry.id}`;
    mine.append(option);
  }
  const showMe = () => (mine.value = me && booths.some((b) => b.id === me) ? me : '');
  showMe();
  mine.addEventListener('change', () => {
    me = mine.value || undefined;
    map.setMe(me);
    save({ me, closed: state.closed });
  });
  map.setMe(me);

  return {
    showSelected(next) {
      selected = next;
      for (const button of panel.querySelectorAll<HTMLButtonElement>('.hud-go')) {
        const on = next?.kind === button.dataset.kind && next?.id === button.dataset.id;
        button.classList.toggle('selected', on);
        button.setAttribute('aria-pressed', `${on}`);
      }
    },
    setMe(login) {
      me = login;
      map.setMe(me);
      showMe();
      save({ me, closed: state.closed });
    },
    get me() {
      return me;
    },
    stop() {
      window.clearInterval(nearTimer);
      window.removeEventListener('keydown', onKey);
      panel.removeEventListener('keydown', onPanelKey);
    },
  };
}
