# 0055. Levels and the Year in Review wait behind feature flags

- Status: Accepted; its landmarks' links out superseded by [ADR 0058](0058-tessl-places-open-as-booths.md)
- Date: 2026-11-26
- Spec: [ADR 0046](0046-launch-behind-feature-flags.md)

## Context

Participants' levels, the North Pole's level walks and the Year in Review
are not finished, and the site goes in front of an audience before they are.

## Decision

- A `levels` flag, off on the live site, hides participants' levels: no
  platforms at the sleigh station, no "get a level of your own", and the
  **Your level** form waits in `.github/issue-templates-later/`. While it's
  off, the Factory's, the Academy's and the Studio's landmarks open their own
  sites in a new tab (`landmarkLinkOut`), as the billboard opens its tickets.
- A `yearInReview` flag, off on the live site, holds back the Year in Review
  attraction like the Gift Shop, and its form waits beside the level form.
- A level's address still opens it: the flags hide every way in, not the
  levels themselves, so their code and tests stay as they are.

## Consequences

Switching either flag on brings its part back unchanged; move its form back
to `.github/ISSUE_TEMPLATE/` too.
