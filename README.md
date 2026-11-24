<h1 align="center">North Pole Carnival</h1>

<p align="center">
  <strong>A Christmas carnival that a software factory builds, one booth at a time.</strong><br />
  Describe your booth in an issue. An agent builds it, checks it and opens the pull request.
</p>

<h3 align="center">
  <a href="https://ainativedev.github.io/Northpole-Carnival-Factory/">ainativedev.github.io/Northpole-Carnival-Factory</a>
</h3>

<p align="center">
  <a href="https://ainativedev.github.io/Northpole-Carnival-Factory/"><img alt="Play the map" src="https://img.shields.io/badge/Play-the%20North%20Pole-d7263d" /></a>
  <a href="https://github.com/AINativeDev/Northpole-Carnival-Factory/issues/new?template=01-your-booth.yml"><img alt="Ask for your booth" src="https://img.shields.io/badge/Ask%20for-your%20booth-1f6b45" /></a>
  <a href="https://tessl.io"><img alt="Built with Tessl" src="https://img.shields.io/badge/Built%20with-Tessl-0f1b33" /></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-a98bff" /></a>
</p>

<p align="center">
  <a href="https://ainativedev.github.io/Northpole-Carnival-Factory/">
    <img alt="The North Pole Carnival map at dusk, in isometric 3D: striped carnival tents round a decorated tree, wooden booth stalls with their owners' pennants, a ferris wheel, snowy log cabins, a frozen pond with skating elves, and plots marked For claim" src="docs/north-pole.png" width="880" />
  </a>
</p>

Every square on this map was built by a software factory. A ferris wheel, a
reindeer carousel and a hot cocoa stand stand round the town square, and along
the lanes every participant owns one square of their own, their **booth**.
Nobody writes the code by hand. You describe what you want in an issue, an
agent checks the request, builds it on a branch and opens a pull request with a
preview, and code review checks the result before it lands on the map.

Each booth runs sandboxed in its own frame, so the worst a booth can do is
break itself. A booth can react to the mouse or a finger over it, hover and
taps, so it can be something people play with, not just watch.

There are two ways to play:

1. **[Build the North Pole Carnival together](#build-it-together).** Everyone
   shares this repository and one factory. Ask for a booth, change it as often
   as you like, and watch the carnival grow as everyone's requests land.
2. **[Try it on your own](#try-it-on-your-own).** Fork the repository and run
   your own factory on it as the maintainer: change the map, the attractions,
   the rules and the loops themselves.

It's based on [Tessl Carnival](https://github.com/tesslio/tessl-carnival), the
starter repo for the "Build your own software factory with context" workshop.

## Build it together

1. **Ask for your booth.** Open **Issues → New issue → Your booth**, and say
   what your square should show. Your booth lives in
   `booths/<your GitHub login>/`.
2. **Let the factory assess it.** An agent reads your request first. If it's a
   sane change to your own booth, it hands it to the factory with the `tessl`
   label. If it's unclear, it asks a question: edit the issue to answer.
   Anything else it declines, with a reason.
3. **Watch it build.** The factory builds your booth on a `tessl/` branch and
   opens a pull request linked from your issue. If it asks a question there,
   reply, and a maintainer passes your answer on: only maintainers' comments
   steer the factory.
4. **Preview it.** Once the pull request's build passes, it gets a comment
   with a **Preview** link: the whole map, with your booth on it, at
   `…/previews/pr-<number>/#/booth/<your-login>`. Once it merges, it's on the
   live map at the same `#/booth/<your-login>` link.
5. **Share it.** Your booth's page has **See it on the map**, which opens the
   map with you standing in front of your booth, lit up for a few seconds, and **Copy
   link**, which copies that link to send to anyone:
   `…/#/?booth=<your-login>`. An attraction's is `…/#/?attraction=<id>`.
6. **Change it.** Open **Your booth** again for anything after that: the same
   form builds your booth if it's new and changes it if it's there. Your latest
   request is the one that counts, so a new one closes any older one you still
   have open.

**Built a factory of your own?** Set up Tessl on a repository of yours, then
ask for the [Elf Engineer badge](docs/elf-engineer.md) with **Issues → New
issue → Elf Engineer badge**. Once it's granted, your booth gets an elf-hat pin
and a link to your factory, and you get a badge for your README.

Booths are drawn in the [diorama style](docs/style.md) by default, the same
as the North Pole's attractions: a little isometric scene at dusk, lit warm.
A booth built before that keeps its own look until its owner asks for a
restyle, which is a request like any other through **Your booth**.

## Try it on your own

Run the whole thing on a fork, with you as the maintainer and the factory
yours to change.

1. **Fork it**, then in your fork go to **Settings → Pages** and set **Source**
   to **GitHub Actions**, so every merge publishes your map.
2. **Make yourself the maintainer.** Put your login in `.github/CODEOWNERS` and
   in `MAINTAINERS` in `scripts/ownership.ts`. In `tessl.json`, put your
   numeric GitHub user id (`gh api users/<login> -q .id`) in each
   `event.sender.id` list, and your fork's repository id
   (`gh api repos/<you>/<fork> -q .id`) in each
   `event.pull_request.head.repo.id`, so reviews on your fork reach the
   shepherd.
3. **Set up your factory.** Install the [Tessl CLI](https://tessl.io), run
   `tessl init` in your clone to register the repository, and install the Tessl
   GitHub App on your fork. Create an environment with GitHub write access,
   for example `tessl environment create my-carnival-env --github-access write`,
   and a read-only one for the merge-conflict sweep. Put their names in
   `tessl.json` (the top-level `environment`, and `merge-conflict-sweep`'s
   `environment`). Then run `tessl doctor --automations` and fix what it
   reports.
4. **Create the labels** the loops use: `tessl`, `booth-request`,
   `badge-request`, `badge-granted`, `needs-info` and `declined`.
5. **File your first issue** and watch it come back as a pull request. Then go
   further: ask for a new attraction, tighten the assessment rules in
   `plugins/north-pole/skills/assess-booth-request/`, or add a loop of your own
   to `tessl.json`.

## The rules of the map

- **Your booth is yours alone.** The **Booth ownership** check fails any pull
  request that changes a file outside its owner's booth. For a pull request the
  factory opens, the owner is whoever wrote the issue it closes.
- **The attractions belong to the North Pole.** They live in
  `attractions/<id>/`, outside every booth, so only maintainers change them.
  Their signs say "North Pole" instead of a `@login`, and each opens at
  `#/attraction/<id>`. They follow the same house rules as booths.
- **Issues, not pull requests.** Every change starts as an issue. A pull
  request from someone who isn't a collaborator is closed automatically with a
  pointer to the issue forms. Closing it doesn't stop **CI**, which checks out
  and runs a pull request's code, so keep outside contributors' workflows
  waiting for approval (see below) and don't approve them.
- **Only maintainers merge.** For now that's
  [@jedi4ever](https://github.com/jedi4ever). The maintainers may change any
  file, such as the map itself.
- **A booth can't break the map.** Every booth and attraction runs sandboxed:
  in an iframe of its own with no network, storage or access to the page, on a
  worker thread that's stopped if it hangs. The map only ever sees the picture
  it draws. One that throws, hangs or never loads shows "Under construction",
  and everything else keeps running. A smoke test plays every square in a real
  browser on each pull request. A size budget keeps each square to 50 KB of code gzipped and 200 KB of
  other files.
- **A booth only draws.** ESLint's house rules in `eslint.config.js` stop a
  booth from importing anything but the map and its own files, and from using
  the network, storage, other windows, the page's address, `eval` or string
  timers, or `window`, `document` and the other ways back to them. A lint rule
  reads code, it doesn't sandbox it, so it catches the plain ways in, not
  every one. A Tessl Code Review lens, `review-house-rules`, looks for the
  other ways in every booth and attraction, and a maintainer still looks at
  each one before merging it.

## For maintainers

Some of the rules live in the repository's settings, not its code:

- A ruleset, **Protect main**, requires a pull request and the **check** (from
  **CI**) and **ownership** (from **Booth ownership**) status checks, and blocks
  force pushes and deleting `main`. It requires no approvals for now, so a
  maintainer can merge a green pull request straight away. To require one, set
  the ruleset's required approvals to 1 and turn on **Require review from Code
  Owners**.
- **Settings → Actions → General** requires approval for workflows from all
  outside contributors, not only first-time ones, and the workflow token is
  read-only by default.

Booth changes that pass every check merge on their own, through the auto-merge
gate. Anything in doubt gets the `needs-human` label and waits for a
maintainer, and a daily digest issue lists everything that merged on its own.
[How your request is built](docs/how-it-works.md) explains each step.

Booth requests are assessed before the factory builds them: see
`plugins/north-pole/skills/assess-booth-request/`. Only maintainers can start or steer the
factory directly: the `tessl.json` triggers that start or steer work (adding
`tessl`, commenting on a `tessl` issue, or reviewing or commenting on a factory
pull request) are filtered on `event.sender.id`. The Tessl Reviewer's reviews
still reach the shepherd. Triggers that only stop work, such as closing an
issue, removing `tessl` or closing a pull request, aren't filtered, so a
participant can still withdraw their own request.

To add a maintainer, find their numeric GitHub user id
(`gh api users/<login> -q .id`). Add them to `.github/CODEOWNERS`, to
`MAINTAINERS` in `scripts/ownership.ts` with that id, and add the id to each
`event.sender.id` list in `tessl.json`. Maintainers are checked by id, because
a login can be renamed and taken by someone else.

To let the factory build a participant's issue that changes more than their
booth, such as the map's scenery, add `tessl` to it yourself: the **Booth
ownership** check treats an issue a maintainer labelled, by user id, like a
maintainer's own.

To switch a misbehaving square off, add its login to `booths`, or its id to
`attractions`, in `northpole/disabled.json`: it shows "Closed for repairs" and
its `draw` never runs. Its code is still loaded, so for code that misbehaves as
soon as it loads, remove its folder instead.

Every pull request from this repository gets a **Preview** link to its build,
published next to the live map under `previews/pr-<number>/` and removed when
it closes. Tessl Code Review's lenses are set in `.tessl-code-review.yml`. To publish the map, go to **Settings → Pages** and set
**Source** to **GitHub Actions**: every merge to `main` then redeploys it.

## Commands

| Command          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `npm ci`         | Install dependencies                                      |
| `npm run dev`    | Run the map locally at http://localhost:5173              |
| `npm run format` | Format the repo with Prettier, skipping `.prettierignore` |
| `npm run check`  | Lint, check formatting, type-check and test everything    |
| `npm run build`  | Build the site into `dist/`                               |
| `npm run smoke`  | Play every booth and attraction in a real browser         |

## How it's built

TypeScript, Vite and plain HTML canvas, with Vitest. No UI framework and no
native dependencies, so `npm ci` is the whole setup. Node 22.13 or later.

- `index.html` and `src/main.ts`: the page and the router: `#/` is the map,
  `#/booth/<login>` and `#/attraction/<id>` open the world with the player
  inside that square, in a room the map draws (`northpole/interior.ts`) beside
  its HUD (`src/visit-hud.ts`), and
  `#/?booth=<login>` and `#/?attraction=<id>` open the map on that square.
  `src/route.ts` reads the hash. The build also writes a link-preview page per
  square, `share/<kind>-<id>.html` (`scripts/share-pages.ts`), which Share
  copies.
- `northpole/`: the map: the `NorthPoleSquare` shape and registries, the
  isometric world you walk round (`world.ts`), how the camera frames its
  island (`camera.ts`), its drawing (`render.ts` and `map.ts`), which plot
  each square keeps (`plots.json`) and the theme.
- `booths/<login>/`: one folder per participant. `booths/jedi4ever/` is the
  pattern to copy.
- `attractions/<id>/`: one folder per attraction the North Pole owns.
- `plugins/north-pole/`: the factory's own skills: assessing booth requests,
  and the house-rules review lens.
- `scripts/ownership.ts` and `scripts/check-booth-ownership.ts`: the booth
  ownership rule and the check that enforces it.

[`AGENTS.md`](AGENTS.md) is where an agent starts.

## License

MIT. See [`LICENSE`](LICENSE).
