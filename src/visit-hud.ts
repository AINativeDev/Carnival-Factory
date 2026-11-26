import type { SquareKind } from './northpole/map-options';
import type { SandboxedSquare } from './northpole/sandbox';
import type { NorthPoleSquare } from './northpole/square';
import { shareLink } from './northpole/visit';
import {
  SQUARE_HISTORY,
  creditsFor,
  emptyHistoryText,
  historyOf,
  loadHistoryFile,
} from './history';
import type { SquareHistory } from '../scripts/square-history';
import { storySteps } from './build-story';
import { renderStory } from './build-story-view';
import { roomPills, wireShare } from './visit-share';
import { showSignupOffer } from './offer';
import { VISIT_PANEL } from './visit-template';
import { deepLink, levelLink } from './route';
import { SQUARE_CRAFT, craftKey, earnedBadges, renderCraft } from './craft-badges';
import { fillVisitHelp, offerLevelNext } from './visit-help';
import { squareOwner } from './northpole/north-pole-levels';
import { linksHome } from './northpole/north-pole-links';
import { showLevelLinks } from './level-links';
import { showYearAnswers } from './year-in-review-panel';
import { focusBack } from './focus-back';
import { fullScreenPill } from './visit-full-screen';
import { showBoothLinks } from './visit-links';
import { followLinkAsks } from './visit-link-out';

export interface VisitHudOptions {
  /** A square's kind, or `level` for the panel beside a level's own map (level-panel.ts). */
  kind: SquareKind | 'level';
  square: Pick<NorthPoleSquare, 'id' | 'name' | 'description'>;
  /** Whether to show the invitation to build a booth of your own, for someone who came by a shared link. */
  invite: boolean;
  /** Leaves the square: Esc, or the Leave button. */
  onClose(): void;
  /** Claim the spot next door. */
  onClaim(): void;
  /** Says the visitor shared this booth as theirs, so the map knows who they are. */
  onMine?(): void;
  /** Whether the visitor said this booth is theirs, so the panel offers them a level next. */
  mine?: boolean;
  /** The owner of the level this square is in, for one of a level's own squares. */
  level?: string;
}

/** The HUD of a visit: `close` takes it away and gives focus back. */
export interface VisitHud {
  close(): void;
}

/** A visit's HUD, and the panel it shows, for a level's panel to fit (level-panel.ts). */
export type VisitPanel = VisitHud & { card: HTMLElement };

/**
 * The panel inside a square the player has entered, beside the room the map
 * draws. The room's own sign already shows the square's name and maker, so the
 * panel leads with what the room can't show: how the square was built, from the
 * first request to the map (build-story.ts). Then one row of actions, and a
 * quiet footer. Focus moves into it, and back out when it closes. Every name and
 * description is only ever set as text.
 */
export function openVisitHud(frame: HTMLElement, options: VisitHudOptions): VisitPanel {
  const { kind, square, level } = options;
  // A level's own panel stands beside its map while the player walks it: it never takes the keys.
  const walking = kind === 'level';
  const before = document.activeElement as HTMLElement | null;
  const card = document.createElement('section');
  card.className = 'hud visit';
  card.setAttribute('aria-labelledby', 'visit-title');
  card.setAttribute('aria-describedby', 'visit-description');
  card.dataset.kind = kind;
  card.dataset.id = square.id;
  card.innerHTML = VISIT_PANEL;
  // The name and description may stand left of the drawing, outside the panel (visit-columns.ts).
  const $ = <T extends Element>(selector: string) =>
    (card.querySelector<T>(selector) ?? frame.querySelector<T>(`.visit-left ${selector}`))!;
  // Whose square it is: a booth's owner, a participant's level's, or nobody for the North Pole's own.
  const login = squareOwner(kind, square.id, level);
  const owner = login ? `@${login}` : '';
  const links = showBoothLinks(card, kind, square.id, level);
  const map = $<HTMLAnchorElement>('.visit-map');
  map.href = level
    ? levelLink(level, square.id)
    : walking
      ? levelLink(square.id)
      : deepLink(kind, square.id);
  if (level) map.textContent = 'See it in the level';
  // How it was built: a level's square credits the level's owner, with no history of its own.
  const tellStory = (data: SquareHistory | undefined) => {
    const steps = level
      ? storySteps([], login ? { maker: login, improvers: [] } : undefined)
      : storySteps(historyOf(data, kind, square.id), creditsFor(data, kind, square.id));
    renderStory($('.story-list'), steps);
    const empty = $<HTMLElement>('.history-empty');
    empty.textContent = emptyHistoryText(data);
    empty.hidden = steps.length > 0;
  };
  tellStory(SQUARE_HISTORY);
  // A preview has no history baked in: the deploy puts the live site's beside it.
  if (!SQUARE_HISTORY && !level)
    void loadHistoryFile().then((data) => {
      if (card.isConnected && data) tellStory(data);
    });
  renderCraft(
    $('.visit-craft'),
    earnedBadges(SQUARE_CRAFT, craftKey(kind, square.id, level)),
    (tag) => document.createElement(tag),
  );
  showSignupOffer(card);
  fillVisitHelp($('.visit-help'), kind, square.id, level);

  // A level and its squares have no share page of their own: the link opens the level, in front of the square.
  const link =
    level || walking
      ? new URL(level ? levelLink(level, square.id) : levelLink(square.id), document.baseURI).href
      : shareLink(kind, square.id, document.baseURI);
  $('.visit-by').textContent = owner && `by ${owner}`;
  // Full screen is a square's: a level's own panel stands beside its map, which has none.
  const tools = $<HTMLElement>('.visit-tools');
  const full = walking ? undefined : fullScreenPill(frame, tools);
  const share = wireShare(
    {
      ...roomPills(card, walking, frame),
      full,
      text: $('.visit-share-text'),
      options: $('.visit-more'),
    },
    { kind, id: square.id, name: () => square.name },
    link,
  );

  const show = () => {
    $('.visit-title').textContent = square.name;
    $('.visit-description').textContent = square.description;
    links.remix(square.name);
    share.refresh();
  };
  show();
  // A Year in Review item's answers, under its question and the link to add yours.
  showYearAnswers($('.visit-description'), square.id, level);
  // The North Pole's own levels link out, to the Academy or the podcast, right under what they are.
  showLevelLinks($('.visit-description'), linksHome(kind, square.id, level));
  // A North Pole place's game opens its links from inside too.
  const linkOut = followLinkAsks(frame, square, kind, square.id, level);
  if ('onReady' in square)
    (square as SandboxedSquare).onReady(() => {
      if (card.isConnected) show();
    });

  card.querySelector('.visit-mine')?.addEventListener('click', () => {
    options.onMine?.();
    share.shareAsMine();
    offerLevelNext(card);
  });
  // Someone who came by a shared link to a booth can claim the spot next door instead.
  const claim = options.invite && kind === 'booth';
  $<HTMLElement>('.visit-claim').hidden = !claim;
  $<HTMLElement>('.visit-build').hidden = claim;
  if (options.mine) offerLevelNext(card);
  $('.visit-claim').addEventListener('click', () => {
    options.onClaim();
  });
  $('.visit-close').addEventListener('click', () => {
    options.onClose();
  });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      options.onClose();
    }
  };
  if (!walking) document.addEventListener('keydown', onKeyDown);

  frame.append(card);
  if (!walking) $<HTMLElement>('.visit-title').focus({ preventScroll: true });

  return {
    card,
    close() {
      // Its name may have the focus left of the drawing, until share.stop takes that column away.
      const hadFocus =
        card.contains(document.activeElement) ||
        !!frame.querySelector('.visit-left')?.contains(document.activeElement);
      share.stop();
      linkOut.stop();
      document.removeEventListener('keydown', onKeyDown);
      card.remove();
      if (hadFocus) focusBack(before, frame);
    },
  };
}
