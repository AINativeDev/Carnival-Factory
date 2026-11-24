/**
 * Downloads every booth owner's GitHub avatar into public/avatars/<login>.png,
 * which the build copies to the site, so the map shows them on the booths'
 * signs and inside them without visitors making requests to GitHub. An owner
 * whose avatar can't be fetched gets the elf-silhouette fallback on the page.
 *
 * Run by "Deploy to GitHub Pages", which only runs main's own code, before
 * `npm run build`. Previews skip it and show the fallback.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { avatarUrl, isAvatar, isLogin } from './avatars.ts';

const root = join(import.meta.dirname, '..');
const out = join(root, 'public/avatars');
mkdirSync(out, { recursive: true });

const logins = readdirSync(join(root, 'booths'))
  .filter((name) => existsSync(join(root, 'booths', name, 'booth.ts')) && isLogin(name))
  .map((name) => name.toLowerCase());

let failed = 0;
for (const login of logins) {
  try {
    const response = await fetch(avatarUrl(login), { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!isAvatar(bytes)) throw new Error('not a small image');
    writeFileSync(join(out, `${login}.png`), bytes);
  } catch (error) {
    failed += 1;
    console.warn(`No avatar for ${login}: ${(error as Error).message}`);
  }
}
console.log(`Downloaded ${logins.length - failed} of ${logins.length} avatars.`);
