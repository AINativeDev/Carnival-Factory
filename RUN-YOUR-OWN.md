# Run your own Carnival Factory

Fork this project and run a Carnival Factory of your own, with you as its
maintainer: your own map, attractions, rules and factory loops. People using
the map start at the [README](README.md); this project's own maintainers use
[MAINTAINING.md](MAINTAINING.md), which also applies to you once you're set up.

## Set it up

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

## Make it yours

- **Point the site at your fork.** Set `REPO_URL` in `src/northpole/links.ts`
  to your fork's address. The issue forms, share links and People's Choice
  standings all use it.
- **Rename the edition** in `src/edition.ts`, the name and edition shown in the
  banner, the page title and share text, and in `public/404.html`.
- **Start fresh, or keep ours.** The booths in `carnival/booths/` belong to this
  project's participants; delete the folders you don't want, and clear their
  pins in `src/northpole/spots.json`.
- **Then run it like a maintainer:** [MAINTAINING.md](MAINTAINING.md) covers the
  settings, the merge gate, the kill switch and People's Choice.

## Keep up with this project

Add this repository as a remote and merge its `main` now and then:

```sh
git remote add upstream https://github.com/AINativeDev/Carnival-Factory.git
git fetch upstream && git merge upstream/main
```

## License

MIT. See [`LICENSE`](LICENSE).
