# Worked example: Snow plough on a sample repository

## The repository

On 1 December, `acme/snow-report` has these branches and drafts:

| Branch or draft           | Last activity | Notes                                |
| ------------------------- | ------------- | ------------------------------------ |
| `main`                    | 28 November   | The default branch                   |
| `fix/forecast-limit`      | 2 August      | Merged into `main`                   |
| `try-dark-mode`           | 10 June       | Not merged, draft pull request #41   |
| `release/1.x`             | 3 March       | Protected                            |
| `add-wind-chart`          | 20 November   | Not merged                           |
| Draft #38, "Rewrite docs" | 15 July       | From `docs-rewrite`, updated in July |

## What the gift does

`main` and `release/1.x` are never stale, and `add-wind-chart` is recent. No
issue titled `Snow plough: stale branches and drafts` is open, so it opens one:

> **Snow plough: stale branches and drafts**
>
> **Branches**
>
> Already merged, safe to delete:
>
> - [ ] `fix/forecast-limit`: last commit 2 August by @ana
>
> Not merged, check before deleting:
>
> - [ ] `try-dark-mode`: last commit 10 June by @ben, draft pull request #41
> - [ ] `docs-rewrite`: last commit 15 July by @cy, draft pull request #38
>
> **Draft pull requests**
>
> - [ ] #41 "Try dark mode" by @ben, last activity 10 June
> - [ ] #38 "Rewrite docs" by @cy, last activity 15 July
>
> Snow plough never deletes or closes anything. Tick what you've dealt with.

Nothing is deleted. Next month, if @ana deleted `fix/forecast-limit`, the gift
comments the shorter list on the same issue.
