import { badgeFor, factoryUrl } from '../northpole/badges';
import {
  BADGE_REQUEST_URL,
  CHANGE_URL,
  CLAIM_URL,
  HOW_IT_WORKS_URL,
  KEEP_POSTED_URL,
  OWN_REPO_URL,
  keepPostedHref,
  signupOffer,
} from '../northpole/links';
import type { SquareKind } from '../northpole/map';
import type { SandboxedSquare } from '../northpole/sandbox';
import type { NorthPoleSquare } from '../northpole/square';
import { shareLink, shareText } from '../northpole/visit';
import { SQUARE_HISTORY, emptyHistoryText, historyOf, renderHistory } from './history';
import { deepLink, seasonLink } from './route';

export interface VisitHudOptions {
  kind: SquareKind;
  square: NorthPoleSquare;
  /** Whether to show the invitation to build a booth of your own, for someone who came by a shared link. */
  invite: boolean;
  /** Leaves the square: Esc, or the Leave button. */
  onClose(): void;
  /** Claim the plot next door. */
  onClaim(): void;
}

/** The "Keep me posted" link: to the real form once it's set, or to the placeholder page. */
const KEEP_POSTED_LINK = KEEP_POSTED_URL
  ? `<a href="${keepPostedHref()}" target="_blank" rel="noopener">Keep me posted</a>.`
  : `<a href="${keepPostedHref()}">Keep me posted</a>.`;

/** The HUD of a visit: `close` takes it away and gives focus back. */
export interface VisitHud {
  close(): void;
}

/**
 * The HUD inside a square the player has entered, beside the room the map
 * draws: its name, who it belongs to and its description, Share and See it on
 * the map, a link for its owner to ask for a change and one to their season card, for someone who came by
 * a shared link the invitation to claim the plot next door, and how to leave.
 * Focus moves into it, and back out when it closes. Every name and
 * description is only ever set as text.
 */
export function openVisitHud(frame: HTMLElement, options: VisitHudOptions): VisitHud {
  const { kind, square } = options;
  const before = document.activeElement as HTMLElement | null;
  const card = document.createElement('section');
  card.className = 'hud visit';
  card.setAttribute('aria-labelledby', 'visit-title');
  card.setAttribute('aria-describedby', 'visit-description');
  card.dataset.kind = kind;
  card.dataset.id = square.id;
  card.innerHTML = `
    <p class="visit-leave"><span>Esc or walk out to leave</span> <button class="visit-close" type="button">Leave</button></p>
    <h2 id="visit-title" class="visit-title" tabindex="-1"></h2>
    <p class="visit-owner"></p>
    <p class="visit-factory" hidden><a target="_blank" rel="noopener"></a></p>
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
    <details class="visit-history">
      <summary>How was this built?</summary>
      <ol class="history-list"></ol>
      <p class="history-empty" hidden></p>
      <p class="history-own"><a class="history-own-link" href="${OWN_REPO_URL}" target="_blank" rel="noopener">Run this on your own repo</a>: set up a Tessl factory on a repository of yours.</p>
      <div class="history-offer" hidden>
        <p><span class="history-offer-tag">Offer</span> <a class="history-offer-link" target="_blank" rel="noopener"></a></p>
        <p class="history-terms">Terms apply, as set out on Tessl's sign-up page. Tessl makes this offer, not the carnival.</p>
      </div>
    </details>
    <p class="visit-help">Want to hear about the next North Pole event? ${KEEP_POSTED_LINK}</p>`;
  const $ = <T extends Element>(selector: string) => card.querySelector<T>(selector)!;

  const owner = kind === 'attraction' ? '' : `@${square.id}`;
  $('.visit-owner').textContent = owner;
  $<HTMLElement>('.visit-owner').hidden = !owner;
  $<HTMLAnchorElement>('.visit-map').href = deepLink(kind, square.id);

  // An Elf Engineer's booth links to the factory on their own repository.
  const badge = kind === 'booth' ? badgeFor(square.id) : undefined;
  if (badge) {
    const factory = $<HTMLAnchorElement>('.visit-factory a');
    factory.href = factoryUrl(badge);
    factory.textContent = `See ${owner}'s own factory`;
    $<HTMLElement>('.visit-factory').hidden = false;
  }

  // How was this built: open beside the room, collapsed on a phone, where it sits below it.
  const entries = historyOf(SQUARE_HISTORY, kind, square.id);
  renderHistory($('.history-list'), entries);
  const empty = $<HTMLElement>('.history-empty');
  empty.textContent = emptyHistoryText(SQUARE_HISTORY);
  empty.hidden = entries.length > 0;
  $<HTMLDetailsElement>('.visit-history').open = !matchMedia('(max-width: 719px)').matches;
  const offer = signupOffer();
  if (offer) {
    const offerLink = $<HTMLAnchorElement>('.history-offer-link');
    offerLink.href = offer.url;
    offerLink.textContent = offer.text;
    $<HTMLElement>('.history-offer').hidden = false;
  }

  const help = $('.visit-help');
  if (kind === 'booth') {
    help.innerHTML = `Is this yours? <a href="${CHANGE_URL}" target="_blank" rel="noopener">Ask the factory for a change</a>, or <button class="visit-mine" type="button">share it as yours</button>. Built a factory of your own? <a href="${BADGE_REQUEST_URL}" target="_blank" rel="noopener">Ask for the Elf Engineer badge</a>. <a class="visit-season">Your season</a>`;
    help.querySelector<HTMLAnchorElement>('.visit-season')!.href = seasonLink(square.id);
  } else {
    help.innerHTML = `Attractions belong to the North Pole, so only its maintainers change them. <a href="${CLAIM_URL}" target="_blank" rel="noopener">Claim a booth of your own</a> beside it.`;
  }

  const link = shareLink(kind, square.id, document.baseURI);
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
  $<HTMLElement>('.visit-title').focus({ preventScroll: true });

  return {
    close() {
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
