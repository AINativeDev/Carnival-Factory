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
import { deepLink, levelLink } from './route';

export interface VisitHudOptions {
  kind: SquareKind;
  square: NorthPoleSquare;
  /** Whether to show the invitation to build a booth of your own, for someone who came by a shared link. */
  invite: boolean;
  /** Leaves the square: Esc, or the Leave button. */
  onClose(): void;
  /** Claim the plot next door. */
  onClaim(): void;
  /** The owner's build-time avatar, for a booth whose owner has one. */
  avatar?: string;
  /** Says the visitor shared this booth as theirs, so the map knows who they are. */
  onMine?(): void;
  /** The owner of the level this square is in, for one of a level's own squares. */
  level?: string;
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
 * the map, a link for its owner to ask for a change, for someone who came by
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
    <p class="visit-owner"><a class="visit-profile" target="_blank" rel="noopener"></a></p>
    <p class="visit-factory" hidden><a target="_blank" rel="noopener"></a></p>
    <p class="visit-description" id="visit-description"></p>
    <div class="visit-actions">
      <button class="visit-copy" type="button">Share</button>
      <a class="visit-map">See it on the map</a>
    </div>
    <details class="visit-edit">
      <summary>Edit the message</summary>
      <label class="visit-label" for="visit-share-text">Share text</label>
      <textarea id="visit-share-text" class="visit-share-text" rows="4"></textarea>
    </details>
    <div class="visit-invite" hidden>
      <p class="visit-invite-text"></p>
      <button class="visit-claim" type="button">Claim the plot next door</button>
      <a class="visit-how" href="${HOW_IT_WORKS_URL}" target="_blank" rel="noopener">How was this built?</a>
    </div>
    <details class="visit-history">
      <summary>How was this built?</summary>
      <ol class="history-list"></ol>
      <p class="history-empty" hidden></p>
      <p class="history-factory"><a class="history-factory-link" href="#/factory">See the factory's numbers</a></p>
      <p class="history-own"><a class="history-own-link" href="${OWN_REPO_URL}" target="_blank" rel="noopener">Run this on your own repo</a>: set up a Tessl factory on a repository of yours.</p>
      <div class="history-offer" hidden>
        <p><span class="history-offer-tag">Offer</span> <a class="history-offer-link" target="_blank" rel="noopener"></a></p>
        <p class="history-terms">Terms apply, as set out on Tessl's sign-up page. Tessl makes this offer, not the carnival.</p>
      </div>
    </details>
    <div class="visit-help"></div>
    <p class="visit-foot">Next North Pole event? ${KEEP_POSTED_LINK}</p>`;
  const $ = <T extends Element>(selector: string) => card.querySelector<T>(selector)!;

  const { level } = options;
  const login = level ?? square.id;
  const owner = kind === 'attraction' && !level ? '' : `@${login}`;
  // The owner, linking to their GitHub profile, with their portrait when the build has it.
  const profile = $<HTMLAnchorElement>('.visit-profile');
  profile.href = `https://github.com/${encodeURIComponent(login)}`;
  if (options.avatar) {
    const picture = document.createElement('img');
    picture.className = 'visit-avatar';
    picture.src = options.avatar;
    picture.alt = '';
    picture.width = picture.height = 32;
    profile.append(picture, ' ');
  }
  profile.append(owner);
  $<HTMLElement>('.visit-owner').hidden = !owner;
  const map = $<HTMLAnchorElement>('.visit-map');
  map.href = level ? levelLink(level, square.id) : deepLink(kind, square.id);
  if (level) map.textContent = 'See it in the level';

  // An Elf Engineer's booth links to the factory on their own repository.
  const badge = kind === 'booth' ? badgeFor(square.id) : undefined;
  if (badge) {
    const factory = $<HTMLAnchorElement>('.visit-factory a');
    factory.href = factoryUrl(badge);
    factory.textContent = `See ${owner}'s own factory`;
    $<HTMLElement>('.visit-factory').hidden = false;
  }

  // How was this built: open beside the room, collapsed on a phone, where it sits below it.
  const entries = level ? [] : historyOf(SQUARE_HISTORY, kind, square.id);
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
  if (level) {
    help.innerHTML = `<p>This square belongs to a participant's own level. <a href="${CLAIM_URL}" target="_blank" rel="noopener">Claim a booth of your own</a> in the North Pole.</p>`;
  } else if (kind === 'booth') {
    help.innerHTML = `<p><span class="visit-ask">Is this yours?</span> <a href="${CHANGE_URL}" target="_blank" rel="noopener">Ask for a change</a> <span aria-hidden="true">·</span> <button class="visit-mine" type="button">Share it as yours</button></p>
      <p><span class="visit-ask">Built your own factory?</span> <a href="${BADGE_REQUEST_URL}" target="_blank" rel="noopener">Get the Elf Engineer badge</a></p>`;
  } else {
    help.innerHTML = `<p>Attractions belong to the North Pole, so only its maintainers change them. <a href="${CLAIM_URL}" target="_blank" rel="noopener">Claim a booth of your own</a> beside it.</p>`;
  }

  // A level's square has no share page of its own: its link opens the level in front of it.
  const link = level
    ? new URL(levelLink(level, square.id), document.baseURI).href
    : shareLink(kind, square.id, document.baseURI);
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
    options.onMine?.();
    edited = false;
    showText();
    $<HTMLDetailsElement>('.visit-edit').open = true;
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
      // No clipboard: the line is shown and selected, to copy by hand.
      $<HTMLDetailsElement>('.visit-edit').open = true;
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
