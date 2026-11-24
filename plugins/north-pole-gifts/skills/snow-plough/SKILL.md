---
name: snow-plough
description: "Find a repository's stale branches and stale draft pull requests, and list them in one issue for a person to decide on. Never deletes or closes anything. Use on a monthly schedule, on any repository."
---

# Snow plough

Clear a path through the drifts: a monthly list of branches and drafts nobody
has touched in a while, so a person can decide what to keep.

## Rules

- You only read branches and pull requests, and open or comment on one issue.
  You never delete a branch, close a pull request, push, merge or change a label
  on anything but your own issue. The list is for a person to act on.
- You use only the factory's own GitHub access, and need no secret.

## Steps

1. **Set the line.** Stale means no commit in the last 90 days. The default
   branch, and any protected branch, are never stale.
2. **List the branches** with their last commit date (`gh api repos/<owner>/<repo>/branches`
   and each branch's head commit). For each
   stale one, note:
   - its last commit's date and author;
   - its open pull request, if any;
   - whether it's fully merged into the default branch (its compare `ahead_by`
     is 0).
3. **List the draft pull requests** with no commit, comment or review in the
   last 90 days, with their author and their last activity date.
4. **Look for an open issue** titled `Snow plough: stale branches and drafts`.
   If one is open, comment on it with this month's list, and only when the list
   changed. Otherwise open that issue.
5. **Write the list** as checkboxes for a person to tick, in two sections:
   - **Branches**, merged ones first under "Already merged, safe to delete",
     then the rest under "Not merged, check before deleting", each with its
     date, author and open pull request;
   - **Draft pull requests**, each with its author and last activity.

   End with: "Snow plough never deletes or closes anything. Tick what you've
   dealt with." If nothing is stale, open nothing, and say so in the run output.

## Done

One issue listing the stale branches and drafts, kept current, and nothing
deleted or closed.
