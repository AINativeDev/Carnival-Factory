import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { boothAddedDates, readBoothAddedDates } from './booth-dates';

/** A repository with one booth, committed at a known date. */
function repositoryWithBooth(): string {
  const root = mkdtempSync(join(tmpdir(), 'booth-dates-'));
  mkdirSync(join(root, 'carnival', 'booths', 'ana'), { recursive: true });
  writeFileSync(join(root, 'carnival', 'booths', 'ana', 'booth.ts'), 'export {};\n');
  const git = (...args: string[]) =>
    execFileSync('git', ['-c', 'user.name=Elf', '-c', 'user.email=elf@example.org', ...args], {
      cwd: root,
      env: { ...process.env, GIT_AUTHOR_DATE: '2026-11-10T10:00:00+00:00' },
      stdio: 'ignore',
    });
  git('init', '-q');
  git('add', '.');
  git('commit', '-q', '-m', 'Ana opens a booth');
  return root;
}

describe("when each booth's folder first appeared", () => {
  it('keeps the oldest date a booth was added, newest commit first', () => {
    const log = [
      '',
      '2026-11-20T10:00:00+00:00\n\nbooths/zoe/booth.ts\n',
      '2026-11-10T10:00:00+00:00\n\nbooths/Ana/booth.ts\nbooths/zoe/booth.ts\n',
    ].join('\0');
    expect(boothAddedDates(log)).toEqual({
      zoe: '2026-11-10T10:00:00+00:00',
      ana: '2026-11-10T10:00:00+00:00',
    });
  });

  it('reads booths in carnival/ and before they moved there alike', () => {
    const log = [
      '',
      '2026-11-25T10:00:00+00:00\n\ncarnival/booths/new/booth.ts\n',
      '2026-11-10T10:00:00+00:00\n\nbooths/old/booth.ts\n',
    ].join('\0');
    expect(boothAddedDates(log)).toEqual({
      new: '2026-11-25T10:00:00+00:00',
      old: '2026-11-10T10:00:00+00:00',
    });
  });

  it('ignores other files and malformed commits', () => {
    const log = '\0not a date\nbooths/x/booth.ts\0' + '2026-11-01T00:00:00Z\nbooths/y/README.md\n';
    expect(boothAddedDates(log)).toEqual({});
  });

  it('reads lines with space around them, and only whole booth paths', () => {
    const log =
      '\0 2026-11-01T00:00:00Z \r\n booths/ana/booth.ts \r\nx/booths/bo/booth.ts\nbooths/cy/booth.ts.orig\n';
    expect(boothAddedDates(log)).toEqual({ ana: '2026-11-01T00:00:00Z' });
  });
});

describe('readBoothAddedDates', () => {
  it("reads each booth's first appearance from the repository's history", () => {
    // git writes UTC as Z or as +00:00, by version: the moment is what counts.
    const dates = Object.entries(readBoothAddedDates(repositoryWithBooth()));
    expect(dates.map(([booth, date]) => [booth, Date.parse(date)])).toEqual([
      ['ana', Date.parse('2026-11-10T10:00:00Z')],
    ]);
  });

  it('knows nothing where git has no history to read', () => {
    expect(readBoothAddedDates(mkdtempSync(join(tmpdir(), 'no-history-')))).toEqual({});
  });
});
