import { describe, expect, it } from 'vitest';
import {
  ASSESSMENT_MARKER,
  badgeHolders,
  grantMarker,
  readGrant,
  type BadgeRequestRecord,
} from './badge-grants.ts';

describe('the grant record', () => {
  it('reads back what it writes', () => {
    expect(readGrant(`Congrats\n${grantMarker('octocat/workshop', 'gold')}`)).toEqual({
      repo: 'octocat/workshop',
      tier: 'gold',
    });
    expect(readGrant(grantMarker('octocat/workshop'))).toEqual({ repo: 'octocat/workshop' });
    expect(readGrant('<!-- elf-engineer-badge: <script> gold -->')).toBeUndefined();
  });
});

describe('badgeHolders', () => {
  const app = { login: 'tessl-app[bot]', type: 'Bot' };
  const record = (
    number: number,
    login: string,
    comments: BadgeRequestRecord['comments'],
    labels: string[] = ['badge-request', 'badge-granted'],
  ): BadgeRequestRecord => ({
    issue: { number, user: { login }, labels: labels.map((name) => ({ name })) },
    comments,
  });

  it("lists each issue's author with the Tessl App's newest grant", () => {
    const holders = badgeHolders([
      record(2, 'OctoCat', [
        {
          user: app,
          body: grantMarker('octocat/workshop', 'silver'),
          created_at: '2026-12-05T00:00:00Z',
        },
      ]),
      record(1, 'OctoCat', [
        {
          user: app,
          body: grantMarker('octocat/workshop', 'bronze'),
          created_at: '2026-12-01T00:00:00Z',
        },
      ]),
      record(3, 'elf', [
        { user: app, body: grantMarker('elf/toys'), created_at: '2026-12-02T00:00:00Z' },
      ]),
    ]);
    expect(holders).toEqual([
      { login: 'elf', repo: 'elf/toys' },
      { login: 'octocat', repo: 'octocat/workshop', tier: 'silver' },
    ]);
  });

  it('ignores grant lines anyone but the Tessl App wrote', () => {
    expect(
      badgeHolders([
        record(1, 'octocat', [
          {
            user: { login: 'octocat', type: 'User' },
            body: grantMarker('octocat/workshop', 'gold'),
            created_at: '2026-12-01T00:00:00Z',
          },
          {
            user: { login: 'tessl-app[bot]', type: 'User' },
            body: grantMarker('octocat/workshop', 'gold'),
            created_at: '2026-12-01T00:00:00Z',
          },
        ]),
      ]),
    ).toEqual([]);
  });
  it("counts a request only by the Tessl App's latest decision on it", () => {
    const grant = {
      user: app,
      body: `${ASSESSMENT_MARKER}\n${grantMarker('octocat/workshop', 'gold')}\nCongratulations!`,
      created_at: '2026-12-01T00:00:00Z',
    };
    const decline = {
      user: app,
      body: `${ASSESSMENT_MARKER}\nThanks for asking.`,
      created_at: '2026-12-03T00:00:00Z',
    };
    expect(badgeHolders([record(1, 'octocat', [grant, decline])])).toEqual([]);
    expect(
      badgeHolders([
        record(1, 'octocat', [decline, { ...grant, created_at: '2026-12-04T00:00:00Z' }]),
      ]),
    ).toEqual([{ login: 'octocat', repo: 'octocat/workshop', tier: 'gold' }]);
    expect(
      badgeHolders([record(1, 'octocat', [grant], ['badge-request', 'badge-granted', 'declined'])]),
    ).toEqual([]);
  });

  it('goes by the time of each decision, not the order the comments come in', () => {
    const grant = {
      user: app,
      body: grantMarker('octocat/workshop', 'gold'),
      created_at: '2026-12-04T00:00:00Z',
    };
    const decline = {
      user: app,
      body: `\n  ${ASSESSMENT_MARKER}\nThanks for asking.`,
      created_at: '2026-12-03T00:00:00Z',
    };
    expect(badgeHolders([record(1, 'octocat', [grant, decline])])).toEqual([
      { login: 'octocat', repo: 'octocat/workshop', tier: 'gold' },
    ]);
    const laterDecline = { ...decline, created_at: '2026-12-05T00:00:00Z' };
    expect(badgeHolders([record(1, 'octocat', [grant, laterDecline])])).toEqual([]);
  });

  it('passes over later comments that decide nothing', () => {
    const grant = { user: app, body: grantMarker('elf/toys'), created_at: '2026-12-04T00:00:00Z' };
    const later = '2026-12-05T00:00:00Z';
    const chatter = [
      { user: app, body: 'The deploy is running.', created_at: later },
      { user: { login: 'elf', type: 'User' }, body: 'Thanks!', created_at: later },
    ];
    expect(badgeHolders([record(1, 'elf', [grant, ...chatter])])).toEqual([
      { login: 'elf', repo: 'elf/toys' },
    ]);
  });
});
