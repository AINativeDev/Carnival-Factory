import type { NorthPoleSquare, SquarePointer } from '../../../src/northpole/square';
import { theme } from '../../../src/northpole/theme';
import { buttonAt, GRID, PLACES, type Spot, pixels } from './board';
import { partsBoard, spinAndTestBoard, type TestReport } from './control-panel';
import type { Build } from './parts';
import { backdrop, benchAndMat, elf, sign } from './scene';
import {
  carryTip,
  restPose,
  spinAngle,
  spinSpeed,
  type Stage,
  stageAt,
  testOf,
  wobble,
} from './test-mat';
import { lyingTop, top } from './tops';
import { demoAt, HAMMER, hammer, idle, newWorkshop, press, settle, testing } from './workshop';

const { colors } = theme;

/**
 * The top: on the bench while it is built or waits, then carried, spun and
 * tipped over on the mat. `parts` is how much of the bench's top is built.
 */
function drawTop(
  spot: Spot,
  time: number,
  report: TestReport,
  bench: { build: Build; parts: number; building: boolean },
  tested: Build,
) {
  const { test, since, stage, progress } = report;
  const benchTip = { x: PLACES.bench.x - 2, y: PLACES.bench.y };
  const matTip = { x: PLACES.mat.x, y: PLACES.mat.y };
  if (!test || since < 0 || stage === 'done') {
    spot(colors.shadow, benchTip.x - 4, benchTip.y, 9, 1);
    top(spot, bench.build, benchTip.x, benchTip.y, bench.parts, 0, 0);
    if (bench.building && hammer(time) > 0.85) spot(colors.glow, benchTip.x + 6, benchTip.y - 6);
  } else if (stage === 'carry') {
    const tip = carryTip(progress, benchTip, matTip);
    spot(colors.shadow, tip.x - 4, matTip.y, 9, 1);
    top(spot, tested, tip.x, tip.y, 3, 0, 0);
  } else {
    const ms = stage === 'spin' ? progress * test.spin : test.spin;
    const angle = spinAngle(ms, test.spin);
    spot(colors.shadow, matTip.x - 4, matTip.y, 9, 1);
    if (stage === 'spin') {
      // A little spray of snow-dust while it is still fast.
      if (spinSpeed(ms, test.spin) > 0.35) {
        for (let i = 0; i < 4; i++) {
          const a = time / 260 + i * 1.6;
          spot(colors.snowLit, matTip.x + Math.round(Math.cos(a) * 8), matTip.y - 1 - (i % 2), 1);
        }
      }
      top(spot, tested, matTip.x, matTip.y, 3, angle, wobble(ms, test));
    } else {
      // Tipping over, then lying still on its side until it goes back on the bench.
      const pose = restPose(progress);
      if (pose.lying) lyingTop(spot, tested, matTip.x - 5, matTip.y, angle);
      else top(spot, tested, matTip.x, matTip.y, 3, angle, pose.lean);
    }
  }
}

/** The booth's one memory of the pointer: what has been built and tested this visit. */
let workshop = newWorkshop();

const booth: NorthPoleSquare = {
  id: 'sjmaple',
  name: 'Spinning Top Workshop',
  description:
    'Pick a body, stripes and a handle, build your own spinning top, then spin it and see how it tests.',
  draw(ctx, size, time, pointer?: SquarePointer) {
    const spot = pixels(ctx, size);
    const gx = pointer ? (pointer.x / size) * GRID : -1;
    const gy = pointer ? (pointer.y / size) * GRID : -1;
    const hovered = pointer ? buttonAt(gx, gy) : null;
    // A visitor who joins in while the elf is playing carries on from the elf's top.
    if (pointer && pointer.presses > 0 && idle(workshop, time)) {
      workshop = { ...workshop, build: demoAt(time).build };
    }
    workshop = settle(press(workshop, hovered, pointer?.presses ?? 0, time), time);

    // Whose round it is: the visitor's, or the elf's own while nobody plays.
    const demo = idle(workshop, time);
    const elfRound = demoAt(time);
    const build = demo ? elfRound.build : workshop.build;
    // The top out on the mat, and the one the test board reports, is the one let go.
    const tested = demo ? elfRound.build : workshop.tested;
    const launchedAt = demo ? elfRound.launchedAt : workshop.launchedAt;
    const test = launchedAt === null ? null : testOf(tested, launchedAt);
    const since = launchedAt === null ? Infinity : time - launchedAt;
    const { stage, progress } =
      test && since >= 0 ? stageAt(since, test.spin) : { stage: 'done' as Stage, progress: 1 };
    const busy = !demo && testing(workshop, time);
    const report = { test, since, stage, progress, demo, best: workshop.best };

    backdrop(spot, time);
    partsBoard(ctx, spot, size, build, hovered, busy);
    spinAndTestBoard(ctx, spot, size, report, hovered, !busy);
    benchAndMat(spot);
    const building = demo ? since < 0 : time - workshop.changedAt < HAMMER;
    elf(spot, time, building);
    const parts = demo && since < 0 ? elfRound.built : 3;
    drawTop(spot, time, report, { build, parts, building }, tested);
    sign(ctx, spot, size);
  },
};

export default booth;
