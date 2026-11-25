/**
 * The site's name and this edition's, in one place, so a future edition
 * changes one constant. "Carnival Factory" is the product; "Christmas
 * edition" is this year's. The North Pole stays the place inside this
 * edition: only the site's own name lives here. The banner and the document
 * title in index.html take them through `fillEdition`, at build time.
 */

/** The product's name, the same every edition. */
export const SITE_NAME = 'Carnival Factory';

/** This edition's name, the small tag beside the site's name. */
export const EDITION = 'Christmas edition';

/** The full title: the site's name and its edition, as the browser tab shows it. */
export const SITE_TITLE = `${SITE_NAME} – ${EDITION}`;

/** Fills an HTML page's `%SITE_NAME%`, `%EDITION%` and `%SITE_TITLE%` placeholders, so index.html never spells them out. */
export function fillEdition(html: string): string {
  return html
    .replaceAll('%SITE_TITLE%', SITE_TITLE)
    .replaceAll('%SITE_NAME%', SITE_NAME)
    .replaceAll('%EDITION%', EDITION);
}
