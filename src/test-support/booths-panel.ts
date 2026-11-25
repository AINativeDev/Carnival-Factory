/**
 * A Booths panel (src/booths-hud.ts) on a fresh page, over a map that only
 * records what the panel asks of it, for the panel's tests.
 */
import { vi } from 'vitest';
import { startBoothsPanel, type BoothsPanelOptions } from '../booths-hud';
import { BOOTHS_PANEL } from '../booths-hud-markup';
import { the } from '../dom';
import type { MapControls, SquareKind } from '../northpole/map';
import type { NorthPoleSquare } from '../northpole/square';

export const square = (id: string, name = id): NorthPoleSquare => ({
  id,
  name,
  description: '',
  draw: () => undefined,
});

/** A map that records the panel's calls, with the squares near the player and the one picked. */
function fakeMap() {
  return {
    near: [] as { kind: SquareKind; id: string }[],
    selected: undefined as { kind: SquareKind; id: string } | undefined,
    visiting: undefined as { kind: SquareKind; id: string } | undefined,
    nearest(count: number) {
      return this.near.slice(0, count);
    },
    walkTo: vi.fn(),
    jumpTo: vi.fn(),
    clearSelection: vi.fn(),
    setMe: vi.fn(),
  };
}

/** Every panel started, so each test can stop the ones it left listening for keys. */
const started: { stop(): void }[] = [];

/** Stops every panel the tests started. */
export function stopPanels() {
  for (const hud of started.splice(0)) hud.stop();
}

/** Starts a panel on a fresh page. `named` holds each square's way to show its name again, as its frame would. */
export function openPanel(
  options: Partial<BoothsPanelOptions> = {},
  given: { selected?: { kind: SquareKind; id: string }; quiet?: boolean } = {},
) {
  document.body.innerHTML = `${BOOTHS_PANEL}<canvas></canvas>`;
  const panel = the(document, '.hud-booths', HTMLDetailsElement);
  const canvas = the(document, 'canvas', HTMLCanvasElement);
  const map = fakeMap();
  map.selected = given.selected;
  const named = new Map<string, () => void>();
  const onPicked = vi.fn();
  const hud = startBoothsPanel(panel, map as unknown as MapControls, canvas, {
    attractions: [square('ferris-wheel', 'Ferris wheel')],
    booths: [square('ana', 'Cocoa'), square('bob', 'Bakery')],
    whenNamed: (one, show) => {
      show();
      named.set(one.id, show);
    },
    ...(given.quiet ? {} : { onPicked }),
    ...options,
  });
  started.push(hud);
  /** The names of the entries in one list, in order. */
  const names = (selector: string) =>
    [...panel.querySelectorAll(`${selector} .hud-go .name`)].map((name) => name.textContent);
  /** An entry's button in one list. */
  const entry = (selector: string, id: string) =>
    the(panel, `${selector} .hud-go[data-id="${id}"]`, HTMLButtonElement);
  return { panel, canvas, map, hud, named, onPicked, names, entry };
}
