# Maintaining Carnival Factory

For this project's maintainers: the settings and rules that live outside the
code, how the factory is steered, and how it's built. People using the map
start at the [README](README.md); people forking it to run their own start at
[RUN-YOUR-OWN.md](RUN-YOUR-OWN.md); agents start at [`AGENTS.md`](AGENTS.md).

## Settings and rules

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
`attractions`, in `src/northpole/disabled.json`: it shows "Closed for repairs" and
its `draw` never runs. Its code is still loaded, so for code that misbehaves as
soon as it loads, remove its folder instead.

To open People's Choice, open an issue titled exactly `People's Choice` from a
maintainer's account, pin it, and leave it unlocked: on a locked issue, people
without write access can't react, so they couldn't vote. Every deploy then adds a comment for each new booth and
Elf Engineer while voting is open (`scripts/write-peoples-choice.ts`, with the
deploy's own token), and counts the 👍. Until the issue exists, the map
shows no standings. To move the closing date, change `VOTING_CLOSES` in
`src/northpole/peoples-choice.ts`.

Every pull request from this repository gets a **Preview** link to its build,
published next to the live map under `previews/pr-<number>/` and removed when
it closes. Tessl Code Review's lenses are set in `.tessl-code-review.yml`. To publish the map, go to **Settings → Pages** and set
**Source** to **GitHub Actions**: every merge to `main` then redeploys it.

## Where the factory runs

The factory runs on [Tessl](https://tessl.io):

- Organization: **Carnival Factory**
- Workspace: **carnival-factory**
- Project: **carnival-factory**, named `carnival-factory/carnival-factory`
  in `tessl.json`

Tessl creates the factory's Loops from the `tessl.json` on `main`.
`tessl doctor --automations` shows whether they're all there.

## Commands

| Command          | What it does                                              |
| ---------------- | --------------------------------------------------------- |
| `npm ci`         | Install dependencies                                      |
| `npm run dev`    | Run the map locally at <http://localhost:5173>            |
| `npm run format` | Format the repo with Prettier, skipping `.prettierignore` |
| `npm run check`  | Lint, check formatting, type-check and test everything    |
| `npm run build`  | Build the site into `dist/`                               |
| `npm run smoke`  | Play every booth and attraction in a real browser         |

## How it's built

TypeScript, Vite and plain HTML canvas, with Vitest. No UI framework and no
native dependencies, so `npm ci` is the whole setup. Node 22.13 or later.

- `index.html`, `src/main.ts` and `src/router.ts`: the page and the router: `#/` is the map,
  `#/booth/<login>` and `#/attraction/<id>` open the world with the player
  inside that square, in a room the map draws (`src/northpole/interior.ts`) beside
  its HUD (`src/visit-hud.ts`), and
  `#/?booth=<login>` and `#/?attraction=<id>` open the map on that square.
  `src/route.ts` reads the hash. The build also writes a link-preview page per
  square, `share/<kind>-<id>.html` (`scripts/share-pages.ts`), which Share
  copies.
- `src/northpole/`: the map: the `NorthPoleSquare` shape and registries, the
  isometric world you walk round (`world.ts`), how the camera frames its
  island (`camera.ts`), its drawing (`render.ts`, the files it hands each
  thing to, and `map.ts`), which spot
  each square keeps (`spots.json`) and the theme.
- `carnival/booths/<login>/`: one folder per participant. `carnival/booths/jedi4ever/` is the
  pattern to copy.
- `carnival/attractions/<id>/`: one folder per attraction the North Pole owns.
- `plugins/north-pole/`: the factory's own skills: assessing booth and level
  requests, welcoming feedback and ideas, and the review lenses.
- `scripts/ownership.ts` and `scripts/check-booth-ownership.ts`: the booth
  ownership rule and the check that enforces it.

[`AGENTS.md`](AGENTS.md) is where an agent starts. [`docs/specs/`](docs/specs/)
says what each part of the system does, and [`docs/adr/`](docs/adr/) records the
decisions behind it.

## License

MIT. See [`LICENSE`](LICENSE).
