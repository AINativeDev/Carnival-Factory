/**
 * The link-preview pages the build writes, one per booth and attraction, at
 * `share/<kind>-<id>.html`. Each has Open Graph and Twitter Card tags, so a
 * link to it unfurls in chat and on social, and sends the browser straight on
 * to the world with the square's visit card open. They have no scripts: the
 * redirect is a meta refresh, with a plain link beside it. No tracking.
 */

export type ShareKind = 'booth' | 'attraction';

export interface SharedSquare {
  kind: ShareKind;
  id: string;
  name: string;
  description: string;
}

/** Text made safe for HTML, attribute values included. */
export const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

/**
 * A square's name and description, read from its module's source: the first
 * `name:` and `description:` set to a plain string literal. Either is
 * undefined when the source doesn't set it that way.
 */
export function readSquareInfo(source: string): { name?: string; description?: string } {
  const field = (key: string) => {
    const match = source.match(new RegExp(`\\b${key}:\\s*(['"\`])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`));
    return match?.[2].replace(/\\(.)/g, '$1');
  };
  return { name: field('name'), description: field('description') };
}

/** The site's own address, for absolute image links: from `SITE_URL`, or GitHub Pages' for the repository. */
export function siteUrl(env: Record<string, string | undefined>): string | undefined {
  if (env.SITE_URL) return env.SITE_URL.endsWith('/') ? env.SITE_URL : `${env.SITE_URL}/`;
  const repo = env.GITHUB_REPOSITORY?.match(/^([\w.-]+)\/([\w.-]+)$/);
  return repo ? `https://${repo[1].toLowerCase()}.github.io/${repo[2]}/` : undefined;
}

/** The world's address that opens a square's visit card, from a share page. */
export const worldLink = (kind: ShareKind, id: string) => `../#/${kind}/${encodeURIComponent(id)}`;

/**
 * A square's share page. `image` is the map's screenshot: absolute when the
 * site's address is known, since link previews want one, else beside the page.
 */
export function sharePage(square: SharedSquare, image: string): string {
  const by = square.kind === 'booth' ? `@${square.id}` : 'the North Pole';
  const title = escapeHtml(`${square.name}, by ${by}, at the North Pole Carnival`);
  const description = escapeHtml(
    square.description ||
      `Visit ${square.name} at the North Pole Carnival, and build a booth of your own.`,
  );
  const to = escapeHtml(worldLink(square.kind, square.id));
  const picture = escapeHtml(image);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="referrer" content="no-referrer" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'" />
    <meta http-equiv="refresh" content="0; url=${to}" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="North Pole Carnival" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${picture}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${picture}" />
  </head>
  <body style="font-family: system-ui, sans-serif; text-align: center; padding: 2em">
    <p><a href="${to}">Visit ${escapeHtml(square.name)} at the North Pole Carnival</a></p>
  </body>
</html>
`;
}
