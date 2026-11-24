import { boothRegistry } from '../northpole/booths';
import { backdrop } from '../northpole/diorama';
import {
  CLAIM_URL,
  KEEP_POSTED_URL,
  keepPostedHref,
  OWN_REPO_URL,
  signupOffer,
} from '../northpole/links';
import type { SandboxedSquare } from '../northpole/sandbox';
import type { SeasonStats } from '../scripts/season';
import { canvasFont, theme } from '../northpole/theme';
import { deepLink } from './route';
import { SEASON, seasonHeadline, seasonLines, seasonShareText, type SeasonLine } from './season';

const { colors } = theme;

/** The card's own units: drawn at `SCALE` times this, so its PNG is 1200 by 630. */
export const CARD = { width: 600, height: 315 };
const SCALE = 2;
/** The longest a booth's name may be on the card and in the share text. */
const MAX_NAME = 60;

/** Lines of `text` that fit in `width`, broken at spaces. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Paints the season card in the card's own units: the dusk sky, the booth as
 * it is now in a cream frame on the left, and on the right who it belongs to
 * and the numbers that apply, or a welcome when there are none yet.
 */
function drawCard(
  ctx: CanvasRenderingContext2D,
  login: string,
  boothName: string,
  booth: (ctx: CanvasRenderingContext2D, size: number) => void,
  lines: readonly SeasonLine[],
) {
  const { width, height } = CARD;
  ctx.save();
  ctx.scale(width / 100, height / 100);
  backdrop(ctx);
  ctx.restore();
  ctx.fillStyle = colors.night;
  ctx.globalAlpha = 0.55;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;

  // The booth, framed.
  const size = height - 56;
  ctx.fillStyle = colors.cream;
  ctx.beginPath();
  ctx.roundRect(20, 20, size + 16, size + 16, theme.radius);
  ctx.fill();
  ctx.save();
  ctx.translate(28, 28);
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, theme.radius / 2);
  ctx.clip();
  booth(ctx, size);
  ctx.restore();

  // Who, and their season.
  const left = size + 60;
  const room = width - left - 20;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = colors.gold;
  ctx.font = canvasFont('small', 'bold');
  ctx.fillText('NORTH POLE CARNIVAL', left, 50, room);
  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('title', 'bold');
  ctx.fillText(`@${login}`, left, 88, room);
  ctx.fillStyle = colors.muted;
  ctx.font = canvasFont('small');
  ctx.fillText(seasonHeadline(lines), left, 110, room);
  ctx.fillStyle = colors.glow;
  ctx.font = canvasFont('body', 'bold');
  ctx.fillText(boothName, left, 136, room);

  const top = 172;
  if (lines.length > 0) {
    const step = Math.min(28, (height - 30 - top) / lines.length);
    lines.forEach((line, i) => {
      const y = top + i * step;
      ctx.fillStyle = colors.gold;
      ctx.font = canvasFont('body', 'bold');
      ctx.fillText(String(line.value), left, y, 36);
      ctx.fillStyle = colors.text;
      ctx.font = canvasFont('small');
      ctx.fillText(line.label, left + 32, y, room - 32);
    });
  } else {
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('small');
    const welcome = `A booth of my own on the North Pole map, described in one issue and built by an agent. The first of many.`;
    wrap(ctx, welcome, room).forEach((line, i) => ctx.fillText(line, left, top + i * 20, room));
  }

  ctx.fillStyle = colors.muted;
  ctx.font = canvasFont('small');
  ctx.textAlign = 'right';
  ctx.fillText('Built with Tessl', width - 20, height - 16);
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
    app.innerHTML = `
      <section class="booth">
        <div class="booth-header">
          <a href="#/">← Back to the map</a>
          <h1>No season yet</h1>
          <p class="description"></p>
          <p class="booth-help"><a href="${CLAIM_URL}" target="_blank" rel="noopener">Claim your booth</a> to start one.</p>
        </div>
      </section>`;
    app.querySelector('.description')!.textContent = `@${login} doesn't have a booth yet.`;
    return () => {};
  }

  const offer = signupOffer();
  app.innerHTML = `
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
  const $ = <T extends Element>(selector: string) => app.querySelector<T>(selector)!;

  const back = $<HTMLAnchorElement>('.season-back');
  back.href = `#/booth/${encodeURIComponent(login)}`;
  back.textContent = `← Back to @${login}'s booth`;
  if (KEEP_POSTED_URL) {
    $<HTMLAnchorElement>('.season-keep-posted').target = '_blank';
    $<HTMLAnchorElement>('.season-keep-posted').rel = 'noopener';
  }
  if (offer) {
    const link = $<HTMLAnchorElement>('.season-offer-link');
    link.href = offer.url;
    link.textContent = offer.offer;
    $<HTMLElement>('.season-offer').hidden = false;
  }

  const stats: SeasonStats | undefined = SEASON.participants[login];
  const lines = seasonLines(stats);
  const mapLink = new URL(deepLink('booth', login), document.baseURI).href;
  const name = () => square.name.slice(0, MAX_NAME);

  const canvas = $<HTMLCanvasElement>('.season-card');
  canvas.width = CARD.width * SCALE;
  canvas.height = CARD.height * SCALE;
  const ctx = canvas.getContext('2d')!;
  const text = $<HTMLTextAreaElement>('.season-share-text');
  let edited = false;
  text.addEventListener('input', () => (edited = true));
  const show = () => {
    if (!edited) text.value = seasonShareText(login, name(), stats, mapLink);
    const numbers = lines.map((line) => `${line.value} ${line.label}`).join(', ');
    canvas.setAttribute(
      'aria-label',
      `@${login}'s season card: ${name()}${numbers ? `, ${numbers}` : ''}.`,
    );
  };
  show();
  if ('onReady' in square) (square as SandboxedSquare).onReady(() => canvas.isConnected && show());

  let frame = 0;
  const paint = (time: number) => {
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    drawCard(ctx, login, name(), (c, size) => square.draw(c, size, time / 1000), lines);
    frame = requestAnimationFrame(paint);
  };
  frame = requestAnimationFrame(paint);

  const download = $<HTMLButtonElement>('.season-download');
  download.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const save = document.createElement('a');
      save.href = url;
      save.download = `north-pole-season-${login}.png`;
      save.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  });

  const copy = $<HTMLButtonElement>('.season-copy');
  let reset = 0;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(mapLink);
      copy.textContent = 'Copied!';
    } catch {
      // No clipboard: show the link in the share text, selected, to copy by hand.
      text.focus();
      text.select();
      copy.textContent = 'Copy it from the share text';
    }
    window.clearTimeout(reset);
    reset = window.setTimeout(() => (copy.textContent = 'Copy link'), 2000);
  });

  return () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(reset);
  };
}
