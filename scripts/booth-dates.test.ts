import { describe, expect, it } from 'vitest';
import { boothAddedDates } from './booth-dates';

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
});
