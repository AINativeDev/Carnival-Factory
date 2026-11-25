/**
 * The call to action over a door, "Visit <name>" with its key, or "Claim this
 * plot", and the player's whereabouts the smoke test reads off the canvas. It
 * is a page element over the canvas, not drawn on it, so it's kept apart from
 * the drawing.
 */
import { worldToScreen } from './camera-view';
import { platformLabel, siteLabel, squareOf } from './map-labels';
import type { MapRun } from './map-state';
import { inviteFor, inviteOpacity } from './owners';
import { middle } from './brushes';
import type { Plot, Tile } from './world';

/** What the call to action says for a plot. Its words follow the square's name, which arrives once its frame has opened. */
export function promptWords(m: MapRun, plot: Plot) {
  if (plot.kind === 'open') return 'Claim this plot';
  if (plot.kind === 'site')
    return `Being built for @${String(plot.id)}: ${siteLabel(m, plot).stage}`;
  if (plot.kind === 'exit') return 'Take the sleigh back to the North Pole';
  if (plot.kind === 'platform') {
    const label = platformLabel(m, plot);
    return label.closed
      ? `${label.name} is closed for repairs`
      : `Take the sleigh to ${label.name}`;
  }
  return `Visit ${squareOf(m, plot)?.name ?? plot.id ?? ''}`;
}

/**
 * The call to action over a door, for the picked square if there is one,
 * otherwise the one the player stands at. It fades in after a moment, so
 * walking past doesn't flicker it, and sits above the square, its arrow
 * pointing down at it.
 */
export function showPrompt(m: MapRun, time: number, zoom: number, centre: Tile) {
  const { prompt } = m;
  const plot = m.visiting ? undefined : inviteFor(m.selected, m.near);
  if (plot !== m.invited) {
    m.invited = plot;
    m.invitedAt = time;
  }
  if (plot) {
    const words = promptWords(m, plot);
    if (prompt.title !== words) {
      const text = document.createElement('span');
      text.className = 'prompt-text';
      text.textContent = words;
      const key = document.createElement('kbd');
      key.textContent = m.touchScreen.matches ? 'Tap' : 'E';
      prompt.replaceChildren(text, ' ', key);
      prompt.title = words;
    }
    prompt.dataset.plot = `${plot.kind}:${plot.id ?? plot.number}`;
  }
  prompt.hidden = !plot;
  if (plot) placePrompt(m, plot, time, zoom, centre);
  noteWhereabouts(m);
}

/** Sits the prompt above its plot, kept on the screen, or hides it while the plot is out of view. */
function placePrompt(m: MapRun, plot: Plot, time: number, zoom: number, centre: Tile) {
  const { prompt, frame } = m;
  const target = m.targets.find((t) => t.plot === plot);
  if (!target) {
    prompt.style.opacity = '0';
    return;
  }
  const width = frame.clientWidth;
  const height = frame.clientHeight;
  const top = target.box.y - 40;
  const anchor = worldToScreen({ x: middle(plot).x, y: top }, width, height, centre, zoom);
  const w = prompt.offsetWidth;
  const h = prompt.offsetHeight;
  const x = Math.max(8, Math.min(width - w - 8, anchor.x - w / 2));
  const y = Math.max(8, Math.min(height - h - 8, anchor.y - h));
  prompt.style.translate = `${Math.round(x)}px ${Math.round(y)}px`;
  prompt.style.opacity = `${inviteOpacity(time - m.invitedAt)}`;
}

/** Where the player is, what they're near and what's picked, for the smoke test. */
function noteWhereabouts(m: MapRun) {
  const { canvas, player, near, selected } = m;
  const at = `${Math.round(player.x)},${Math.round(player.y)}`;
  if (canvas.dataset.player !== at) canvas.dataset.player = at;
  const nearBy = near ? `${near.kind}:${near.id ?? near.number}` : '';
  if (canvas.dataset.near !== nearBy) canvas.dataset.near = nearBy;
  const picked = selected ? `${selected.kind}:${String(selected.id)}` : '';
  if (canvas.dataset.selected !== picked) canvas.dataset.selected = picked;
}
