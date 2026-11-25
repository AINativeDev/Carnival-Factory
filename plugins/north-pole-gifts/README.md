# North Pole gifts

Small factory loops to take home from Carnival Factory, each wrapped as a
holiday gift. Every one is useful on any repository, and each installs on its
own, straight from this repository on GitHub, not the registry.

| Gift                                                  | What it does                                                                          | When it runs            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------- |
| [Stocking stuffer](skills/stocking-stuffer/README.md) | Opens one pull request bumping a single outdated dependency, its changelog summarised | Weekly                  |
| [Tidy elf](skills/tidy-elf/README.md)                 | Checks the README's commands and links, and opens an issue listing the broken ones    | Weekly                  |
| [Gift tag](skills/gift-tag/README.md)                 | Labels a new issue by area, and asks one question when it's too vague to act on       | When an issue is opened |
| [Snow plough](skills/snow-plough/README.md)           | Lists stale branches and draft pull requests in an issue for a person to decide on    | Monthly                 |
| [Wrapping paper](skills/wrapping-paper/README.md)     | Drafts release notes from the pull requests merged since the last tag                 | When you ask            |

## Install one

From your repository's root, install the gift you want by its skill name:

```sh
tessl install github:AINativeDev/Northpole-Carnival-Factory --skill stocking-stuffer
```

Then copy the gift's `tessl.json` snippet from its README into your own
`tessl.json`, and run `tessl loop validate`. Each README has the one command
and the snippet to copy.

## Safe by default

Every gift only reads your repository, comments, and opens issues or pull
requests. None of them merges, deletes, closes, pushes to your default branch,
or needs a secret beyond the factory's own GitHub access. Each skill's
`SKILL.md` says so in its rules, and a gift that can't do its job within them
stops and says why.

## On the map

The **Gift shop** attraction near the town square shows these gifts on its
shelves, at `#/attraction/gift-shop`.
