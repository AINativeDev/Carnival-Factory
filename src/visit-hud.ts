import { badgeFor, factoryUrl } from './northpole/badges';
import { voteUrl } from './northpole/peoples-choice';
import { PEOPLES_CHOICE } from './northpole/peoples-choice-standings';
import {
  BUILD_YOUR_OWN_URL,
  HOW_IT_WORKS_URL,
  KEEP_POSTED_URL,
  OWN_REPO_URL,
  keepPostedHref,
  remixUrl,
} from './northpole/links';
import type { SquareKind } from './northpole/map';
import type { SandboxedSquare } from './northpole/sandbox';
import type { NorthPoleSquare } from './northpole/square';
import { shareLink } from './northpole/visit';
import { SQUARE_HISTORY, creditsFor, emptyHistoryText, historyOf } from './history';
import { storySteps } from './build-story';
import { renderStory } from './build-story-view';
import { wireShare } from './visit-share';
import { SIGNUP_OFFER, showSignupOffer } from './offer';
import { deepLink, levelLink } from './route';
import { SQUARE_CRAFT, craftKey, earnedBadges, renderCraft } from './craft-badges';
import { fillVisitHelp } from './visit-help';

export interface VisitHudOptions {
  kind: SquareKind;
  square: NorthPoleSquare;
  /** Whether to show the invitation to build a booth of your own, for someone who came by a shared link. */
  invite: boolean;
  /** Leaves the square: Esc, or the Leave button. */
  onClose(): void;
  /** Claim the plot next door. */
  onClaim(): void;
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
 * The panel inside a square the player has entered, beside the room the map
 * draws. The room's own sign already shows the square's name and maker, so the
 * panel leads with what the room can't show: how the square was built, from the
 * first request to the map (build-story.ts). Then one row of actions, and a
 * quiet footer. Focus moves into it, and back out when it closes. Every name and
 * description is only ever set as text.
 */
export function openVisitHud(frame: HTMLElement, options: VisitHudOptions): VisitHud {
  const { kind, square, level } = options;
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
    <p class="visit-description" id="visit-description"></p>
    <section class="visit-story" aria-labelledby="visit-story-title">
      <h3 id="visit-story-title" class="visit-eyebrow">How it was built</h3>
      <ol class="story-list"></ol>
      <p class="history-empty" hidden></p>
      <p class="visit-craft" hidden></p>
    </section>
    <div class="visit-invite" hidden>
      <p class="visit-invite-text"></p>
      <button class="visit-claim" type="button">Claim the plot next door</button>
      <a class="visit-how" href="${HOW_IT_WORKS_URL}" target="_blank" rel="noopener">How it works</a>
    </div>
    <div class="visit-actions">
      <button class="visit-copy" type="button">Share</button>
      <a class="visit-vote" target="_blank" rel="noopener" hidden>Vote for this booth</a>
      <a class="visit-remix-link" target="_blank" rel="noopener">Remix this booth</a>
      <a class="visit-build" href="${BUILD_YOUR_OWN_URL}" target="_blank" rel="noopener">Build your own</a>
    </div>
    <details class="visit-edit">
      <summary>Share options</summary>
      <label class="visit-label" for="visit-share-text">The message Share copies</label>
      <textarea id="visit-share-text" class="visit-share-text" rows="4"></textarea>
      <a class="visit-map">See it on the map</a>
    </details>
    <footer class="visit-more">
      <p class="visit-factory" hidden><a target="_blank" rel="noopener"></a></p>
      <p><a class="history-factory-link" href="#/factory">See the factory's numbers</a> · <a class="history-own-link" href="${OWN_REPO_URL}" target="_blank" rel="noopener">Run a factory on your own repo</a></p>
      ${SIGNUP_OFFER}
      <div class="visit-help"></div>
      <p class="visit-foot">Next North Pole event? ${KEEP_POSTED_LINK}</p>
    </footer>`;
  const $ = <T extends Element>(selector: string) => card.querySelector<T>(selector)!;
  const owner = kind === 'attraction' && !level ? '' : `@${level ?? square.id}`;
  const remix = $<HTMLAnchorElement>('.visit-remix-link');
  remix.hidden = kind !== 'booth' || !!level;
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

  // A booth's place on the People's Choice ballot, where a 👍 on its comment is a vote.
  const vote = kind === 'booth' ? voteUrl(square.id, PEOPLES_CHOICE) : undefined;
  if (vote) {
    $<HTMLAnchorElement>('.visit-vote').href = vote;
    $<HTMLElement>('.visit-vote').hidden = false;
  }

  // How it was built: a level's square credits the level's owner, with no history of its own.
  const history = level ? [] : historyOf(SQUARE_HISTORY, kind, square.id);
  const credits = level
    ? { maker: level, improvers: [] }
    : creditsFor(SQUARE_HISTORY, kind, square.id);
  const steps = storySteps(history, credits);
  renderStory($('.story-list'), steps);
  const empty = $<HTMLElement>('.history-empty');
  empty.textContent = emptyHistoryText(SQUARE_HISTORY);
  empty.hidden = steps.length > 0;
  renderCraft(
    $('.visit-craft'),
    earnedBadges(SQUARE_CRAFT, craftKey(kind, square.id, level)),
    (tag) => document.createElement(tag),
  );
  showSignupOffer(card);
  fillVisitHelp($('.visit-help'), kind, square.id, level);

  // A level's square has no share page of its own: its link opens the level in front of it.
  const link = level
    ? new URL(levelLink(level, square.id), document.baseURI).href
    : shareLink(kind, square.id, document.baseURI);
  const share = wireShare(
    { copy: $('.visit-copy'), text: $('.visit-share-text'), options: $('.visit-edit') },
    { kind, id: square.id, name: () => square.name },
    link,
  );

  const show = () => {
    $('.visit-title').textContent = square.name;
    $('.visit-description').textContent = square.description;
    remix.href = remixUrl(square.id, square.name);
    $('.visit-invite-text').textContent =
      'Want one of your own? Describe it in an issue, and the factory builds it on the plot next door.';
    share.refresh();
  };
  show();
  if ('onReady' in square) (square as SandboxedSquare).onReady(() => card.isConnected && show());

  card.querySelector('.visit-mine')?.addEventListener('click', () => {
    options.onMine?.();
    share.shareAsMine();
  });

  $<HTMLElement>('.visit-invite').hidden = !(options.invite && kind === 'booth');
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
      share.stop();
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
