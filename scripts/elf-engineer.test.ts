import { describe, expect, it } from 'vitest';
import {
  ASSESSMENT_MARKER,
  badgeHolders,
  badgePage,
  decideBadge,
  formField,
  FORM_FIELDS,
  grantMarker,
  parsePullRequest,
  parseRepository,
  readGrant,
  tierFor,
  type BadgeFacts,
  type BadgeRequestRecord,
} from './elf-engineer.ts';

const body = `### Your repository

https://github.com/octocat/workshop

### A pull request the factory opened there

https://github.com/octocat/workshop/pull/12
`;

describe('reading the form', () => {
  it('reads each field', () => {
    expect(formField(body, FORM_FIELDS.repo)).toBe('https://github.com/octocat/workshop');
    expect(formField(body, FORM_FIELDS.pull)).toBe('https://github.com/octocat/workshop/pull/12');
  });

  it('has nothing for an empty or missing field', () => {
    expect(formField('### Your repository\n\n_No response_\n', FORM_FIELDS.repo)).toBeUndefined();
    expect(formField('hello', FORM_FIELDS.repo)).toBeUndefined();
  });

  it('takes a repository as owner/name or its address', () => {
    expect(parseRepository('octocat/workshop')).toBe('octocat/workshop');
    expect(parseRepository(' https://github.com/octocat/workshop.git/ ')).toBe('octocat/workshop');
    expect(parseRepository('https://evil.example/octocat/workshop')).toBeUndefined();
    expect(parseRepository('octocat')).toBeUndefined();
    expect(parseRepository(undefined)).toBeUndefined();
  });

  it("takes a pull request's address", () => {
    expect(parsePullRequest('https://github.com/octocat/workshop/pull/12/files')).toEqual({
      repo: 'octocat/workshop',
      number: 12,
    });
    expect(parsePullRequest('https://github.com/octocat/workshop/issues/12')).toBeUndefined();
    expect(parsePullRequest('#12')).toBeUndefined();
  });
});

describe('tierFor', () => {
  it('gives bronze, silver and gold for 1, 5 and 25 merged', () => {
    expect([0, 1, 4, 5, 24, 25, 100].map(tierFor)).toEqual([
      undefined,
      'bronze',
      'bronze',
      'silver',
      'silver',
      'gold',
      'gold',
    ]);
  });
});

describe('decideBadge', () => {
  const working: BadgeFacts = {
    author: 'OctoCat',
    repoField: 'octocat/workshop',
    pullField: 'https://github.com/octocat/workshop/pull/12',
    repo: { fullName: 'octocat/workshop', private: false, owner: 'octocat' },
    authorIsMember: false,
    hasTesslJson: true,
    pull: { repo: 'octocat/workshop', number: 12, author: 'tessl-app[bot]', authorIsBot: true },
    merged: 6,
  };

  it('grants a working factory on your own public repository, with its tier', () => {
    expect(decideBadge(working)).toEqual({ grant: true, repo: 'octocat/workshop', tier: 'silver' });
  });

  it('grants with no tier before a factory pull request merges', () => {
    expect(decideBadge({ ...working, merged: 0 })).toEqual({
      grant: true,
      repo: 'octocat/workshop',
    });
  });

  it("grants an organisation's repository to a public member", () => {
    const org = { ...working.repo!, owner: 'octo-org' };
    expect(decideBadge({ ...working, repo: org, authorIsMember: true }).grant).toBe(true);
    expect(decideBadge({ ...working, repo: org, authorIsMember: false })).toEqual({
      grant: false,
      reason: "octocat/workshop isn't yours or your organisation's",
    });
  });

  it('grants a link from before the repository was renamed', () => {
    const renamed = { ...working, pullField: 'https://github.com/octocat/old-workshop/pull/12' };
    expect(decideBadge(renamed).grant).toBe(true);
  });

  const declines: [string, Partial<BadgeFacts>, RegExp][] = [
    ['no repository', { repoField: undefined }, /needs your repository/],
    ['no pull request link', { pullField: 'twelve' }, /needs a link/],
    ['a repository GitHub can’t find', { repo: undefined }, /factory can see/],
    ['a private repository', { repo: { ...working.repo!, private: true } }, /isn't public/],
    ['no tessl.json', { hasTesslJson: false }, /no tessl\.json/],
    [
      'a pull request elsewhere',
      {
        pullField: 'https://github.com/other/repo/pull/12',
        pull: { ...working.pull!, repo: 'other/repo' },
      },
      /isn't in octocat\/workshop/,
    ],
    ['a pull request GitHub can’t find', { pull: undefined }, /isn't in/],
    [
      'a pull request a person opened',
      { pull: { ...working.pull!, author: 'octocat', authorIsBot: false } },
      /Tessl App/,
    ],
    ['a user named like the app', { pull: { ...working.pull!, authorIsBot: false } }, /Tessl App/],
    ['a request with text aimed at an agent', { flaggedText: true }, /beyond its two fields/],
  ];
  it.each(declines)('declines %s', (_, change, reason) => {
    const decision = decideBadge({ ...working, ...change });
    expect(decision.grant).toBe(false);
    expect(decision.grant === false && decision.reason).toMatch(reason);
  });
});

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
});

describe('badgePage', () => {
  const site = 'https://ainativedev.github.io/Northpole-Carnival-Factory/';
  const page = badgePage(site, 'https://github.com/x/y/issues/new?template=02-elf-engineer.yml');

  it('shows every badge with a snippet that links back to the map', () => {
    for (const image of ['', '-bronze', '-silver', '-gold']) {
      expect(page).toContain(`src="../badges/elf-engineer${image}.svg"`);
      expect(page).toContain(`(${site}badges/elf-engineer${image}.svg)](${site})`);
    }
  });

  it('has no scripts and nothing that tracks', () => {
    expect(page).not.toMatch(/<script/i);
    expect(page).not.toMatch(/\.svg\?/);
  });
});
