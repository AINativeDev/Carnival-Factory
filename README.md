# North Pole Carnival

A Christmas carnival at the North Pole, built by a software factory. A ferris
wheel, a reindeer carousel and a hot cocoa stand line the midway, and between
them every participant owns one square of the map, their **plot**. Nobody
writes the code by hand: you describe what you want in an issue, an agent
builds it and opens a pull request, and once it passes its checks it lands on
the map.

There are two ways to play:

1. **[Build the North Pole Carnival together](#build-it-together).** Everyone
   shares this repository and one factory. You claim a plot, ask for changes,
   and watch the carnival grow as the room's requests land. It's the quickest
   way to get the feel of a multiplayer factory, without stepping on anyone
   else.
2. **[Try it on your own](#try-it-on-your-own).** Fork the repository, run your
   own factory on it, and be the maintainer: change the map, the attractions,
   the rules and the loops themselves.

It's based on [Tessl Carnival](https://github.com/tesslio/tessl-carnival), the
starter repo for the "Build your own software factory with context" workshop.

## Build it together

1. **Claim your plot.** Open **Issues → New issue → Claim your plot**, and say
   what your square should show. Your plot lives in
   `src/plots/<your GitHub login>/`.
2. **Let the factory assess it.** An agent reads your request first. If it's a
   sane change to your own plot, it hands it to the factory with the `tessl`
   label. If it's unclear, it asks a question: edit the issue to answer.
   Anything else it declines, with a reason.
3. **Watch it build.** The factory builds your plot on a `tessl/` branch and
   opens a pull request linked from your issue. If it asks a question there,
   reply, and a maintainer passes your answer on: only maintainers' comments
   steer the factory.
4. **Preview it.** Check out the pull request's branch, run `npm ci` and
   `npm run dev`, and open http://localhost:5173/#/plot/<your-login>. Once it
   merges, it's on the live map at the same `#/plot/<your-login>` link.
5. **Change it.** Open **Change your plot** for anything after that. Every
   change goes through the same loop.

## Try it on your own

Run the whole thing on a fork, with you as the maintainer and the factory
yours to change.

1. **Fork it**, then in your fork go to **Settings → Pages** and set **Source**
   to **GitHub Actions**, so every merge publishes your map.
2. **Make yourself the maintainer.** Put your login in `.github/CODEOWNERS` and
   in `MAINTAINERS` in `scripts/ownership.ts`, and your numeric GitHub user id
   (`gh api users/<login> -q .id`) in each `event.sender.id` list in
   `tessl.json`.
3. **Set up your factory.** Install the [Tessl CLI](https://tessl.io), run
   `tessl init` in your clone to register the repository, and install the Tessl
   GitHub App on your fork. Create an environment with GitHub write access,
   for example `tessl environment create my-carnival-env --github-access write`,
   and a read-only one for the merge-conflict sweep. Put their names in
   `tessl.json` (the top-level `environment`, and `merge-conflict-sweep`'s
   `environment`). Then run `tessl doctor --automations` and fix what it
   reports.
4. **Create the labels** the loops use: `tessl`, `plot-claim`, `plot-change`,
   `needs-info` and `declined`.
5. **File your first issue** and watch it come back as a pull request. Then go
   further: ask for a new attraction, tighten the assessment rules in
   `plugins/north-pole/skills/assess-plot-request/`, or add a loop of your own
   to `tessl.json`.

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
  [@jedi4ever](https://github.com/jedi4ever). The maintainers may change any
  file, such as the map itself.
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

Some of the rules live in the repository's settings, not its code:

- A ruleset, **Protect main**, requires a pull request and the **check** (from
  **CI**) and **ownership** (from **Plot ownership**) status checks, and blocks
  force pushes and deleting `main`. It requires no approvals for now, so a
  maintainer can merge a green pull request straight away. To require one, set
  the ruleset's required approvals to 1 and turn on **Require review from Code
  Owners**.
- **Settings → Actions → General** requires approval for workflows from
  first-time contributors, and the workflow token is read-only by default.

Plot requests are assessed before the factory builds them: see `plugins/north-
pole/skills/assess-plot-request/`. Only maintainers can start or steer the
factory directly: the `tessl.json` triggers that start or steer work (adding
`tessl`, commenting on a `tessl` issue, or reviewing or commenting on a factory
pull request) are filtered on `event.sender.id`. The Tessl Reviewer's reviews
still reach the shepherd. Triggers that only stop work, such as closing an
issue, removing `tessl` or closing a pull request, aren't filtered, so a
participant can still withdraw their own request.

To add a maintainer, add them to `.github/CODEOWNERS`, to `MAINTAINERS` in
`scripts/ownership.ts`, and their numeric GitHub user id (`gh api users/<login>
-q .id`) to each `event.sender.id` list in `tessl.json`. To switch a
misbehaving plot off, add its owner's login to `src/northpole/disabled.json`:
it shows "Closed for repairs" and its `draw` never runs. Its code is still
loaded, so for code that misbehaves as soon as it loads, remove the plot's
folder instead. To publish the map, go to **Settings → Pages** and set
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
