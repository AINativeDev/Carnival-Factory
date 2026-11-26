/**
 * The markup of a square's visit panel (visit-hud.ts fills it in): its name
 * and maker with Share and Full screen beside them, the description, the build story first, one quiet row of actions, one ask (or,
 * for a booth's owner, the level that comes next), and
 * everything else folded under More. Only fixed text and the repository's own
 * links are written here; every name and description is set as text later.
 */
import { SITE_NAME } from './edition';
import {
  BUILD_YOUR_OWN_URL,
  KEEP_POSTED_URL,
  LEVEL_REQUEST_URL,
  OWN_REPO_URL,
  keepPostedHref,
} from './northpole/links';
import { SIGNUP_OFFER } from './offer';

/** The "Keep me posted" link: to the real form, in a new tab, once it's set; else to the placeholder page. */
export const keepPostedLink = (formUrl: string, href: string) =>
  formUrl
    ? `<a href="${href}" target="_blank" rel="noopener">Keep me posted</a>.`
    : `<a href="${href}">Keep me posted</a>.`;

const KEEP_POSTED_LINK = keepPostedLink(KEEP_POSTED_URL, keepPostedHref());

export const VISIT_PANEL = `
    <p class="visit-leave"><span>Esc to leave</span> <button class="visit-close" type="button">Leave</button></p>
    <div class="visit-head">
      <div class="visit-named">
        <h2 id="visit-title" class="visit-title" tabindex="-1"></h2>
        <p class="visit-by"></p>
      </div>
      <div class="visit-tools"></div>
    </div>
    <p class="visit-description" id="visit-description"></p>
    <section class="visit-story" aria-labelledby="visit-story-title">
      <h3 id="visit-story-title" class="visit-eyebrow">How it was built</h3>
      <ol class="story-list"></ol>
      <p class="history-empty" hidden></p>
      <p class="visit-craft" hidden></p>
    </section>
    <div class="visit-actions">
      <a class="visit-vote" target="_blank" rel="noopener" hidden>Vote for this booth</a>
      <a class="visit-remix-link" target="_blank" rel="noopener">Remix this booth</a>
    </div>
    <div class="visit-footer">
      <div class="visit-ask">
        <p class="visit-want">Want one too? <a class="visit-build" href="${BUILD_YOUR_OWN_URL}" target="_blank" rel="noopener">Get a booth</a><button class="visit-claim" type="button" hidden>Get the spot next door</button></p>
        <p class="visit-next" hidden>Next: <a href="${LEVEL_REQUEST_URL}" target="_blank" rel="noopener">get a level of your own</a></p>
      </div>
    </div>
    <details class="visit-more">
      <summary>More</summary>
      <div class="visit-edit">
        <label class="visit-label" for="visit-share-text">The message Share copies</label>
        <textarea id="visit-share-text" class="visit-share-text" rows="4"></textarea>
        <a class="visit-map">See it on the map</a>
      </div>
      <p class="visit-factory" hidden><a target="_blank" rel="noopener"></a></p>
      <p><a class="history-factory-link" href="#/factory">See the factory's numbers</a> · <a class="history-own-link" href="${OWN_REPO_URL}" target="_blank" rel="noopener">Run a factory on your own repo</a></p>
      ${SIGNUP_OFFER}
      <div class="visit-help"></div>
      <p class="visit-foot">Next edition of ${SITE_NAME}? ${KEEP_POSTED_LINK}</p>
    </details>`;
