# Carnival Christmas: agent guide

A shared North Pole map. Every participant owns one plot, a square of the map
in `src/plots/<their GitHub login>/`, and may only change that plot.

## Stack

- TypeScript, Vite and plain HTML canvas. No UI framework.
- Vitest for logic. No browser tests.
- No native dependencies, and nothing that needs `sudo`. `npm ci` is the whole setup.

## Commands

Run `npm run format`, then `npm run check`, before you finish any change. CI
runs `npm run check` and `npm run build`.

## Layout

```txt
index.html                the page
src/
  main.ts                 the router: #/ is the map, #/plot/<login> one plot
  northpole/              the map itself
    plot.ts               the NorthPolePlot shape and the registry
    layout.ts             where each plot sits (plain functions)
    map.ts                drawing the map and a single plot's preview
    theme.ts              colours, fonts and sizes
    links.ts              links to the repository's issue forms
  plots/
    index.ts              finds every plot folder and puts it on the map
    jedi4ever/            a finished plot, and the pattern to copy
      plot.ts
      README.md
scripts/
  ownership.ts            the plot ownership rule (plain functions)
  check-plot-ownership.ts the CI check that enforces it
```

## Working on an issue

**The plot belongs to the issue's author.** Every change for a participant
stays inside `src/plots/<issue author's login, in lower case>/`. The **Plot
ownership** check fails the pull request otherwise, so:

- Never edit another person's plot, `src/northpole/`, `src/main.ts`,
  `src/plots/index.ts`, `package.json` or anything else outside that folder,
  even when it looks like the issue needs it. If the issue can't be done inside
  the plot, ask on the issue instead.
- Issues written by a maintainer (see `MAINTAINERS` in `scripts/ownership.ts`)
  may change anything.

**A plot is a folder** with:

1. `plot.ts`, whose default export is a `NorthPolePlot` from
   `src/northpole/plot.ts`. Its `owner` is the folder name. `src/plots/index.ts`
   finds it from there, so a new plot needs no change anywhere else.
2. A `draw(ctx, size, time)` that paints a `size` by `size` square from the
   origin. Scale everything by `size`, because the map and the preview draw at
   different sizes.
3. Colours and fonts from `theme` and `canvasFont` in `src/northpole/theme.ts`.
   No hex colours or font strings in a plot.
4. A `README.md` that says what the plot shows and stays true to the code.

Pure logic a plot has, such as movement, goes in plain exported functions with
a `plot.test.ts` next to them.

**In the pull request,** say what changed and how to preview it:
`npm run dev`, then `#/plot/<login>`.

The `.tessl/` rules linked below are not committed. `tessl install` fetches
them, and the factory runs it before every session. If `.tessl/RULES.md` is
missing, run `tessl install` first.

# Agent Rules <!-- tessl-managed -->

@.tessl/RULES.md follow the [instructions](.tessl/RULES.md)
