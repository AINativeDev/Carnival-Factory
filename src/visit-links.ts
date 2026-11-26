/**
 * A booth's own links on its visit panel, each behind its feature flag
 * (docs/adr/0046-launch-behind-feature-flags.md): Remix this booth, an Elf
 * Engineer's own factory, and its place on the People's Choice ballot. Every
 * login is set as text.
 */
import { badgeFor, factoryUrl } from './northpole/badges';
import { remixUrl } from './northpole/links';
import type { SquareKind } from './northpole/map-options';
import { voteUrl } from './northpole/peoples-choice';
import { shownChoice } from './northpole/peoples-choice-standings';
import { isOn } from './feature-flags';

/** Shows the links `card` has for a `kind` square `id`; `remix(name)` points Remix at its name once known. */
export function showBoothLinks(
  card: HTMLElement,
  kind: SquareKind | 'level',
  id: string,
  level?: string,
) {
  const booth = kind === 'booth' && !level;
  const remix = card.querySelector<HTMLAnchorElement>('.visit-remix-link');
  if (remix) remix.hidden = !booth || !isOn('remix');
  // An Elf Engineer's booth links to the factory on their own repository.
  const badge = kind === 'booth' && isOn('elfEngineer') ? badgeFor(id) : undefined;
  const factory = card.querySelector<HTMLAnchorElement>('.visit-factory a');
  if (badge && factory?.parentElement) {
    factory.href = factoryUrl(badge);
    factory.textContent = `See @${id}'s own factory`;
    factory.parentElement.hidden = false;
  }
  // A booth's place on the People's Choice ballot, where a 👍 on its comment is a vote.
  const vote = kind === 'booth' ? voteUrl(id, shownChoice()) : undefined;
  const voteLink = card.querySelector<HTMLAnchorElement>('.visit-vote');
  if (vote && voteLink) [voteLink.href, voteLink.hidden] = [vote, false];
  return {
    remix(name: string) {
      if (remix) remix.href = remixUrl(id, name);
    },
  };
}
