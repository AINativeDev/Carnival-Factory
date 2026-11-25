# Specs

These specs record what the North Pole Carnival does today: its behaviour, its
rules and the invariants a change must keep. They are for maintainers and
agents checking a change, not a guide for participants. For those, see
[How your request is built](../how-it-works.md), [booth ideas](../booth-ideas.md),
[level ideas](../level-ideas.md), [the diorama style](../style.md),
[the advent calendar](../advent.md) and [the Elf Engineer badge](../elf-engineer.md).

A spec describes current behaviour. When a change alters behaviour, update its
spec in the same pull request. If the code and a spec disagree, one of them is
wrong: fix it, don't leave both.

Every rule names what enforces it, as
[ADR 0016](../adr/0016-enforce-every-rule.md) asks: a lint rule, a script, a
test, a smoke test, a workflow, a `tessl.json` trigger, a review lens, an
assessment skill or the CSP in `square.html`. A rule nothing enforces yet says
"(not enforced yet)", so the gaps are easy to find.

## Index

- [Map and world](map-and-world.md): the isometric world, plots, walking, the camera and the routes.
- [Squares and the sandbox](squares-and-sandbox.md): the `NorthPoleSquare` contract, the sandboxed frame and worker, the size budget and the kill switch.
- [Booths](booths.md): a participant's folder, ownership and remixes.
- [Booth craft](booth-craft.md): the conventions every square is checked against, and its badges.
- [Attractions](attractions.md): the North Pole's own squares.
- [Levels](levels.md): a participant's own world, as plain data, reached by sleigh.
- [Booth and level requests](booth-requests.md): the issue forms, the assessment and the factory's actions.
- [Auto-merge gate](auto-merge-gate.md): when a booth's pull request merges on its own.
- [Construction sites](construction-sites.md): `pending.json` and the stages of a request.
- [Visit panel and history](visit-panel-and-history.md): the HUD inside a square, Share, credits and "How was this built?".
- [Booths panel](booths-panel.md): search, sections and "This is me".
- [Factory numbers](factory-numbers.md): the `#/factory` page.
- [Analytics](analytics.md): cookieless PostHog events from the map page, off until configured.
- [Advent calendar](advent-calendar.md): the doors, the challenge issues and booth decorations.
- [People's Choice](peoples-choice.md): votes, standings and trophies.
- [Elf Engineer badge and season card](elf-engineer-and-season-card.md): the badge and `#/season/<login>`.
- [Mobile](mobile.md): phone framing, drag and pinch, taps, the phone layout and the iPhone smoke test.
- [Previews and deploy](previews-and-deploy.md): the Pages workflow, previews and build-time data.
- [Checks and tests](checks-and-tests.md): `npm run check`, the smoke test and the house rules.

## Template

```md
# <Feature>

<one or two sentences: what it is for>

## Behaviour

<what a visitor, participant or maintainer sees, as short bullets>

## Rules

<invariants that must hold; security-relevant ones explicitly. End each rule
with what enforces it, such as "(enforced by: ESLint house rules,
scripts/square-code.ts)", or "(not enforced yet)".>

## Where it lives

<code paths, such as `src/northpole/world.ts`>

## Tested by

<test files that pin it>
```
