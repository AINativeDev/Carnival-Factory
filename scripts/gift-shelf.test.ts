import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GIFTS } from '../attractions/gift-shop/attraction';

const plugin = join(import.meta.dirname, '../plugins/north-pole-gifts');
const skills: string[] = JSON.parse(
  readFileSync(join(plugin, '.tessl-plugin/plugin.json'), 'utf8'),
).skills.map((path: string) => path.replace('skills/', ''));

// The Gift shop's shelves and the plugin it sells from stay in step.
describe('the gift shelf', () => {
  it('shows every gift skill in the plugin, and no other', () => {
    expect(GIFTS.map((g) => g.skill).sort()).toEqual([...skills].sort());
  });

  it('documents each gift with its one install command and a worked example', () => {
    for (const skill of skills) {
      const readme = readFileSync(join(plugin, 'skills', skill, 'README.md'), 'utf8');
      expect(readme, skill).toContain(
        `tessl install github:AINativeDev/Northpole-Carnival-Factory --skill ${skill}`,
      );
      expect(readme, skill).toContain(`north-pole-gifts#${skill}`);
      expect(readFileSync(join(plugin, 'skills', skill, 'example.md'), 'utf8')).toMatch(
        /^# Worked example/,
      );
    }
  });
});
