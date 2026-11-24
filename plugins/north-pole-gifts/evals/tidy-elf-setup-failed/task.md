# Tidy elf: the repository's setup fails

Run the `tidy-elf` skill on `acme/cocoa-stand`. Its README:

````md
# Cocoa stand

## Setup

```sh
npm ci
npm run build
npm test
```

See [the menu](https://cocoa.example.com/menu).
````

Its `.npmrc` sets `registry=https://registry.npmjs.og/`.

What happened:

| Found                            | Result                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `npm ci`                         | exit 1, first error line `npm error getaddrinfo ENOTFOUND registry.npmjs.og` |
| `npm run build`                  | not run                                                                      |
| `npm test`                       | not run                                                                      |
| `https://cocoa.example.com/menu` | `200 OK`                                                                     |

Nothing else is in the repository's README. No issue titled
`Tidy elf: README needs tidying` is open.

The commands and links have already been run, and the results above are what
they gave. Do not run them again, and do not reach GitHub or the network.
Instead, write the issue you would open to `issue.md`, title first, or write no
`issue.md` when you would open none. Write the run output you would give to
`run-output.md`.
