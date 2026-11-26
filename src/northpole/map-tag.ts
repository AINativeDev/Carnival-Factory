/**
 * The tag that names the spot under the mouse, or the one the player stands
 * at: the square's name, its owner, a line about it and a hint. A page element
 * over the canvas, placed clear of the player, so it's kept apart from the
 * drawing.
 */
import { worldToScreen } from './camera-view';
import { platformLabel, siteLabel, squareOf } from './map-labels';
import type { MapRun } from './map-state';
import { inviteFor } from './owners';
import { placeTag, platformTag, tagText } from './visit';
import { toScreen, type Spot, type Tile } from './world';

/** The tag's element and its four parts. */
export interface MapTag {
  element: HTMLElement;
  parts: Record<'name' | 'owner' | 'line' | 'hint', HTMLElement>;
}

/** Makes the tag, hidden, inside the map's frame. */
export function makeTag(frame: HTMLElement): MapTag {
  const element = document.createElement('div');
  element.className = 'hud map-tag';
  element.setAttribute('aria-hidden', 'true');
  const part = (tagName: string, name: string) => {
    const made = document.createElement(tagName);
    made.className = `tag-${name}`;
    return made;
  };
  const parts = {
    name: part('strong', 'name'),
    owner: part('span', 'owner'),
    line: part('span', 'line'),
    hint: part('span', 'hint'),
  };
  element.append(parts.name, ' ', parts.owner, parts.line, parts.hint);
  frame.append(element);
  return { element, parts };
}

/** Writes a spot's name, owner, line and hint into the tag. */
function nameIn(m: MapRun, spot: Spot) {
  const text =
    spot.kind === 'platform' || spot.kind === 'exit'
      ? platformTag(spot.kind, platformLabel(m, spot))
      : tagText(spot, squareOf(m, spot), siteLabel(m, spot).stage);
  const { parts, element } = m.tag;
  parts.name.textContent = text.name;
  parts.owner.textContent = text.owner;
  parts.line.textContent = text.line;
  parts.hint.textContent = text.hint;
  element.dataset.spot = `${spot.kind}:${spot.id ?? spot.number}`;
}

/** Hides the tag. */
function hide(m: MapRun) {
  m.tagged = undefined;
  m.tag.element.classList.remove('shown');
}

/** Shows the tag over the spot under the mouse, or the one the player stands at. */
export function showTag(m: MapRun, zoom: number, centre: Tile) {
  const { frame } = m;
  const tag = m.tag.element;
  const spot = m.visiting ? undefined : (m.hovered ?? m.near);
  // The call to action already names the square it invites into.
  if (spot && spot === inviteFor(m.selected, m.near) && !m.hovered) {
    hide(m);
    return;
  }
  const target = spot && m.targets.find((t) => t.spot === spot);
  if (!spot || !target) {
    hide(m);
    return;
  }
  if (spot !== m.tagged) {
    m.tagged = spot;
    nameIn(m, spot);
  }
  tag.classList.add('shown');
  const width = frame.clientWidth;
  const height = frame.clientHeight;
  const { box } = target;
  const anchor = worldToScreen({ x: box.x + box.w / 2, y: box.y }, width, height, centre, zoom);
  const feet = worldToScreen(toScreen(m.player), width, height, centre, zoom);
  const body = { x: feet.x - 24 * zoom, y: feet.y - 90 * zoom, w: 48 * zoom, h: 96 * zoom };
  const at = placeTag(anchor, { w: tag.offsetWidth, h: tag.offsetHeight }, body, {
    w: width,
    h: height,
  });
  tag.style.transform = `translate(${Math.round(at.x)}px, ${Math.round(at.y)}px)`;
}
