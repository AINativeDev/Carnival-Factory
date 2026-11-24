# Carnival Christmas

A shared North Pole map that a workshop room grows together through a software
factory. Everyone in the room owns one square of the map, their **plot**. You
ask for changes to your plot by filing an issue, the factory's agent builds
them and opens a pull request, and a maintainer merges it. You can only change
your own plot, so you get the feel of working in a multiplayer factory without
stepping on anyone else.

It's based on [Tessl Carnival](https://github.com/tesslio/tessl-carnival), the
starter repo for the "Build your own software factory with context" workshop.
There, everyone forks the repo and runs their own factory. Here, everyone
shares one repo and one factory.

## Take part

1. **Claim your plot.** Open **Issues → New issue → Claim your plot**, and say
   what your square should show. Your plot lives in
   `src/plots/<your GitHub login>/`.
2. **Hand it to the factory.** A maintainer adds the `tessl` label. An agent
   picks the issue up, builds your plot on a `tessl/` branch, and opens a pull
   request. If it asks a question on the issue, reply there.
3. **Preview it.** Check out the pull request's branch, run `npm ci` and
   `npm run dev`, and open http://localhost:5173/#/plot/<your-login>. Once it
   merges, it's on the live map at the same `#/plot/<your-login>` link.
4. **Change it.** Open **Change your plot** for anything after that. Every
   change goes through the same loop.

## The rules of the map

- **Your plot is yours alone.** The **Plot ownership** check fails any pull
  request that changes a file outside its owner's plot. For a pull request the
  factory opens, the owner is whoever wrote the issue it closes.
- **Issues, not pull requests.** Every change starts as an issue. A pull
  request from someone who isn't a collaborator is closed automatically with a
  pointer to the issue forms. Closing it doesn't stop **CI**, which checks out
  and runs a pull request's code, so keep outside contributors' workflows
  waiting for approval (see below) and don't approve them.
- **Only maintainers merge.** For now that's
  [@jedi4ever](https://github.com/jedi4ever). `.github/CODEOWNERS` asks for
  their review on every pull request, and the maintainers may change any file,
  such as the map itself.
- **A plot can't break the map.** Each plot draws on a canvas of its own,
  and a plot that throws shows "Under construction" instead of taking the map
  down.
- **A plot only draws.** ESLint's house rules in `eslint.config.js` stop a
  plot from importing anything but the map and its own files, and from using
  the network, storage, other windows, the page's address, `eval` or string
  timers, or `window`, `document` and the other ways back to them. A lint rule
  reads code, it doesn't sandbox it, so it catches the plain ways in, not
  every one: a maintainer still reads each plot before merging it.

## For maintainers

These repository settings make the rules binding. They aren't in the code, so
set them once in **Settings → Branches** with a protection rule for `main`:

- **Require a pull request before merging**, with **Require review from Code
  Owners**, so every merge needs a maintainer's approval.
- **Require status checks to pass**, with **ownership** (from **Plot
  ownership**) and **check** (from **CI**).
- In **Settings → Actions → General**, require approval for workflows from
  outside contributors, and set the workflow token to read-only by default.
- **Restrict who can push to matching branches**, listing only the
  maintainers. Approval alone doesn't decide who merges: anyone with write
  access could still merge an approved pull request. Merging is a push to
  `main`, so this is what keeps the merge itself with the maintainers.

To add a maintainer, add them to `.github/CODEOWNERS` and to `MAINTAINERS` in
`scripts/ownership.ts`. To switch a misbehaving plot off, add its owner's
login to `src/northpole/disabled.json`: it shows "Closed for repairs" and its
`draw` never runs. Its code is still loaded, so for code that misbehaves as
soon as it loads, remove the plot's folder instead. To publish the map, go to **Settings → Pages** and set
**Source** to **GitHub Actions**: every merge to `main` then redeploys it.

## Commands

| Command          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `npm ci`         | Install dependencies                                      |
| `npm run dev`    | Run the map locally at http://localhost:5173              |
| `npm run format` | Format the repo with Prettier, skipping `.prettierignore` |
| `npm run check`  | Lint, check formatting, type-check and test everything    |
| `npm run build`  | Build the site into `dist/`                               |

## How it's built

TypeScript, Vite and plain HTML canvas, with Vitest. No UI framework and no
native dependencies, so `npm ci` is the whole setup. Node 22.13 or later.

- `index.html` and `src/main.ts`: the page and the router: `#/` is the map,
  `#/plot/<login>` previews one plot.
- `src/northpole/`: the map: the plot shape and registry, the layout, drawing
  and the theme.
- `src/plots/<login>/`: one folder per person. `src/plots/jedi4ever/` is the
  pattern to copy.
- `scripts/ownership.ts` and `scripts/check-plot-ownership.ts`: the plot
  ownership rule and the check that enforces it.

[`AGENTS.md`](AGENTS.md) is where an agent starts.

## License

MIT. See [`LICENSE`](LICENSE).
