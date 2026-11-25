import { describe, expect, it } from 'vitest';
import { readYearIssues } from './write-year-in-review.ts';
import type { RawYearIssue } from './year-in-review.ts';

const node = (number: number) => ({ number }) as RawYearIssue;

describe('readYearIssues', () => {
  it('reads every page of the accepted issues, asking for the accepted label', async () => {
    const asked: Record<string, unknown>[] = [];
    const pages = [
      { nodes: [node(1), node(2)], pageInfo: { hasNextPage: true, endCursor: 'next' } },
      { nodes: [node(3)], pageInfo: { hasNextPage: false, endCursor: null } },
    ];
    const issues = await readYearIssues(
      (_query, variables) => {
        asked.push(variables);
        return Promise.resolve({ data: { repository: { issues: pages[asked.length - 1] } } });
      },
      'north',
      'pole',
    );
    expect(issues.map(({ number }) => number)).toEqual([1, 2, 3]);
    expect(asked).toEqual([
      { owner: 'north', name: 'pole', after: null, label: 'year-in-review-accepted' },
      { owner: 'north', name: 'pole', after: 'next', label: 'year-in-review-accepted' },
    ]);
  });

  it('stops after twenty pages, and at a page with no cursor', async () => {
    let asked = 0;
    const endless = { nodes: [node(1)], pageInfo: { hasNextPage: true, endCursor: 'more' } };
    await readYearIssues(
      () => {
        asked += 1;
        return Promise.resolve({ data: { repository: { issues: endless } } });
      },
      'a',
      'b',
    );
    expect(asked).toBe(20);
    const lost = { nodes: [], pageInfo: { hasNextPage: true, endCursor: null } };
    const none = await readYearIssues(
      () => Promise.resolve({ data: { repository: { issues: lost } } }),
      'a',
      'b',
    );
    expect(none).toEqual([]);
  });

  it('throws when GitHub gives no data, with its error when it gave one', async () => {
    await expect(
      readYearIssues(() => Promise.resolve({ errors: [{ message: 'Bad credentials' }] }), 'a', 'b'),
    ).rejects.toThrow('GraphQL failed: Bad credentials');
    await expect(
      readYearIssues(() => Promise.resolve({ data: { repository: null } }), 'a', 'b'),
    ).rejects.toThrow('GraphQL failed: no data');
  });
});
