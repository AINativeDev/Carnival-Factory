# Maintaining Carnival Factory

For the people who run a Carnival Factory: setting one up, the settings and
rules that live outside the code, and how it's built. Participants start at the
[README](README.md); agents start at [`AGENTS.md`](AGENTS.md).

## Run your own Carnival Factory

Run your own copy, with you as the maintainer.

1. **Sign up and log in.** Create an account at [tessl.io](https://tessl.io),
   install the Tessl CLI ([setup guide](https://docs.tessl.io/introduction-to-tessl/set-up-tessl)),
   then:

   ```sh
   tessl login
   ```

2. **Fork and clone** this repository. In your fork, set **Settings → Pages →
   Source** to **GitHub Actions**.
3. **Install the Tessl GitHub App** on your fork, from the Tessl web app (see
   the setup guide).
4. **Turn on Tessl Code Review** for your fork
   ([guide](https://docs.tessl.io/tutorials/setting-up-agentic-code-review)).
   Its lenses are in `.tessl-code-review.yml`.
5. **Make yourself the maintainer.** Put your login in `.github/CODEOWNERS` and
   in `MAINTAINERS` in `scripts/ownership.ts`. In `tessl.json`, replace the
   ids in each `event.sender.id` and `event.pull_request.head.repo.id` with
   yours:

   ```sh
   gh api users/<you> -q .id          # your user id
   gh api repos/<you>/<fork> -q .id   # your fork's id
   ```

6. **Set up the factory** in your clone, and put the two environment names in
   `tessl.json` (the top-level `environment`, and `merge-conflict-sweep`'s):

   ```sh
   tessl init
   tessl environment create my-carnival --github-access write
   tessl environment create my-carnival-sweep --github-access read
   tessl doctor --automations
   ```

7. **Create the labels** the loops use:

   ```sh
   for l in tessl booth-request level-request badge-request badge-granted needs-info declined; do gh label create "$l"; done
   ```

8. **File your first issue** with the **Your booth** form, and watch it come
   back as a pull request.

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
`src/northpole/peoples-choice.ts`. On a fork, set `REPO_URL` in
`src/northpole/links.ts` to your fork's address too: the build keeps only
standings whose links are into that repository's issues.

Every pull request from this repository gets a **Preview** link to its build,
published next to the live map under `previews/pr-<number>/` and removed when
it closes. Tessl Code Review's lenses are set in `.tessl-code-review.yml`. To publish the map, go to **Settings → Pages** and set
**Source** to **GitHub Actions**: every merge to `main` then redeploys it.

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
  thing to, and `map.ts`), which plot
  each square keeps (`plots.json`) and the theme.
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
