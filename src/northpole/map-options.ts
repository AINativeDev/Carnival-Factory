/**
 * What the page and the map say to each other: the options the page starts the
 * map with, and the controls it gets back. Kept apart from the map's running
 * code so the page's panels and routes can name a square's kind without
 * loading the map itself.
 */
import { type PendingBooth } from './construction-sites';
import type { NorthPoleSquare } from './square';
import type { World } from './world';

export type SquareKind = 'attraction' | 'booth';

export interface MapOptions {
  /** The North Pole's own attractions, round the town square. */
  attractions: readonly NorthPoleSquare[];
  /** Participants' booths, along the lanes. */
  booths: readonly NorthPoleSquare[];
  /** Opens a square: `id` is a booth's owner or an attraction's id. */
  onOpen(kind: SquareKind, id: string): void;
  /** Asks to leave the square the player is inside: they walked out through its doorway. */
  onLeave(): void;
  /** A square to open the map on: the player starts in front of it, and it's picked, so it's highlighted. */
  focus?: { kind: SquareKind; id: string };
  /** The logins whose avatars the build downloaded (scripts/download-avatars.ts); the rest get the elf. */
  avatars?: ReadonlySet<string>;
  /** The visitor's own login, once the page knows it: their booth glows and says "You". */
  me?: string;
  /** Says the picked square changed: picked, or let go with Esc, by going inside, or by picking another. */
  onSelect?(selected: { kind: SquareKind; id: string } | undefined): void;
  /** The accepted booth requests not merged yet, from `pending.json`, if the page has read it. */
  pending?: readonly PendingBooth[];
  /** The logins that were construction sites when the page last saw them: the ones with a booth now sparkle, once. */
  wereSites?: Iterable<string>;
  /** The levels, each with a platform at the sleigh station, and whether it's closed for repairs. */
  levels?: readonly StationEntry[];
  /**
   * A level to walk instead of the North Pole: its world (`levelWorld` in
   * level.ts), its squares as `attractions`. A ride level's visitors ride its
   * coaster instead of walking it (ADR 0041).
   */
  level?: { id: string; name: string; world: World; tint: string; ride?: boolean };
  /** Takes the sleigh from a platform: to the level of `login`, or, without one, back to the North Pole. */
  onTravel?(login: string | undefined): void;
}

/** A level's platform at the sleigh station: its name, its owner, its sign's colour, and whether it's closed. */
export interface StationEntry {
  login: string;
  name: string;
  color: string;
  closed: boolean;
  /** Who its sign says it belongs to: `@login`, or the North Pole for its own. */
  owner?: string;
}

/** What the page can ask of a running map. */
export interface MapControls {
  /** Stops it all. */
  stop(): void;
  /** Picks a square and walks the player to its door, leaving footprints and pointing the way. */
  walkTo(kind: SquareKind, id: string): void;
  /** Puts the player straight at a square's door, glides the camera there, and picks it. */
  jumpTo(kind: SquareKind, id: string): void;
  /** The square picked now, highlighted and invited into, if any. */
  readonly selected: { kind: SquareKind; id: string } | undefined;
  /** Lets go of the picked square. */
  clearSelection(): void;
  /** The `count` squares nearest the player, nearest first. */
  nearest(count: number): { kind: SquareKind; id: string }[];
  /** Says who the visitor is, so their own booth stands out, or that the page doesn't know. */
  setMe(login: string | undefined): void;
  /** Shows the booth requests being built: construction sites on their spots, and "Being updated" on booths. */
  setPending(pending: readonly PendingBooth[]): void;
  /** The logins whose booths are being built, on construction sites now. */
  readonly sites: string[];
  /** Walks the player to the nearest open spot. */
  walkToOpenSpot(): void;
  /** Walks the player to the open spot nearest them, leaving footprints, and bounces its sign. */
  claimNextDoor(): void;
  /** Takes the player inside a square, with a short fade. Returns whether it's there. */
  visit(kind: SquareKind, id: string): boolean;
  /** Takes the player back out, just outside the square's door, facing out. */
  leave(): void;
  /** The square being visited, if any. */
  readonly visiting: { kind: SquareKind; id: string } | undefined;
  /** Shows the whole island, or goes back to the carnival. Returns whether it shows the whole island. */
  toggleOverview(): boolean;
  /** Whether it shows the whole island. */
  readonly overview: boolean;
}
