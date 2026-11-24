# Worked example: Gift tag on a sample repository

## The repository

`acme/snow-report` has the labels `area:api`, `area:web` and `area:docs`, and
the folders `api/`, `web/` and `docs/`. `api/forecast.ts` throws
`RangeError: days must be 1 to 14`.

## An issue that's clear

> **Forecast endpoint errors for 15 days**
>
> `GET /forecast?days=15` returns 500 with `RangeError: days must be 1 to 14`.
> I expected a 400 that says the limit.

The error message lives in `api/forecast.ts`, and the issue says what happened
and what was expected. The gift adds `area:api` and posts nothing.

## An issue that's too vague

> **Snow page broken**
>
> It doesn't work anymore.

"Snow page" points at `web/`, but nothing says what's broken. The gift adds
`area:web` and `needs-info`, and comments once:

> Thanks for the report. What did you see on the snow page, and what did you
> expect to see instead?
>
> `<!-- gift-tag -->`

If the author edits the issue, or opens another, no second question is asked
on this one: the marker is already there.
