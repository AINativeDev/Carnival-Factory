/**
 * The Booths panel's markup (src/booths-hud.ts): the panel itself, and one
 * square's entry in its lists, with its name to pick it and the walk icon to
 * walk there. Kept apart from the panel's behaviour so each entry's wiring is
 * tested on its own. Every name and login goes in as text.
 */
import type { PanelEntry } from './booth-panel';
import { the } from './dom';
import type { SquareKind } from './northpole/map';
import type { NorthPoleSquare } from './northpole/square';

/** One square in the panel's lists, with the name it's sorted and searched by. */
export type HudEntry = PanelEntry & { square: NorthPoleSquare };

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

/** What an entry asks of its panel: whether its square is the one picked, and how to pick it. */
export interface EntryActions {
  isSelected(kind: SquareKind, id: string): boolean;
  pick(kind: SquareKind, id: string, walk: boolean): void;
}

/**
 * A square's entry: its name picks it, and the walk icon walks there. It
 * shows the entry's name again on a `named` event, once the square's frame
 * has said it.
 */
export function entryItem(entry: HudEntry, actions: EntryActions, label = ''): HTMLLIElement {
  const li = document.createElement('li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'hud-go';
  button.dataset.kind = entry.kind;
  button.dataset.id = entry.id;
  button.innerHTML = `<span class="label"></span><span class="name"></span> <span class="owner"></span>`;
  the(button, '.label', HTMLElement).textContent = label;
  the(button, '.owner', HTMLElement).textContent = entry.kind === 'booth' ? `@${entry.id}` : '';
  const walk = document.createElement('button');
  walk.type = 'button';
  walk.className = 'hud-walk';
  walk.innerHTML = WALK_ICON;
  const named = () => {
    the(button, '.name', HTMLElement).textContent = entry.name;
    button.title = entry.name;
    walk.title = `Walk to ${entry.name}`;
    walk.setAttribute('aria-label', walk.title);
  };
  named();
  button.addEventListener('named', named);
  const isSelected = actions.isSelected(entry.kind, entry.id);
  button.classList.toggle('selected', isSelected);
  button.setAttribute('aria-pressed', `${isSelected}`);
  button.addEventListener('click', (event) => {
    actions.pick(entry.kind, entry.id, event.shiftKey);
  });
  walk.addEventListener('click', () => {
    actions.pick(entry.kind, entry.id, true);
  });
  li.append(button, walk);
  return li;
}
