/**
 * Sharing a square from its panel: the Share button copies a ready-made line
 * with the square's link, which "Share options" lets the visitor edit or open
 * on the map. A booth's owner can share it as theirs, which changes the line.
 */
import type { SquareKind } from './northpole/map-options';
import { shareText } from './northpole/visit';

export interface ShareParts {
  copy: HTMLButtonElement;
  text: HTMLTextAreaElement;
  options: HTMLDetailsElement;
}

/** Wires up Share for one square; `refresh` rewrites the line unless the visitor edited it. */
export function wireShare(
  parts: ShareParts,
  square: { kind: SquareKind; id: string; name: () => string },
  link: string,
) {
  let mine = false;
  let edited = false;
  let reset = 0;
  parts.text.addEventListener('input', () => (edited = true));
  const refresh = () => {
    if (!edited)
      parts.text.value = shareText(
        { kind: square.kind, id: square.id, name: square.name() },
        link,
        mine,
      );
  };
  const openToEdit = () => {
    parts.options.open = true;
    parts.text.focus();
  };
  parts.copy.addEventListener('click', () => {
    navigator.clipboard.writeText(parts.text.value).then(
      () => {
        parts.copy.textContent = 'Copied';
        window.clearTimeout(reset);
        reset = window.setTimeout(() => (parts.copy.textContent = 'Share'), 2000);
      },
      () => {
        // No clipboard: the line is shown and selected, to copy by hand.
        openToEdit();
        parts.text.select();
      },
    );
  });
  return {
    refresh,
    /** The owner shares it as theirs: the line says so, ready to edit. */
    shareAsMine() {
      mine = true;
      edited = false;
      refresh();
      openToEdit();
    },
    stop: () => {
      window.clearTimeout(reset);
    },
  };
}
