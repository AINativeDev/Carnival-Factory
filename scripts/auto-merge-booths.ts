/**
 * The auto-merge gate's runner. For each open factory pull request built from
 * a booth request, it gathers the facts, runs the deterministic checks, keeps
 * one checklist comment up to date, and merges only when `evaluateGate` says
 * so (scripts/merge-gate-round.ts).
 *
 * Run by .github/workflows/auto-merge-booths.yml from main's own code, with
 * GITHUB_TOKEN and GITHUB_REPOSITORY set. It reads the pull request's files as
 * text through the API and never checks out or runs its code. DRY_RUN=1 only
 * prints what it would do.
 */
import { SETTINGS } from '../src/settings.ts';
import { githubClient } from './merge-gate-github.ts';
import { runMergeGate } from './merge-gate-round.ts';

const token = process.env.GITHUB_TOKEN;
const repository = process.env.GITHUB_REPOSITORY;
if (!token || !repository) throw new Error('Set GITHUB_TOKEN and GITHUB_REPOSITORY');
const api = process.env.GITHUB_API_URL ?? SETTINGS.github.api;

const ok = await runMergeGate(githubClient(api, repository, token), {
  repository,
  dryRun: process.env.DRY_RUN === '1',
});
if (!ok) process.exitCode = 1;
