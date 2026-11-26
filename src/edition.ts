/**
 * The site's name and this edition's, read from the settings (src/settings.ts),
 * so a future edition changes one setting. "Carnival Factory" is the product; "Christmas
 * edition" is this year's. The North Pole stays the place inside this
 * edition: only the site's own name lives here. The banner and the document
 * title in index.html take them through `fillEdition`, at build time.
 */
import { REPO_URL, SETTINGS } from './settings.ts';

/** The product's name, the same every edition. */
export const SITE_NAME = SETTINGS.site.name;

/** This edition's name, the small tag beside the site's name. */
export const EDITION = SETTINGS.site.edition;

/** The full title: the site's name and its edition, as the browser tab shows it. */
export const SITE_TITLE = `${SITE_NAME} – ${EDITION}`;

/** Fills an HTML page's `%SITE_NAME%`, `%EDITION%`, `%SITE_TITLE%` and `%REPO_URL%` placeholders, so index.html never spells them out. */
export function fillEdition(html: string): string {
  return html
    .replaceAll('%REPO_URL%', REPO_URL)
    .replaceAll('%SITE_TITLE%', SITE_TITLE)
    .replaceAll('%SITE_NAME%', SITE_NAME)
    .replaceAll('%EDITION%', EDITION);
}
