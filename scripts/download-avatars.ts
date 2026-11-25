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

/** How the avatars are fetched: `fetch` itself, or a test's stand-in for it. */
type Fetch = (url: string, init: RequestInit) => Promise<Response>;

/** The owners of the booths in `root`, in lower case: only folders with a booth and a real login. */
export function boothOwners(root: string): string[] {
  return readdirSync(join(root, 'carnival', 'booths'))
    .filter(
      (name) => existsSync(join(root, 'carnival', 'booths', name, 'booth.ts')) && isLogin(name),
    )
    .map((name) => name.toLowerCase());
}

/**
 * Saves each booth owner's avatar into `root`/public/avatars, and warns about
 * each one it couldn't: one owner's failure never stops the rest.
 * Gives how many it saved, of how many owners.
 */
export async function downloadAvatars(
  root: string,
  fetchAvatar: Fetch,
  warn: (line: string) => void,
): Promise<{ saved: number; owners: number }> {
  const out = join(root, 'public', 'avatars');
  mkdirSync(out, { recursive: true });
  const logins = boothOwners(root);
  let saved = 0;
  for (const login of logins) {
    try {
      const response = await fetchAvatar(avatarUrl(login), {
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (!isAvatar(bytes)) throw new Error('not a small image');
      writeFileSync(join(out, `${login}.png`), bytes);
      saved += 1;
    } catch (error) {
      warn(`No avatar for ${login}: ${(error as Error).message}`);
    }
  }
  return { saved, owners: logins.length };
}

/* v8 ignore start -- the deploy's entry point: fetching from GitHub, then printing */
if (process.argv[1]?.endsWith('download-avatars.ts')) {
  const { saved, owners } = await downloadAvatars(
    join(import.meta.dirname, '..'),
    fetch,
    (line) => {
      console.warn(line);
    },
  );
  console.log(`Downloaded ${saved} of ${owners} avatars.`);
}
/* v8 ignore stop */
