import { describe, expect, it } from 'vitest';
import { installDrift, installFeedback, parseLockfile } from './install-drift';

const lock = {
  packages: {
    '': { name: 'carnival' },
    'node_modules/happy-dom': { version: '21.0.4' },
    'node_modules/knip': { version: '6.48.0' },
    'node_modules/@esbuild/win32-x64': { version: '0.25.0', optional: true },
  },
};

describe('installDrift: whether node_modules matches package-lock.json', () => {
  it('finds nothing when every package the lockfile needs is installed at its version', () => {
    const installed = {
      packages: {
        'node_modules/happy-dom': { version: '21.0.4' },
        'node_modules/knip': { version: '6.48.0' },
      },
    };
    expect(installDrift(lock, installed)).toEqual([]);
  });

  it('names a missing package and one at another version, and ignores optional ones for other platforms', () => {
    const installed = { packages: { 'node_modules/knip': { version: '6.0.0' } } };
    expect(installDrift(lock, installed)).toEqual([
      'happy-dom (not installed)',
      'knip (6.0.0, needs 6.48.0)',
    ]);
  });

  it('says which version is unknown when a record has none', () => {
    const unversioned = { packages: { 'node_modules/left-pad': {} } };
    expect(installDrift(unversioned, unversioned)).toEqual([]);
    expect(
      installDrift(unversioned, { packages: { 'node_modules/left-pad': { version: '1' } } }),
    ).toEqual(['left-pad (1, needs ?)']);
    expect(installDrift(lock, { packages: { ...lock.packages, 'node_modules/knip': {} } })).toEqual(
      ['knip (?, needs 6.48.0)'],
    );
  });

  it('treats a missing install record as everything missing', () => {
    expect(installDrift(lock, undefined)).toHaveLength(2);
  });
});

describe('installFeedback', () => {
  it('tells the agent to run npm install, rather than chase failures a stale install causes', () => {
    expect(installFeedback(['happy-dom (not installed)'])).toMatch(/npm install[\s\S]*happy-dom/);
    expect(installFeedback([])).toBeUndefined();
    const many = Array.from({ length: 12 }, (_, n) => `package-${n} (not installed)`);
    expect(installFeedback(many)).toMatch(/package-9 \(not installed\), and 2 more\.$/);
    expect(installFeedback(many.slice(0, 10))).toBe(
      `The installed packages don't match package-lock.json, so the project checks can't be trusted yet. Run npm install, then finish. Out of step: ${many.slice(0, 10).join(', ')}.`,
    );
  });
});

describe('parseLockfile', () => {
  it('reads a lockfile, and anything else as no lockfile', () => {
    expect(parseLockfile('{"packages": {}}')).toEqual({ packages: {} });
    expect(parseLockfile(undefined)).toBeUndefined();
    expect(parseLockfile('not json')).toBeUndefined();
    expect(parseLockfile('{"name": "x"}')).toBeUndefined();
    expect(parseLockfile('{"packages": null}')).toBeUndefined();
    expect(parseLockfile('null')).toBeUndefined();
    expect(parseLockfile('{"packages": 5}')).toBeUndefined();
    expect(parseLockfile('7')).toBeUndefined();
  });
});
