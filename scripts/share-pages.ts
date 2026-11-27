/**
 * The link-preview pages the build writes, one per booth and attraction, at
 * `share/<kind>-<id>.html`, and one for the factory's numbers at
 * `share/factory.html`. Each has Open Graph and Twitter Card tags, so a
 * link to it unfurls in chat and on social, and sends the browser straight on
 * to the world with the player inside the square. They have no scripts: the
 * redirect is a meta refresh, with a plain link beside it. No tracking.
 */
import { SITE_NAME, SITE_TITLE } from '../src/edition.ts';

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
      // Stryker disable next-line Regex: `char` is one escaped character or a CRLF, so it is always the whole match.
      if (/^(\r\n|[\r\n\u2028\u2029])$/.test(char)) return '';
      return ESCAPES[char] ?? char;
    },
  );
}

/**
 * A square's name and description, read from its module's source: the first
 * `name:` and `description:` set to a plain string literal, decoded. Given the
 * square's `id`, it reads them from after the `id:` that sets it, so an earlier
 * object with a `name:` of its own, such as a list of gifts, isn't mistaken for
 * the square. Either is undefined when the source doesn't set it that way.
 */
export function readSquareInfo(
  source: string,
  id?: string,
): { name?: string; description?: string } {
  const literal = String.raw`(['"\`])((?:\\.|(?!\1)[^\\])*)\1`;
  const own = id
    ? source.search(new RegExp(String.raw`\bid:\s*(['"\`])${id.replace(/[^\w-]/g, '\\$&')}\1`))
    : -1;
  // Stryker disable next-line EqualityOperator: an id at the very start slices off nothing, so 0 reads the same either way.
  const from = own >= 0 ? source.slice(own) : source;
  const field = (key: string) => {
    const match = from.match(new RegExp(`\\b${key}:\\s*${literal}`));
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
  return previewPage({
    title:
      square.kind === 'booth'
        ? `${square.name}, by @${square.id}, at ${SITE_NAME}`
        : `${square.name} at ${SITE_NAME}`,
    description: square.description || `Visit ${square.name} at ${SITE_NAME}, and get a booth too.`,
    to: worldLink(square.kind, square.id),
    link: `Visit ${square.name} at ${SITE_NAME}`,
    image,
  });
}

/** The factory's numbers page, `#/factory`, from its share page. */
export const FACTORY_LINK = '../#/factory';

/** The share page of the factory's numbers, `share/factory.html`. */
export function factorySharePage(image: string): string {
  return previewPage({
    title: `The factory behind ${SITE_NAME}`,
    description: `How many booths a software factory has built for ${SITE_TITLE}, and how busy it is.`,
    to: FACTORY_LINK,
    link: "See the factory's numbers",
    image,
  });
}

/** A link-preview page: its tags, and a meta refresh on to `to`, with a plain link beside it. */
function previewPage(page: {
  title: string;
  description: string;
  to: string;
  link: string;
  image: string;
}): string {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const to = escapeHtml(page.to);
  const picture = escapeHtml(page.image);
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
    <meta property="og:site_name" content="${escapeHtml(SITE_TITLE)}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${picture}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${picture}" />
  </head>
  <body style="font-family: system-ui, sans-serif; text-align: center; padding: 2em">
    <p><a href="${to}">${escapeHtml(page.link)}</a></p>
  </body>
</html>
`;
}
