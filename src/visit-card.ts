import {
  CHANGE_URL,
  CLAIM_URL,
  HOW_IT_WORKS_URL,
  KEEP_POSTED_URL,
  keepPostedHref,
} from '../northpole/links';
import { startPreview, VISIT_SIZE, type SquareKind } from '../northpole/map';
import type { SandboxedSquare } from '../northpole/sandbox';
import type { NorthPoleSquare } from '../northpole/square';
import { sharePath, shareText } from '../northpole/visit';
import { deepLink } from './route';

export interface VisitCardOptions {
  kind: SquareKind;
  square: NorthPoleSquare;
  /** Whether to show the invitation to build a booth of your own, for someone who came by a shared link. */
  invite: boolean;
  /** Closes the card: its close button, or Esc. */
  onClose(): void;
  /** Claim the plot next door. */
  onClaim(): void;
}

/** The "Keep me posted" link: to the real form once it's set, or to the placeholder page. */
const KEEP_POSTED_LINK = KEEP_POSTED_URL
  ? `<a href="${keepPostedHref()}" target="_blank" rel="noopener">Keep me posted</a>.`
  : `<a href="${keepPostedHref()}">Keep me posted</a>.`;

/** An open visit card: `close` takes it away, stops its drawing and gives focus back. */
export interface VisitCard {
  close(): void;
}

/**
 * The card a square's visit shows, risen in front of its stall in the world:
 * its drawing, large and animated in a stall window, its name, who it belongs
 * to and its description, Share and See it on the map, a link for its owner
 * to ask for a change, and, for someone who came by a shared link, the
 * invitation to claim the plot next door. Focus moves into it, and back out
 * when it closes. Every name and description is only ever set as text.
 */
export function openVisitCard(frame: HTMLElement, options: VisitCardOptions): VisitCard {
  const { kind, square } = options;
  const before = document.activeElement as HTMLElement | null;
  const card = document.createElement('section');
  card.className = 'visit';
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-labelledby', 'visit-title');
  card.setAttribute('aria-describedby', 'visit-description');
  card.dataset.kind = kind;
  card.dataset.id = square.id;
  card.innerHTML = `
    <button class="visit-close" type="button" aria-label="Close">×</button>
    <div class="visit-window"><canvas class="visit-canvas" role="img"></canvas></div>
    <h2 id="visit-title" class="visit-title" tabindex="-1"></h2>
    <p class="visit-owner"></p>
    <p class="visit-description" id="visit-description"></p>
    <div class="visit-share">
      <label class="visit-label" for="visit-share-text">Share text</label>
      <textarea id="visit-share-text" class="visit-share-text" rows="3"></textarea>
      <div class="visit-actions">
        <button class="visit-copy" type="button">Share</button>
        <a class="visit-map">See it on the map</a>
      </div>
    </div>
    <p class="visit-help"></p>
    <div class="visit-invite" hidden>
      <p class="visit-invite-text"></p>
      <button class="visit-claim" type="button">Claim the plot next door</button>
      <a class="visit-how" href="${HOW_IT_WORKS_URL}" target="_blank" rel="noopener">How was this built?</a>
    </div>
    <p class="visit-help">Want to hear about the next North Pole event? ${KEEP_POSTED_LINK}</p>`;
  const $ = <T extends Element>(selector: string) => card.querySelector<T>(selector)!;

  const owner = kind === 'attraction' ? 'North Pole' : `@${square.id}`;
  $('.visit-owner').textContent = owner;
  $<HTMLAnchorElement>('.visit-map').href = deepLink(kind, square.id);

  const help = $('.visit-help');
  if (kind === 'booth') {
    help.innerHTML = `Is this yours? <a href="${CHANGE_URL}" target="_blank" rel="noopener">Ask the factory for a change</a>, or <button class="visit-mine" type="button">share it as yours</button>.`;
  } else {
    help.innerHTML = `Attractions belong to the North Pole, so only its maintainers change them. <a href="${CLAIM_URL}" target="_blank" rel="noopener">Claim a booth of your own</a> beside it.`;
  }

  const link = new URL(sharePath(kind, square.id), document.baseURI).href;
  const text = $<HTMLTextAreaElement>('.visit-share-text');
  let mine = false;
  let edited = false;
  text.addEventListener('input', () => (edited = true));
  const showText = () => {
    if (!edited) text.value = shareText({ kind, id: square.id, name: square.name }, link, mine);
  };

  const show = () => {
    $('.visit-title').textContent = square.name;
    $('.visit-description').textContent = square.description;
    $('.visit-canvas').setAttribute('aria-label', `The drawing of ${square.name}`);
    $('.visit-invite-text').textContent =
      `${owner} built this by describing it in an issue. An agent built it, checked it and put it on the map. Want one of your own?`;
    showText();
  };
  show();
  if ('onReady' in square) (square as SandboxedSquare).onReady(() => card.isConnected && show());

  card.querySelector('.visit-mine')?.addEventListener('click', () => {
    mine = true;
    edited = false;
    showText();
    text.focus();
  });

  const copy = $<HTMLButtonElement>('.visit-copy');
  let reset = 0;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(text.value);
      copy.textContent = 'Copied!';
      window.clearTimeout(reset);
      reset = window.setTimeout(() => (copy.textContent = 'Share'), 2000);
    } catch {
      // No clipboard: the line is selected, to copy by hand.
      text.focus();
      text.select();
    }
  });

  const invite = $<HTMLElement>('.visit-invite');
  invite.hidden = !(options.invite && kind === 'booth');
  $('.visit-claim').addEventListener('click', () => options.onClaim());
  $('.visit-close').addEventListener('click', () => options.onClose());
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      options.onClose();
    }
  };
  document.addEventListener('keydown', onKeyDown);

  frame.append(card);
  const stopPreview = startPreview($<HTMLCanvasElement>('.visit-canvas'), square, VISIT_SIZE);
  $<HTMLElement>('.visit-title').focus({ preventScroll: true });

  return {
    close() {
      stopPreview();
      window.clearTimeout(reset);
      document.removeEventListener('keydown', onKeyDown);
      const hadFocus = card.contains(document.activeElement);
      card.remove();
      if (hadFocus) {
        const back =
          before && before !== document.body && before.isConnected
            ? before
            : frame.querySelector<HTMLElement>('canvas');
        back?.focus({ preventScroll: true });
      }
    },
  };
}
