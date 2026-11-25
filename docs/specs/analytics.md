# Analytics

How the map counts its use, without tracking the people who use it
([ADR 0028](../adr/0028-analytics.md)).

## Behaviour

- Off unless the repository variables `POSTHOG_KEY` and `POSTHOG_HOST` are set.
  The live deploy passes them to its build as `VITE_POSTHOG_KEY` and
  `VITE_POSTHOG_HOST`; previews, forks and local runs never get them, so they
  send nothing.
- When on, the map page sends PostHog one event per view as people move around
  it: `map_viewed` (with the focused square, for a shared map link),
  `square_opened`, `level_opened`, `season_viewed`, `factory_viewed` and
  `advent_viewed`.
- It also sends `request_started` (with the issue form) when someone follows a
  link to one of the repository's forms, `share_copied` for the Share button in
  a square, and `repo_opened` for the GitHub link in the banner.
- It sends `intro_opened` when the [first-visit intro](intro.md) opens, and
  `intro_closed` when it closes, with `how`: `skip` (Skip, Esc or a click
  outside it), `explore` or `build`. The intro tells it through the page
  event `north-pole-intro`, so `index.html` loads `src/analytics.ts` before
  `src/main.ts`.
- Events carry only public ids (a booth's login, a level's, an attraction's id)
  and the page's address, never anything a visitor typed.

## Rules

- No cookies, no storage, no person profiles: each event is anonymous
  (`$process_person_profile: false`), and the id that groups one page load's
  events lives only in memory (enforced by: src/analytics.test.ts).
- Nothing is sent without both the key and an `https` host (enforced by:
  src/analytics.test.ts, and the smoke test's check that the page makes no
  requests to another origin).
- Squares never reach the network; their sandbox is unchanged (enforced by:
  the CSP in square.html, smoke/squares-play.spec.ts).
- The list of events is deliberate: adding one is a code change to
  `src/analytics-events.ts` (enforced by: review).
- Analytics never stops the page: it runs before the map, so a send that
  fails, as where `navigator.sendBeacon` is switched off, loses that event
  and nothing else (enforced by: src/analytics.test.ts).
- PostHog's project should discard client IP data (not enforced yet: a project
  setting, outside this repository).

## Where it lives

`src/analytics.ts`, `src/analytics-events.ts`, `index.html`,
`.github/workflows/pages.yml` (the live build's `env`).

## Tested by

`src/analytics.test.ts`, `src/analytics-events.test.ts`.
