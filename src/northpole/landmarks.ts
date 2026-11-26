/**
 * Each landmark an attraction may stand as on the home map, and the file that
 * draws it. `drawSpot` looks an attraction's landmark up here, so a new
 * landmark is one more entry and one more small file (ADR 0042).
 */
import type { LandmarkDrawer } from './landmark-parts';
import { drawBigWheel } from './landmark-wheel';
import { drawMerryGoRound } from './landmark-merry-go-round';
import { drawBigTop } from './landmark-big-top';
import { drawCoaster } from './landmark-coaster';
import { drawIceRink } from './landmark-ice-rink';
import { drawGingerbreadHouse } from './landmark-gingerbread';
import { drawShopfront } from './landmark-shopfront';
import { drawCocoaHut } from './landmark-cocoa-hut';
import { drawGameStall } from './landmark-game-stall';
import { drawSchoolhouse } from './landmark-schoolhouse';
import { drawStudio } from './landmark-studio';
import { drawGallery } from './landmark-gallery';
import type { Landmark } from './square';
import { drawTower } from './tower';

/** What draws each landmark, at its 3 by 3 spot's size. */
export const LANDMARK_DRAWERS: Record<Landmark, LandmarkDrawer> = {
  // The Factory's tower, its letters down its front.
  tower: (ctx, spot, square, paint, time) =>
    drawTower(ctx, spot, square, paint, time, square.stall?.letters ?? ''),
  'big-wheel': drawBigWheel,
  'merry-go-round': drawMerryGoRound,
  'big-top': drawBigTop,
  coaster: drawCoaster,
  'ice-rink': drawIceRink,
  'gingerbread-house': drawGingerbreadHouse,
  shopfront: drawShopfront,
  'cocoa-hut': drawCocoaHut,
  'game-stall': drawGameStall,
  schoolhouse: drawSchoolhouse,
  studio: drawStudio,
  gallery: drawGallery,
};
