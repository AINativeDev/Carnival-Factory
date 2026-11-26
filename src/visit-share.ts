/**
 * Sharing a square: a Share pill over the room, beside the panel, so a long
 * build story never pushes it out of sight. On a laptop it copies a ready-made
 * line with the square's link; on a phone it opens the phone's own share
 * sheet. The panel's More lets the visitor edit the line or open it on the
 * map, and a booth's owner can share it as theirs, which changes the line.
 */
import type { SquareKind } from './northpole/map-options';
import { shareText } from './northpole/visit';
import { boothTools } from './booth-tools';
import { visitSheet } from './visit-sheet';
import { fullScreenPill } from './visit-full-screen';

export interface ShareParts {
  copy: HTMLButtonElement;
  text: HTMLTextAreaElement;
  options: HTMLDetailsElement;
  /** The Full screen pill beside Share, which ends with the visit too (visit-full-screen.ts). */
  full?: { stop(): void } | undefined;
}

/** The share icon people know: a box with an arrow up out of it (Lucide's "share"). */
const SHARE_ICON =
  '<svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>';

/**
 * The Share pill, added to the map's frame beside the visit's panel. A level's
 * own pill is marked, so it steps aside while the player is inside one of its
 * squares, whose panel brings its own.
 */
export function sharePill(frame: HTMLElement, level = false): HTMLButtonElement {
  const pill = document.createElement('button');
  pill.type = 'button';
  pill.className = 'visit-copy';
  if (level) pill.dataset.level = '';
  pill.title = 'Share';
  pill.innerHTML = `${SHARE_ICON}<span class="visit-copy-label">Share</span>`;
  frame.append(pill);
  return pill;
}

/**
 * A visit's two buttons, Share and Full screen, stacked on the corner of the
 * square's drawing (booth-tools.ts). A level's own panel gets Share alone.
 */
export function roomPills(frame: HTMLElement, panel: HTMLElement, level: boolean) {
  // A level's own panel has no drawing to stand on: its Share stays beside the ask.
  if (level)
    return { copy: sharePill(panel.querySelector<HTMLElement>('.visit-footer') ?? panel, level) };
  const tools = boothTools(frame);
  const copy = sharePill(tools.element);
  const full = fullScreenPill(frame, tools.element);
  // On a phone the panel is a sheet under the booth, resized by its handle.
  const sheet = visitSheet(panel);
  const stop = () => {
    full.stop();
    tools.stop();
    sheet.stop();
  };
  return { copy, full: { stop } };
}

/** A phone with its own share sheet: a touch screen whose browser can share. */
const sharesNatively = () =>
  typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches;

/** Wires up Share for one square; `refresh` rewrites the line unless the visitor edited it. */
export function wireShare(
  parts: ShareParts,
  square: { kind: SquareKind | 'level'; id: string; name: () => string },
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
  // The pill's word changes, never its icon.
  const label = parts.copy.querySelector('.visit-copy-label') ?? parts.copy;
  parts.copy.addEventListener('click', () => {
    if (sharesNatively()) {
      // Closing the sheet without sharing rejects: nothing to do then.
      navigator.share({ text: parts.text.value }).catch(() => undefined);
      return;
    }
    navigator.clipboard.writeText(parts.text.value).then(
      () => {
        label.textContent = 'Copied';
        // Its word is hidden beside the icon, except to say Copied for a moment.
        parts.copy.dataset.said = '';
        window.clearTimeout(reset);
        reset = window.setTimeout(() => {
          label.textContent = 'Share';
          delete parts.copy.dataset.said;
        }, 2000);
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
    /** The visit ends: the pill goes with its panel. */
    stop: () => {
      window.clearTimeout(reset);
      parts.copy.remove();
      parts.full?.stop();
    },
  };
}
