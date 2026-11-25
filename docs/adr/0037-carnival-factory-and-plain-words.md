# 0037. Name the site Carnival Factory, and use plain words for spots

- Status: Accepted
- Date: 2026-11-25
- Spec: [map-and-world.md](../specs/map-and-world.md), [glossary](../glossary.md)

## Context

The site was called "North Pole Carnival", a name tied to Christmas, and the
maintainer wants to run more editions of the same carnival. The words on the
page also mixed "plot", "open plot", "For claim", "Claim a plot", "Claim this
plot", "construction site" and "Build your own booth" for a handful of
things. Many visitors don't speak English as a first language, and "claim" and
"plot" are not words they meet often.

## Decision

- The site is **Carnival Factory**, and this edition is **Christmas
  edition**: "Carnival Factory – Christmas edition" in full. Both are
  constants in `src/edition.ts`, which the banner, the page's title, the
  intro, the share text, the season card, the entrance arch and the
  link-preview pages read, so a future edition changes one place. The North
  Pole stays the place inside this edition.
- Visitors read one plain word for each thing: a **booth** is what they get,
  a **free spot** is a place waiting for one ("Get a booth", "Build your booth
  here", "Get the spot next door"), and a booth whose request is being worked
  on is **being built**. The [glossary](../glossary.md) lists the words.
- The code keeps its names (`Plot`, `kind: 'open'`, `kind: 'site'`,
  `pending.json`, `.hud-claim`) and the routes keep theirs, so no link
  breaks and nothing but the words on the page changes.

## Alternatives considered

- **Rename the code too.** Rejected for now: `plot` is everywhere in the map's
  code and its tests, and a rename that large would change no behaviour.
  The glossary maps each visitor word to the code's.
- **Keep "North Pole Carnival" and add an edition.** Rejected: the next
  edition may not be at the North Pole.

## Consequences

A new visitor-facing string uses the glossary's words. A new edition changes
`src/edition.ts`, the theme and the squares, not every page that names the
site. `public/404.html` and the closed-preview page in
`.github/workflows/pages.yml` aren't built by Vite, so they spell the name out
and change by hand.
