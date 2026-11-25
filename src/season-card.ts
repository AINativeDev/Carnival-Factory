import { boothRegistry } from './northpole/booths';
import {
  CLAIM_URL,
  KEEP_POSTED_URL,
  keepPostedHref,
  OWN_REPO_URL,
  signupOffer,
} from './northpole/links';
import type { SandboxedSquare } from './northpole/sandbox';
import type { NorthPoleSquare } from './northpole/square';
import { seasonStats } from '../scripts/season';
import { the } from './dom';
import { deepLink } from './route';
import { SEASON, seasonLines, seasonShareText } from './season';
import { CARD, SCALE, drawCard } from './season-card-drawing';
import { offerCopy, offerDownload } from './season-share';

/** The longest a booth's name may be on the card and in the share text. */
const MAX_NAME = 60;

/** The page for a login with no booth, so no season either. */
function renderNoSeason(app: HTMLElement, login: string) {
  app.innerHTML = `
    <section class="booth">
      <div class="booth-header">
        <a href="#/">← Back to the map</a>
        <h1>No season yet</h1>
        <p class="description"></p>
        <p class="booth-help"><a href="${CLAIM_URL}" target="_blank" rel="noopener">Get a booth</a> to start one.</p>
      </div>
    </section>`;
  the(app, '.description', HTMLElement).textContent = `@${login} doesn't have a booth yet.`;
}

/** The season page's markup. Every name and login goes in later, as text. */
const seasonPage = () => `
    <section class="booth season">
      <div class="booth-header">
        <a class="season-back"></a>
        <h1>Your season</h1>
      </div>
      <canvas class="season-card" role="img"></canvas>
      <div class="season-share">
        <label class="season-label" for="season-share-text">Share text</label>
        <textarea id="season-share-text" class="season-share-text" rows="3"></textarea>
        <div class="share">
          <button class="season-download" type="button">Download</button>
          <button class="share-copy season-copy" type="button">Copy link</button>
        </div>
        <p class="season-note">Nothing is posted for you: download the card, copy the link, and share them where you like.</p>
      </div>
      <div class="season-last">
        <p>
          <strong>Keep your factory running.</strong>
          <a href="${OWN_REPO_URL}" target="_blank" rel="noopener">Set up Tessl on your own repository</a>.
          <a class="season-keep-posted" href="${keepPostedHref()}">Keep me posted</a>.
        </p>
        <p class="season-offer" hidden>
          <a class="season-offer-link" target="_blank" rel="noopener"></a>
          <small>An offer for new Tessl sign-ups; its terms are on the sign-up page. This site adds no tracking.</small>
        </p>
      </div>
    </section>`;

/** The way back to the booth, Keep me posted off the site in a new tab, and the sign-up offer when there is one. */
function fillLinks(app: HTMLElement, login: string) {
  const back = the(app, '.season-back', HTMLAnchorElement);
  back.href = `#/booth/${encodeURIComponent(login)}`;
  back.textContent = `← Back to @${login}'s booth`;
  if (KEEP_POSTED_URL) {
    const keepPosted = the(app, '.season-keep-posted', HTMLAnchorElement);
    keepPosted.target = '_blank';
    keepPosted.rel = 'noopener';
  }
  const offer = signupOffer();
  if (offer) {
    const link = the(app, '.season-offer-link', HTMLAnchorElement);
    link.href = offer.url;
    link.textContent = offer.text;
    the(app, '.season-offer', HTMLElement).hidden = false;
  }
}

/** Draws the card on its canvas every frame, the booth as it is now. Returns how to stop. */
function paintCard(
  canvas: HTMLCanvasElement,
  login: string,
  card: { square: NorthPoleSquare; name: () => string; lines: ReturnType<typeof seasonLines> },
) {
  canvas.width = CARD.width * SCALE;
  canvas.height = CARD.height * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => undefined;
  let frame = 0;
  const paint = (time: number) => {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    const booth = (c: CanvasRenderingContext2D, size: number) => {
      card.square.draw(c, size, time / 1000);
    };
    drawCard(ctx, login, card.name(), booth, card.lines);
    frame = requestAnimationFrame(paint);
  };
  frame = requestAnimationFrame(paint);
  return () => {
    cancelAnimationFrame(frame);
  };
}

/**
 * A participant's season card at `#/season/<login>`: the card on a canvas,
 * Download to save it as a PNG made in the page, Copy link for their booth on
 * the map, a share text they can change, and the gentle last line. Nothing is
 * posted anywhere, and every name is only ever set as text. Returns how to stop
 * the card drawing.
 */
export function renderSeason(app: HTMLElement, login: string): () => void {
  document.body.dataset.view = 'booth';
  const square = boothRegistry.get(login);
  if (!square) {
    renderNoSeason(app, login);
    return () => undefined;
  }
  app.innerHTML = seasonPage();
  fillLinks(app, login);

  const stats = seasonStats(SEASON, login);
  const lines = seasonLines(stats);
  const mapLink = new URL(deepLink('booth', login), document.baseURI).href;
  const name = () => square.name.slice(0, MAX_NAME);

  const canvas = the(app, '.season-card', HTMLCanvasElement);
  const text = the(app, '.season-share-text', HTMLTextAreaElement);
  let edited = false;
  text.addEventListener('input', () => {
    edited = true;
  });
  const show = () => {
    if (!edited) text.value = seasonShareText(login, name(), stats, mapLink);
    const numbers = lines.map((line) => `${line.value} ${line.label}`).join(', ');
    canvas.setAttribute(
      'aria-label',
      `@${login}'s season card: ${name()}${numbers ? `, ${numbers}` : ''}.`,
    );
  };
  show();
  if ('onReady' in square)
    (square as SandboxedSquare).onReady(() => {
      if (canvas.isConnected) show();
    });

  const stopPainting = paintCard(canvas, login, { square, name, lines });
  offerDownload(the(app, '.season-download', HTMLButtonElement), canvas, login);
  const stopCopy = offerCopy(the(app, '.season-copy', HTMLButtonElement), text, mapLink);
  return () => {
    stopPainting();
    stopCopy();
  };
}
