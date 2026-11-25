# 0017. How visitors report a problem with a booth

- Status: Proposed
- Date: 2026-11-25
- Issue: #116

## Context

Anyone can ask for a booth and most booths merge on their own, so visitors need
a clear way to say when one is wrong: unkind, copied, impersonating someone,
flashing or broken. Today the only route is a blank issue.

## Options under consideration

- **A. A "Report this booth" link and issue form** (`booth-report`), with the
  booth filled in and a reason. Recommended baseline: no backend, but public
  and needs a GitHub account.
- **B. A factory loop that triages reports**, on top of A. Either the agent
  proposes closing the booth and a maintainer merges it (B1), or serious
  reports close it at once until a maintainer reviews it (B2), which risks
  anyone taking a booth down.
- **C. A private route** for sensitive reports, and `SECURITY.md` for security
  problems.
- **D. Reporting without an account**, which needs a backend the site doesn't
  have.

## Open questions

- B1 or B2, and for B2 how many reports close a booth?
- Who hears about a new report?
- Should repeated reports against one owner hold their future requests?

## Decision

Not made yet. When it is, this record is updated to Accepted with the choice,
the options turned down and why, and its consequences.
