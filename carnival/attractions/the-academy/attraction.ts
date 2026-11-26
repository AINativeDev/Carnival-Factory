import type { NorthPoleSquare } from '../../../src/northpole/square';
import { board } from './board';
import { cards } from './cards';
import { shownOf } from './demo';
import { desk, feedback } from './effects';
import { bubble } from './bubble';
import { owl } from './owl';
import { advance, opensAcademy } from './quiz';
import { reportCard } from './report';
import { room } from './room';
import { newQuiz, type Quiz } from './state';
import { teacherOf } from './teacher';

/** Where the owl teacher stands: on the pile of books by the left window. */
const PERCH = { x: 9.5, y: 55.8 };

/** The game, the one state the drawing keeps for a visit. */
let quiz: Quiz | undefined;
/** Whether a tap hit a way out to the real Academy since `ask` last answered. */
let openAcademy = false;

/**
 * The Academy: a pop quiz in a cosy schoolhouse at dusk. An owl teacher
 * in gold spectacles stands by a big chalkboard; each question about
 * building with AI agents runs against a chalk timer, and the visitor taps
 * one of three answer cards for points, faster for more, multiplied by
 * their streak, with three apples on the desk for lives. The report card
 * gives the score, the best of the visit and a grade, and a gold card (or
 * the small sign by the window, any time) opens the real Academy. While
 * nobody plays, a demo plays itself. On the map it stands as its
 * schoolhouse landmark, and its sleigh goes into the level of the same name.
 */
const theAcademy: NorthPoleSquare = {
  id: 'the-academy',
  name: 'The Academy',
  description:
    'Beat the chalk timer in a pop quiz on building with AI agents, then start the real Academy.',
  // How it stands on the home map: what it is, not a pavilion (ADR 0042).
  stall: { shape: 'barn', roof: 'berry', trim: 'cream', landmark: 'schoolhouse' },
  draw(ctx, size, time, pointer) {
    const state = advance(quiz ?? newQuiz(time), time, pointer, size);
    quiz = state;
    // A tap on the way out is the game's only tap that phase can't change, so this is the one advance saw.
    if (opensAcademy(state, pointer, size, time)) openAcademy = true;
    const shown = shownOf(state, time, pointer, size);
    ctx.save();
    ctx.scale(size / 100, size / 100);
    room(ctx, time);
    board(ctx, shown, time);
    if (state.phase === 'report') reportCard(ctx, state, time);
    desk(ctx, shown.quiz.lost, time);
    const teacher = teacherOf(shown, time);
    owl(ctx, PERCH.x, PERCH.y, teacher.pose, teacher.since, time, teacher.target);
    cards(ctx, shown, time);
    feedback(ctx, shown, time);
    // Higher over the mortarboard, so the cap shows.
    const over = teacher.pose === 'graduate' ? 26 : 19.5;
    bubble(ctx, teacher.says, PERCH.x + 1, PERCH.y - over);
    ctx.restore();
  },
  ask() {
    if (!openAcademy) return undefined;
    openAcademy = false;
    return { open: 0 };
  },
};

export default theAcademy;
