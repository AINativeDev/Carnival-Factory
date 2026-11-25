import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Workflows find changed squares by their paths in shell patterns that no
// other test runs. When the squares moved into carnival/, one kept the old
// path and quietly matched nothing, so every pattern that names the square
// folders must start from carnival/.
const dir = join(import.meta.dirname, '../.github/workflows');
const workflows = readdirSync(dir).filter((name) => name.endsWith('.yml'));

describe('workflow path patterns', () => {
  it.each(workflows)('%s matches squares only under carnival/', (name) => {
    const lines = readFileSync(join(dir, name), 'utf8').split('\n');
    const stale = lines.filter(
      (line) => /\^\(?(booth|attraction|level)/.test(line) && !line.includes('^carnival/'),
    );
    expect(stale).toEqual([]);
  });
});
