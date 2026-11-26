# The Elf Engineer badge

A badge for people who set up a [Tessl](https://tessl.io) factory on a
repository of their own, linking back to the North Pole.

![Elf Engineer](../public/badges/elf-engineer.svg)
![Elf Engineer: bronze](../public/badges/elf-engineer-bronze.svg)
![Elf Engineer: silver](../public/badges/elf-engineer-silver.svg)
![Elf Engineer: gold](../public/badges/elf-engineer-gold.svg)

## Getting it

1. Set up a Tessl factory on a public repository of yours, or of an
   organisation you're a public member of, with a `tessl.json` at its root,
   and let it open at least one pull request there.
2. Open **Issues → New issue → Elf Engineer badge** here. It asks for the
   repository and a link to one pull request the factory opened in it.
3. An agent (`plugins/north-pole/skills/assess-badge-request/`) runs
   `scripts/check-elf-engineer.ts`, which checks through GitHub's API that the
   repository is public and yours, has a `tessl.json`, and that the pull
   request is in it and was opened by the Tessl App. It grants the badge or
   declines with a friendly reason. A request with other text that reads as
   instructions to an agent waits for a maintainer instead.

**Tiers:** bronze, silver and gold are for 1, 5 and 25 of the factory's pull
requests merged on your repository. Ask again with the same form to be checked
again; your newest grant is the one that counts.

## What you get

- **A badge for your README.** The grant comment has the snippet. The badges
  are served from the site at `badges/elf-engineer.svg` (or
  `elf-engineer-bronze.svg`, `-silver`, `-gold`), and `badges/` lists them all
  with their snippets:

  ```md
  [![Elf Engineer](https://ainativedev.github.io/Carnival-Factory/badges/elf-engineer.svg)](https://ainativedev.github.io/Carnival-Factory/)
  ```

- **A pin on your booth.** The map draws an elf-hat pin on your booth's sign,
  its pom-pom in your tier's colour, and your booth's page links to your
  repository as "See @login's own factory".

## How it stays private and static

It's opt-in: nobody is listed until they ask. The badge images are plain files,
with no counters or query strings, so nothing is tracked from them. The site's
deploy (`.github/workflows/pages.yml`) reads the granted requests once, with
`scripts/badge-holders.ts`, and the build bakes the list into the page, so the
page itself never asks the network. Only grant lines the Tessl App wrote count.
