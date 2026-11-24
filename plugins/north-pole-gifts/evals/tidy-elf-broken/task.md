# Tidy elf: a broken command and broken links

Run the `tidy-elf` skill on `acme/ice-rink`. Its README:

````md
# Ice rink

## Setup

```sh
npm ci
npm test
npm run lint
```

Read [the guide](https://docs.example.com/ice-rink/guide) and
[the old FAQ](https://example.com/faq).
````

What happened:

| Found                                     | Result                                                      |
| ----------------------------------------- | ----------------------------------------------------------- |
| `npm ci`                                  | exit 0                                                      |
| `npm test`                                | exit 0                                                      |
| `npm run lint`                            | exit 1, first error line `npm error Missing script: "lint"` |
| `https://docs.example.com/ice-rink/guide` | `404 Not Found`                                             |
| `https://example.com/faq`                 | `410 Gone`                                                  |

Nothing else is in the repository's README. No issue titled
`Tidy elf: README needs tidying` is open.

The commands and links have already been run, and the results above are what
they gave. Do not run them again, and do not reach GitHub or the network.
Instead, write the issue you would open to `issue.md`, title first, or write no
`issue.md` when you would open none. Write the run output you would give to
`run-output.md`.
