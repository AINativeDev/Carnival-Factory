import { SITE_NAME } from './edition';
import { REPO_URL } from './northpole/links';

/**
 * Stands in for the "keep me posted" form until a maintainer sets
 * KEEP_POSTED_URL. It collects nothing: it only says the list opens soon.
 */
export function renderKeepPosted(app: HTMLElement) {
  document.body.dataset.view = 'booth';
  app.innerHTML = `
    <section class="booth">
      <div class="booth-header">
        <a href="#/">← Back to the map</a>
        <h1>Keep me posted</h1>
        <p class="description">
          The list for news about the next edition of ${SITE_NAME} opens soon. Nothing is
          collected on this page. In the meantime, watch the repository on GitHub
          for updates.
        </p>
        <p class="booth-help">
          <a href="${REPO_URL}" target="_blank" rel="noopener">Open the repository</a>
        </p>
      </div>
    </section>`;
}
