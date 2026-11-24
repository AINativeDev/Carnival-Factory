# Worked example: Tidy elf on a sample repository

## The repository

`acme/snow-report` has this README:

````md
# Snow report

## Setup

```sh
npm ci
npm run build
```

## Deploy

```sh
npm run deploy -- --token $DEPLOY_TOKEN
```

See [the docs](docs/usage.md), the [API](https://api.example.com/v1) and
[contributing](#contributing).
````

Its `package.json` has `build` and `test` scripts, but the `build` script was
renamed to `compile` last month. `docs/usage.md` was moved to `docs/guide.md`.

## What the gift does

| Found                           | Result                                    |
| ------------------------------- | ----------------------------------------- |
| `npm ci`                        | Works                                     |
| `npm run build`                 | Broken: exit 1, `Missing script: "build"` |
| `npm run deploy -- --token ...` | Skipped: it deploys and needs a secret    |
| `docs/usage.md`                 | Broken: no such file                      |
| `https://api.example.com/v1`    | Unknown: 401, it needs signing in         |
| `#contributing`                 | Broken: the README has no such heading    |

No issue titled `Tidy elf: README needs tidying` is open, so it opens one:

> **Tidy elf: README needs tidying**
>
> Commands that failed:
>
> - Setup: `npm run build` exited 1 with `npm error Missing script: "build"`.
>   The scripts are `compile` and `test`.
>
> Links that don't go anywhere:
>
> - Line 17: `docs/usage.md` does not exist.
> - Line 18: `#contributing` names no heading in the README.
>
> Skipped: `npm run deploy -- --token $DEPLOY_TOKEN` (deploys, needs a secret).
> Unknown: `https://api.example.com/v1` answered 401.

Next week, if the list is the same, it posts nothing. If a person fixes the
build line, it comments the shorter list on the same issue.
