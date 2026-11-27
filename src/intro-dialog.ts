/**
 * The intro's dialog (docs/specs/intro.md), built but not yet wired: the
 * title, the three beats over their scenes and the two ways on. src/intro.ts
 * opens it, draws its scenes and closes it.
 */
import { SITE_TITLE } from './edition';
import { BOOTH_REQUEST_URL } from './northpole/links';
import { INTRO_BEATS } from './intro-scene';

/** Pixels each beat's scene is drawn at, before CSS fits it to the dialog. */
export const SCENE_SIZE = 240;

/** A new element of the dialog, with its class and perhaps its words, set as text. */
function make<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text = '') {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

/**
 * One beat: its scene, which only decorates, then its title and line. The first
 * beat, writing an issue, is the one people reach for, so it opens the booth
 * form itself, as Get a booth does.
 */
function beat({ title, line }: { title: string; line: string }, index: number) {
  const canvas = make('canvas', 'intro-scene');
  canvas.width = canvas.height = SCENE_SIZE;
  canvas.setAttribute('aria-hidden', 'true');
  const words = make('p', 'intro-line', ` ${line}`);
  words.prepend(make('strong', '', title));
  const item = make('li', 'intro-beat');
  if (index === 0) {
    const link = make('a', 'intro-beat-link');
    Object.assign(link, { href: BOOTH_REQUEST_URL, target: '_blank', rel: 'noopener' });
    link.append(canvas, words);
    item.append(link);
  } else item.append(canvas, words);
  return { item, ctx: canvas.getContext('2d') };
}

/** The dialog over its backdrop: the title, the three beats and the two ways on. */
export function buildDialog() {
  const backdrop = make('div', 'intro-backdrop');
  const dialog = make('section', 'intro');
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'intro-title');
  const title = make('h2', 'intro-title', `Welcome to ${SITE_TITLE}`);
  title.id = 'intro-title';
  const lead = make('p', 'intro-lead', 'Every stall here was asked for by someone. Here is how.');
  const beats = INTRO_BEATS.map(beat);
  const list = make('ol', 'intro-beats');
  list.append(...beats.map(({ item }) => item));
  const explore = make('button', 'intro-explore', 'Explore the North Pole');
  const build = make('a', 'intro-build', 'Get a booth');
  Object.assign(build, { href: BOOTH_REQUEST_URL, target: '_blank', rel: 'noopener' });
  const actions = make('div', 'intro-actions');
  actions.append(explore, build);
  dialog.append(title, lead, list, actions);
  backdrop.append(dialog);
  // The first step's link: it asks for a booth, as Get a booth does.
  const write = beats[0]?.item.firstElementChild as HTMLAnchorElement;
  return { backdrop, dialog, explore, build, write, scenes: beats.map(({ ctx }) => ctx) };
}
