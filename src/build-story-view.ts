/**
 * Draws a square's build story (build-story.ts) as a timeline in its visit
 * panel. Every name and title is set as text, and every link goes only to
 * https addresses: GitHub, or this site's own previews.
 */
import type { StoryStep } from './build-story';
import { safeHref } from './history';
import { profileUrl } from './northpole/links';

function anchor(href: string, text: string, className: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = className;
  a.href = safeHref(href);
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = text;
  return a;
}

function paragraph(className: string, ...parts: (Node | string)[]) {
  const p = document.createElement('p');
  p.className = className;
  p.append(...parts);
  return p;
}

/** "Asked for by @ana in #70": the label, whose step it is, and where it happened. */
function heading(step: StoryStep) {
  const parts: (Node | string)[] = [step.label];
  if (step.who) {
    const url = profileUrl(step.who);
    parts.push(' ', url ? anchor(url, `@${step.who}`, 'story-person') : `@${step.who}`);
  }
  if (step.link) parts.push(' in ', anchor(step.link.href, step.link.text, 'story-link'));
  return paragraph('story-label', ...parts);
}

/** Fills `list` with the story's steps, replacing what was there. */
export function renderStory(list: HTMLElement, steps: StoryStep[]) {
  list.replaceChildren(
    ...steps.map((step) => {
      const item = document.createElement('li');
      item.className = 'story-step';
      item.dataset.kind = step.kind;
      item.append(heading(step));
      if (step.detail) item.append(paragraph('story-detail', step.detail));
      const meta: (Node | string)[] = step.meta ? [step.meta] : [];
      if (step.preview)
        meta.push(meta.length ? ' · ' : '', anchor(step.preview, 'Preview it', 'story-preview'));
      if (meta.length) item.append(paragraph('story-meta', ...meta));
      return item;
    }),
  );
}
