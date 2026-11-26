import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

function listedSkills(plugin: string): string[] {
  const manifest = JSON.parse(
    readFileSync(join(root, plugin, '.tessl-plugin/plugin.json'), 'utf8'),
  ) as { skills: string[] };
  return manifest.skills.map((path) => path.replace('skills/', '')).sort();
}

// Tessl creates the factory's Loops from tessl.json, and resolves each action's
// `file:<plugin>#<skill>` through that plugin's manifest. A skill missing from
// the manifest fails the whole sync, so no Loop runs at all.
describe("the factory's plugins", () => {
  for (const plugin of ['plugins/north-pole', 'plugins/north-pole-gifts']) {
    it(`${plugin} lists every skill folder it has, and no other`, () => {
      const folders = readdirSync(join(root, plugin, 'skills')).sort();
      expect(listedSkills(plugin)).toEqual(folders);
    });
  }

  it('lists every skill an action in tessl.json runs', () => {
    const manifest = JSON.parse(readFileSync(join(root, 'tessl.json'), 'utf8')) as {
      actions: Record<string, { skill: string }>;
    };
    for (const [name, action] of Object.entries(manifest.actions)) {
      const local = /^file:(.+)#(.+)$/.exec(action.skill);
      if (!local) continue;
      const [, plugin = '', skill = ''] = local;
      expect(listedSkills(plugin), name).toContain(skill);
    }
  });
});
