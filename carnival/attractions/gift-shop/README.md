# Gift Shop

An attraction of the North Pole: it belongs to the map, not to a participant.

A wooden hut on a slab of snow at dusk, drawn in the [diorama style](../../../docs/style.md),
with a red and white striped awning and a gold **GIFT SHOP** sign on its roof.
On the two shelves in its window sit five wrapped gifts, one for each holiday
gift skill in [`plugins/north-pole-gifts/`](../../../plugins/north-pole-gifts/README.md).
Every four seconds the next gift lifts in a warm pool of light, and the gift tag
in front of the shop shows its name, what it does and the one command that
installs it.

| Gift             | What it does                                                                    |
| ---------------- | ------------------------------------------------------------------------------- |
| Stocking stuffer | A weekly pull request bumping one outdated dependency, its changelog summarised |
| Tidy elf         | Checks the README's commands and links, and opens an issue listing broken ones  |
| Gift tag         | Labels new issues by area, and asks one question when an issue is too vague     |
| Snow plough      | A monthly issue listing stale branches and drafts. It never deletes anything    |
| Wrapping paper   | Drafts release notes from the pull requests merged since the last tag           |

Install any of them from this repository on GitHub, by its skill name:

```sh
tessl install github:AINativeDev/Carnival-Factory --skill stocking-stuffer
```

Each gift's README has its `tessl.json` trigger to copy.

Preview it at `#/attraction/gift-shop`.
