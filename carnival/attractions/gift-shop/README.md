# Gift Shop

An attraction of the North Pole: it belongs to the map, not to a participant.

A wooden hut on a slab of snow at dusk, drawn in the [diorama style](../../../docs/style.md),
with a red and white striped awning and a gold **GIFT SHOP** sign on its roof.
Its window has three shelves, empty until you wrap something, and in front of
it stands the wrapping counter, with a roll of each paper behind it and the
next present on top.

## How to play

Wrap a present. The card in front of the shop asks for one thing at a time,
with four swatches to tap or click:

1. **The paper**: berry red, pine green, violet or gold, each with snowflakes.
2. **The ribbon**: snow white, gold, berry red or mint, tied round your paper.
3. **The bow**: loops, a rosette, a star or a holly sprig.

The present on the counter takes on each pick as you make it. With the bow on,
the parcel drops onto the shelves in the window, in a warm pool of light, and
the card turns into its gift tag for four seconds. Tap again to wrap the next
one sooner. The window
holds twelve parcels, four to a shelf from the bottom up; wrap a thirteenth
and the shelves start again.

## The gifts

Each present is one of the North Pole's holiday gift skills in
[`plugins/north-pole-gifts/`](../../../plugins/north-pole-gifts/README.md), in
turn. Its tag shows its name, what it does and the one command that installs it.

| Gift             | What it does                                                                    |
| ---------------- | ------------------------------------------------------------------------------- |
| Stocking stuffer | A weekly pull request bumping one outdated dependency, its changelog summarised |
| Tidy elf         | Checks the README's commands and links, and opens an issue listing broken ones  |
| Gift tag         | Labels new issues by area, and asks one question when an issue is too vague     |
| Snow plough      | A monthly issue listing stale branches and drafts. It never deletes anything    |
| Wrapping paper   | Drafts release notes from the pull requests merged since the last tag           |

Install any of them from this repository on GitHub, by its skill name:

```sh
tessl install github:AINativeDev/Northpole-Carnival-Factory --skill stocking-stuffer
```

Each gift's README has its `tessl.json` trigger to copy.

## On the map

The shop stands as a two-storey shopfront with this drawing in its display
window, warm lights along its awning, pennants on its roof, two elves at the
door (one carrying a present in, one waving) and a cart of parcels.

Preview it at `#/attraction/gift-shop`.
