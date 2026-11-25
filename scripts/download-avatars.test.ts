import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { boothOwners, downloadAvatars } from './download-avatars';

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2]);

/** A checkout with these folders under carnival/booths, each with a booth.ts unless it says not. */
function checkout(folders: Record<string, boolean>): string {
  const root = mkdtempSync(join(tmpdir(), 'avatars-'));
  for (const [name, hasBooth] of Object.entries(folders)) {
    mkdirSync(join(root, 'carnival', 'booths', name), { recursive: true });
    if (hasBooth) writeFileSync(join(root, 'carnival', 'booths', name, 'booth.ts'), '');
  }
  return root;
}

describe('boothOwners', () => {
  it('lists the folders with a booth whose name is a login, in lower case', () => {
    const root = checkout({ Ana: true, bob: true, 'not--a-login': true, empty: false });
    expect(boothOwners(root).sort()).toEqual(['ana', 'bob']);
  });
});

describe('downloadAvatars', () => {
  it("saves each owner's avatar, and warns about the ones GitHub couldn't give", async () => {
    const root = checkout({ ana: true, bob: true, cy: true, dee: true });
    const answers: Record<string, () => Promise<Response>> = {
      ana: () => Promise.resolve(new Response(PNG)),
      bob: () => Promise.resolve(new Response('missing', { status: 404 })),
      cy: () => Promise.resolve(new Response('<html>a sign-in page</html>')),
      dee: () => Promise.reject(new Error('timed out')),
    };
    const warnings: string[] = [];
    const result = await downloadAvatars(
      root,
      (url, init) => {
        expect(init.signal).toBeInstanceOf(AbortSignal);
        const login = /github\.com\/([^.]+)\.png/.exec(url)?.[1] ?? '';
        return (answers[login] ?? (() => Promise.reject(new Error(url))))();
      },
      (line) => warnings.push(line),
    );
    expect(result).toEqual({ saved: 1, owners: 4 });
    expect(readFileSync(join(root, 'public', 'avatars', 'ana.png'))).toEqual(Buffer.from(PNG));
    expect(existsSync(join(root, 'public', 'avatars', 'bob.png'))).toBe(false);
    expect(warnings.sort()).toEqual([
      'No avatar for bob: HTTP 404',
      'No avatar for cy: not a small image',
      'No avatar for dee: timed out',
    ]);
  });
});
