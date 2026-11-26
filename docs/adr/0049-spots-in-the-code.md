# 0049. Spots in the code too, not plots

- Status: Accepted
- Date: 2026-11-26
- Spec: [map-and-world.md](../specs/map-and-world.md), [glossary](../glossary.md)
- Supersedes: the code-names part of [0037](0037-carnival-factory-and-plain-words.md)

## Context

[ADR 0037](0037-carnival-factory-and-plain-words.md) gave visitors one plain
word, **spot**, for a place on the map, and kept **plot** in the code so the
change would touch only the page. That left two words for one thing: the
page said spot while the files, functions, data and docs a contributor or an
agent reads said plot (`plots.ts`, `Plot`, `nearestOpenPlot`, `plot.json`).
The factory's agents write booths from the code and AGENTS.md, so the old
word kept turning up in what they wrote, and the glossary had to translate.

## Decision

- The code says **spot** wherever it said plot: types (`Spot`, `SpotKind`),
  functions (`nearestOpenSpot`, `boothSpot`), files (`spots.ts`,
  `spots.json`, `world-spots.ts`, `open-spot.ts`, `spot-marks.ts`), the
  `data-spot` attribute, the `spot` field of `pending.json`, and a booth's
  `spot.json`, `{ "spot": <number>, "issue": <number> }`.
- The code's existing uses of the name spot were renamed first, so nothing
  shadows: the landmark kit's point on a spot is `onSpot`, and the other
  local points are `mark`.
- A spot's number still means the same place: only the word changed. The
  world pin test proves the island and every level lay out exactly as
  before, once the word is mapped back.
- Accepted records keep their words, since they're never rewritten; that's
  why [0010](0010-plots-stay-put.md) still says plots.

## Alternatives considered

- **Keep plot in the code (ADR 0037).** Rejected: one thing with two words
  costs every reader a translation, and agents copy the code's word.
- **Accept both `plot.json` and `spot.json` for a while.** Rejected: no
  booth has a `plot.json` today, and a second name would be dead code.

## Consequences

A booth request built from instructions written before this change, which
writes a `plot.json`, fails the gate's file check and waits for a person.
The live `pending.json` says `spot` after the next deploy.
