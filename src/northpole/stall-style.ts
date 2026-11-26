/**
 * How a square's stall looks on the map, as plain data a square sends from its
 * sandbox: the shapes the map draws for booths and levels' squares, the theme
 * colours for its roof and trim, and the landmarks only attractions stand as.
 * `square.ts` passes them on, so a booth imports them from there.
 */
import { theme } from './theme';

/** The stall shapes the map knows how to draw. `stall` is the market stall with an awning. */
export const STALL_SHAPES = [
  'stall',
  'shed',
  'tent',
  'cabin',
  'kiosk',
  'igloo',
  'gazebo',
  'chalet',
  'treehouse',
  'windmill',
  'lighthouse',
  'food-truck',
  'carousel',
  'turret',
  'barn',
  'pagoda',
] as const;

export type StallShape = (typeof STALL_SHAPES)[number];

/** The name of one of the `theme` colours, such as `'gold'`. */
export type ThemeColor = keyof typeof theme.colors;

/**
 * How a booth's stall on the map looks, as plain data: its `shape`, its
 * `roof` colour, and an optional `trim` colour for stripes or the awning,
 * each a `theme` colour's name. The map draws it, never the booth's own code:
 * `stall` is a market stall with an awning, `shed` a long, low shed with a
 * flat roof, `tent` a round striped tent, `cabin` a log cabin with a snowy
 * pitched roof, `kiosk` a small hexagonal kiosk, `igloo` a dome of snow
 * blocks, `gazebo` a round gazebo with a domed roof, `chalet` an alpine chalet
 * with deep eaves, `treehouse` a hut up a trunk with a ladder, `windmill` a
 * mill with turning sails, `lighthouse` a striped tower with a turning lamp,
 * `food-truck` a truck with a serving hatch, `carousel` a small carousel,
 * `turret` a stone turret, `barn` a red-roofed barn and `pagoda` a pagoda with
 * tiered roofs. A square that leaves it out gets one picked from its id.
 */
export interface StallStyle {
  shape: StallShape;
  roof: ThemeColor;
  trim?: ThemeColor;
  /** For an attraction only: stand on the map as this landmark instead (`landmarks.ts`). */
  landmark?: Landmark;
  /** For a `tower` landmark only: up to six capitals down its front. */
  letters?: string;
  /**
   * For an attraction or a level's square only: stand as an item to discover,
   * a framed card on a low plinth with a cloth in the `roof` colour (ADR 0040).
   */
  display?: boolean;
  /** How the screen round its drawing looks while someone is inside it (`SCENES`). */
  scene?: Scene;
}

/**
 * The moods a square's drawing can stand in while someone is inside it:
 * `glow`, a soft, dimmed glow of its own colours all round (the default), or
 * `chiaroscuro`, darkness all round and one warm light from the upper left,
 * its edges falling into shadow (docs/adr/0057-a-visit-is-the-booth-not-a-room.md).
 */
export const SCENES = ['glow', 'chiaroscuro'] as const;
export type Scene = (typeof SCENES)[number];

/**
 * The landmarks an attraction may stand as on the home map, each drawn at its
 * 3 by 3 spot's size as what it is: The Factory's lettered tower, a big
 * wheel, a merry-go-round, a big top, a coaster, an ice rink, a gingerbread
 * house, a shopfront, a cocoa hut, a game stall, a schoolhouse, a studio and a gallery.
 * Only attractions get one: the map drops it from a booth's or a level's
 * square (ADR 0042).
 */
export const LANDMARKS = [
  'tower',
  'big-wheel',
  'merry-go-round',
  'big-top',
  'coaster',
  'ice-rink',
  'gingerbread-house',
  'shopfront',
  'cocoa-hut',
  'game-stall',
  'schoolhouse',
  'studio',
  'gallery',
] as const;

export type Landmark = (typeof LANDMARKS)[number];

/** A tower landmark's letters: one to six capitals. */
export const LANDMARK_LETTERS = /^[A-Z]{1,6}$/;
