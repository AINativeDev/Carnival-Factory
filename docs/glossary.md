# Glossary

The words the site, the docs and the code use, and what each one means. Many
visitors don't speak English as a first language, so what they read on the
page keeps to these plain words, one word for one thing, with no idioms.

- **Carnival Factory**: the site's name, the same every edition.
  **Christmas edition** is this edition's. Both live in `src/edition.ts`, so
  a future edition changes one constant.
- **The North Pole**: the place inside this edition: the island on the map,
  its attractions and its own levels. It is not the site's name.
- **Booth**: what a participant gets, their own stall on the map, built from
  one folder, `carnival/booths/<login>/`. Visitors read "Get a booth" for
  asking for one.
- **Attraction**: a square that belongs to the North Pole itself, such as the
  ferris wheel, in `carnival/attractions/<id>/`. Only maintainers change it.
- **Square**: anything that draws through the `NorthPoleSquare` contract: a
  booth, an attraction or one of a level's squares. Each runs sandboxed.
- **Spot**: a numbered place on the map where a square stands. A spot's
  number always means the same place. The page, the docs and the code all
  say spot (`Spot`, `spots.ts`, `spot.json`); the code said plot until
  [ADR 0049](adr/0049-spots-in-the-code.md).
- **Free spot**: a spot with no booth yet, waiting for one. Its sign says
  "Free spot", and at one the map offers "Build your booth here". In the code
  it's a spot of `kind: 'open'`.
- **Being built**: a booth whose request was accepted and that the factory is
  building now. Its spot shows scaffolding and a sign with `@login` and its
  stage, such as "Being built" or "Checks running". The code and the specs
  call it a construction site (`kind: 'site'`, `pending.json`).
- **Level**: a participant's own patch of the North Pole, `carnival/levels/<login>/`,
  with up to 8 squares of its own, reached by sleigh. A level unlocks once
  you have a booth. Visitors read "Get a booth first, then a level", and a
  booth's owner reads "Next: get a level of your own".
- **Sleigh station**: the platforms by the entrance, one per participant's
  level, where the sleigh leaves for each level. Inside a level, the sleigh
  home goes back. The North Pole's own levels are reached from their landmark.
- **Landmark**: what an attraction stands as on the map, drawn as what it is:
  a big wheel, a big top, an ice rink, The Factory's tower. Only attractions
  have one.
- **Stall shape**: what a booth's or a level square's stall looks like on the
  map, such as a cabin, an igloo or a lighthouse. A square that names none
  gets one picked from its id.
- **The factory**: the software factory that turns an accepted request into a
  booth: an agent writes it, the checks and the review test it, and the gate
  merges it. Its numbers are at `#/factory`.

## Words visitors read

| Say                           | Not                                   |
| ----------------------------- | ------------------------------------- |
| Get a booth                   | Claim a plot, Build your own booth    |
| Free spot                     | For claim, open plot                  |
| Build your booth here         | Claim this plot                       |
| Get the spot next door        | Claim the plot next door              |
| Being built, Booth for @login | Construction site, Under construction |
| Carnival Factory              | North Pole Carnival                   |

"Under construction" still names a square whose code fails to load: it's a
broken square, not a booth being built.
