# 0046. Launch with unfinished features behind feature flags

- Status: Accepted
- Date: 2026-11-25
- Spec: [checks-and-tests.md](../specs/checks-and-tests.md)

## Context

The site is launching, and four of its parts aren't ready to show: **Remix
this booth**, the **Elf Engineer** badges, the **Gift Shop** with its gift
shelf of skills, and the **advent calendar**. The maintainers want them back
later, so deleting them would throw away finished work and its tests.

## Decision

Each one sits behind a feature flag: `remix`, `elfEngineer`, `giftShop` and
`advent` in `src/feature-flag-names.ts`. Every flag is off unless the build's
`FEATURE_FLAGS` setting names it, such as `FEATURE_FLAGS=remix,advent npm run
build`, so the live site hides all four. The page reads them through `isOn`
in `src/feature-flags.ts`.

A flag gates its feature where it enters the page, never deep in its logic:
the link or panel, the route, the stall's decorations and pin, the attraction
in the registry, the build's extra pages. The code, its tests and its specs
stay. The unit tests build with every flag off, as the live site does, and
switch one on with `switchFlags` from `src/test-support/feature-flags.ts`, so
every gate is tested both ways. The smoke test reads the same setting: a
check for a hidden feature skips with its reason, and
`smoke/feature-flags.spec.ts` checks each hidden feature is really gone.

GitHub lists every form in `.github/ISSUE_TEMPLATE/`, so the **Elf Engineer**
and **Advent challenge** forms wait in `.github/issue-templates-later/`. Their
`tessl.json` triggers stay: with no form, nothing fires them.

## Alternatives considered

- **Delete the features and bring them back from git.** Rejected: they would
  drift from the code around them, and their tests would go with them.
- **Hide them with CSS.** Rejected: the routes, the decorations and the Gift
  Shop's plot would still be there, and a hidden link still works.
- **A flag read at run time from the address.** Rejected: anyone could switch
  an unfinished feature on, and the build's own pages (the badge page, the
  share pages) couldn't follow it.

## Consequences

Switching a feature on is one setting in the deploy, plus moving its form
back for the badge or the advent calendar. Each gate is one more branch to
test both ways. When a feature ships for good, its flag and its gates go, in
the same change.
