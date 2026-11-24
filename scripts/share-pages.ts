/**
 * The link-preview pages the build writes, one per booth and attraction, at
 * `share/<kind>-<id>.html`. Each has Open Graph and Twitter Card tags, so a
 * link to it unfurls in chat and on social, and sends the browser straight on
 * to the world with the player inside the square. They have no scripts: the
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

/** The single-character escapes a string literal can have, and what each stands for. */
const ESCAPES: Record<string, string> = {
  n: '\n',
  r: '\r',
  t: '\t',
  b: '\b',
  f: '\f',
  v: '\v',
  '0': '\0',
};

/**
 * The value of a string literal's body: its escapes decoded as JavaScript
 * decodes them, `\n`, `\u2603`, `\u{1F384}` and `\x41` included, and a
 * line continuation dropped. Any other escaped character stands for itself.
 */
export function decodeLiteral(body: string): string {
  return body.replace(
    /\\(?:u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|(\r\n|[\s\S]))/g,
    (_, point: string, unit: string, byte: string, char: string) => {
      if (point) return String.fromCodePoint(parseInt(point, 16));
      if (unit || byte) return String.fromCharCode(parseInt(unit || byte, 16));
      if (/^(\r\n|[\r\n\u2028\u2029])$/.test(char)) return '';
      return ESCAPES[char] ?? char;
    },
  );
}

/**
 * A square's name and description, read from its module's source: the first
 * `name:` and `description:` set to a plain string literal, decoded. Either is
 * undefined when the source doesn't set it that way.
 */
export function readSquareInfo(source: string): { name?: string; description?: string } {
  const field = (key: string) => {
    const match = source.match(new RegExp(`\\b${key}:\\s*(['"\`])((?:\\\\.|(?!\\1)[^\\\\])*)\\1`));
    return match ? decodeLiteral(match[2]) : undefined;
  };
  return { name: field('name'), description: field('description') };
}

/** The site's own address, for absolute image links: from `SITE_URL`, or GitHub Pages' for the repository. */
export function siteUrl(env: Record<string, string | undefined>): string | undefined {
  if (env.SITE_URL) return env.SITE_URL.endsWith('/') ? env.SITE_URL : `${env.SITE_URL}/`;
  const repo = env.GITHUB_REPOSITORY?.match(/^([\w.-]+)\/([\w.-]+)$/);
  return repo ? `https://${repo[1].toLowerCase()}.github.io/${repo[2]}/` : undefined;
}

/** The world's address that takes the player inside a square, from a share page. */
export const worldLink = (kind: ShareKind, id: string) => `../#/${kind}/${encodeURIComponent(id)}`;

/**
 * A square's share page. `image` is the map's screenshot: absolute when the
 * site's address is known, since link previews want one, else beside the page.
 */
export function sharePage(square: SharedSquare, image: string): string {
  const title = escapeHtml(
    square.kind === 'booth'
      ? `${square.name}, by @${square.id}, at the North Pole Carnival`
      : `${square.name} at the North Pole Carnival`,
  );
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
