# Worked example: Wrapping paper on a sample repository

## The repository

`acme/snow-report`'s last tag is `v1.3.0`. Since then, these pull requests
merged into `main`:

| Pull request                                    | Author          | Labels       |
| ----------------------------------------------- | --------------- | ------------ |
| #52 "feat: forecast up to 14 days"              | @ana            | enhancement  |
| #53 "fix: 400 instead of 500 for too many days" | @ana            | bug          |
| #54 "Bump vitest from 2.0.4 to 2.1.1"           | dependabot[bot] | dependencies |
| #55 "docs: move usage to the guide"             | @cy             | docs         |
| #56 "feat!: forecast times are UTC, not local"  | @ben            | breaking     |

A person opens issue #57, "Release notes for the next version", and labels it
`wrapping-paper`.

## What the gift does

It posts one comment on #57:

> **Draft release notes: v1.3.0...main**
>
> Suggested version: **v2.0.0**, for a breaking change.
>
> **Breaking**
>
> - Forecast times are now in UTC rather than the server's local time. Convert
>   them for display if you showed them as they came (#56, @ben)
>
> **New**
>
> - Forecasts now cover up to 14 days (#52, @ana)
>
> **Fixed**
>
> - Asking for too many days now answers 400 with the limit, not 500 (#53, @ana)
>
> **Other**
>
> - The usage docs moved into the guide (#55, @cy)
> - One dependency update
>
> `<!-- wrapping-paper: v1.3.0...<head commit of main> -->`

No tag or release is created. A person edits the notes and publishes the
release themselves.
