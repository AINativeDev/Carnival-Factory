# Tidy elf: links that did not answer

Run the `tidy-elf` skill on `acme/sleigh-bells`. Its README:

````md
# Sleigh bells

## Build

```sh
npm ci
npm run build
```

See [the status page](https://status.example.com), [the mirror](https://mirror.example.org/bells)
and [the API](https://api.example.net/v2).
````

What happened:

| Found                              | Result                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| `npm ci`                           | exit 0                                                          |
| `npm run build`                    | exit 0                                                          |
| `https://status.example.com`       | no answer, first error line `connect ETIMEDOUT 203.0.113.7:443` |
| `https://mirror.example.org/bells` | first error line `getaddrinfo ENOTFOUND mirror.example.org`     |
| `https://api.example.net/v2`       | `503 Service Unavailable`                                       |

Nothing else is in the repository's README. No issue titled
`Tidy elf: README needs tidying` is open.

The commands and links have already been run, and the results above are what
they gave. Do not run them again, and do not reach GitHub or the network.
Instead, write the issue you would open to `issue.md`, title first, or write no
`issue.md` when you would open none. Write the run output you would give to
`run-output.md`.
