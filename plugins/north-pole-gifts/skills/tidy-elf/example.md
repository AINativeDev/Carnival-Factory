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
| `https://api.example.com/v1`    | Couldn't check: 401, it needs signing in  |
| `#contributing`                 | Broken: the README has no such heading    |

No issue titled `Tidy elf: README needs tidying` is open, so it opens one:

> **Tidy elf: README needs tidying**
>
> **Broken**
>
> - Setup: `npm run build` exited 1 with `npm error Missing script: "build"`.
>   The scripts are `compile` and `test`.
> - Line 17: `docs/usage.md` does not exist.
> - Line 18: `#contributing` names no heading in the README.
>
> **Couldn't check**
>
> - `https://api.example.com/v1` answered `401 Unauthorized`.
>
> **Skipped**
>
> - `npm run deploy -- --token $DEPLOY_TOKEN`: it deploys and needs a secret.

Next week, if the list is the same, it posts nothing. If a person fixes the
build line, it comments the shorter list on the same issue.

## When setup fails

Say a later week the README's `npm ci` fails because the repository's `.npmrc`
names `registry.npmjs.og`. That is a finding however it fails, so the issue
leads with it, and the build after it is not run:

> **Setup failed**
>
> - Setup: `npm ci` exited 1 with
>   `npm error getaddrinfo ENOTFOUND registry.npmjs.og`.
>
> **Couldn't check**
>
> - Setup: `npm run build`, which needs `npm ci` to finish first.
> - `https://api.example.com/v1` timed out after 30 seconds.
