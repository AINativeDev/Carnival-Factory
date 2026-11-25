/**
 * The Elf Engineer badge's own page, which the build writes at
 * `badges/index.html` (vite.config.ts). It is static HTML for people to copy a
 * README snippet from, apart from the badge's rules in scripts/elf-engineer.ts.
 */
import { BADGE_TIERS, badgeImage, badgeSnippet, type BadgeTier } from '../src/northpole/badges.ts';
import { escapeHtml } from './share-pages.ts';

/** One badge's heading, image and snippet; no tier is the plain Elf Engineer badge. */
function badgeSection(site: string, tier: BadgeTier | undefined): string {
  const snippet = badgeSnippet(site || '../', tier);
  const label = tier ? `${tier.charAt(0).toUpperCase()}${tier.slice(1)}` : 'Elf Engineer';
  return `    <section>
      <h2>${label}</h2>
      <p><img src="../${badgeImage(tier)}" alt="Elf Engineer${tier ? `: ${tier}` : ''}" width="200" height="28"></p>
      <pre><code>${escapeHtml(snippet)}</code></pre>
    </section>`;
}

/**
 * The page the build writes at `badges/index.html`: each badge, and the
 * Markdown to paste for it. No scripts, and the images are plain static
 * files, so nothing is tracked. `site` is the site's address, ending in a
 * slash, or empty for links relative to the page.
 */
export function badgePage(site: string, requestUrl: string): string {
  const rows = [undefined, ...BADGE_TIERS].map((tier) => badgeSection(site, tier)).join('\n');
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>The Elf Engineer badge | North Pole Carnival</title>
    <style>
      body { font: 16px/1.5 system-ui, sans-serif; max-width: 44rem; margin: 2rem auto; padding: 0 1rem; }
      pre { white-space: pre-wrap; word-break: break-all; padding: 0.75rem; background: #eef5fb; border-radius: 6px; }
    </style>
  </head>
  <body>
    <h1>The Elf Engineer badge</h1>
    <p>For people who set up a <a href="https://tessl.io">Tessl</a> factory on a repository of their own.
    <a href="${escapeHtml(requestUrl)}">Ask for it</a> with the Elf Engineer form, and once it's granted,
    paste the snippet into your README. Bronze, silver and gold are for 1, 5 and 25 factory pull requests
    merged on your repository: ask again with the same form to move up.</p>
    <p>The badges are plain image files, with no counters and nothing tracked.</p>
${rows}
    <p><a href="${escapeHtml(site || '../')}">Visit the North Pole Carnival</a></p>
  </body>
</html>
`;
}
