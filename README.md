<h1 align="center">Carnival Factory – Christmas edition</h1>

<p align="center">
  <strong>A Christmas carnival that a software factory builds, one booth at a time.</strong><br />
  Ask for a booth in a GitHub issue. A software factory builds it, tests it, reviews it and puts it on the map, with no one merging it.
</p>

<h3 align="center">
  <a href="https://ainativedev.github.io/Carnival-Factory/">ainativedev.github.io/Carnival-Factory</a>
</h3>

<p align="center">
  <a href="https://ainativedev.github.io/Carnival-Factory/"><img alt="Play the map" src="https://img.shields.io/badge/Play-the%20North%20Pole-d7263d" /></a>
  <a href="https://github.com/AINativeDev/Carnival-Factory/issues/new?template=01-your-booth.yml"><img alt="Ask for your booth" src="https://img.shields.io/badge/Ask%20for-your%20booth-1f6b45" /></a>
  <a href="https://tessl.io"><img alt="Built with Tessl" src="https://img.shields.io/badge/Built%20with-Tessl-0f1b33" /></a>
  <a href="LICENSE"><img alt="MIT license" src="https://img.shields.io/badge/license-MIT-a98bff" /></a>
</p>

<p align="center">
  <a href="https://ainativedev.github.io/Carnival-Factory/">
    <img alt="The Carnival Factory map of the North Pole at dusk, in isometric 3D: the Factory's tower with TESSL down its front, a roller coaster, a ferris wheel, the Academy, a big top and a carousel round a decorated tree, the AI DevCon billboard, participants' booths with their drawings on their fronts, a frozen pond with skating elves, three free spots waiting for a booth, and the Carnival Factory arch at the entrance" src="docs/north-pole.png" width="880" />
  </a>
</p>

Every square on this map was built by a software factory. A ferris wheel, a
reindeer carousel and a hot cocoa stand stand round the town square, and along
the lanes every participant owns one square of their own, their **booth**.
Nobody writes the code by hand: you describe what you want in an issue, an
agent checks the request, builds it and opens a pull request with a preview,
and code review checks it before it lands on the map.

Each booth runs sandboxed in its own frame, so the worst a booth can do is
break itself, and a booth can react to the mouse or a tap, so it can be
something people play with, not just watch.

## Get a booth

1. **Ask for it.** Open **Issues → New issue → Your booth** and say what your
   booth should show, and its name. You can attach a picture, such as your logo
   or a sketch.
2. **The factory checks it.** An agent reads your request first. If it's
   clear, the factory builds it; if not, it asks you a question: edit the issue
   to answer.
3. **Watch it being built.** A **Being built** sign stands on your spot on the
   map while the factory works. It opens a pull request linked from your
   issue, with a **Preview** link to the whole map with your booth on it.
4. **It's on the map.** Once it merges, your booth is at
   `…/#/booth/<your-login>`, and its page shows how it was built, step by step.
5. **Share it.** Your booth's page has **Share**, with a link that opens the
   map in front of your booth: `…/#/?booth=<your-login>`.
6. **Change it** whenever you like: open **Your booth** again. Your latest
   request is the one that counts.

[Booth ideas](docs/booth-ideas.md) help you write the request, and
[how your request is built](docs/how-it-works.md) explains every step.

## Feedback and ideas

We love kudos and ideas. Open **Issues → New issue → Feedback on the factory**
or **An idea**: they stay open, and the maintainers read every one.

## The rules of the map

- **Your booth is yours alone.** A change for you only ever touches your own
  booth.
- **Issues, not pull requests.** Every change starts as an issue; a pull request
  from outside is closed with a pointer to the forms.
- **A booth can't break the map.** Every booth runs sandboxed, with no network,
  storage or access to the page. One that breaks shows "Under construction",
  and everything else keeps running.
- **A booth only draws.** House rules and code review keep it to drawing.
- **The attractions belong to the North Pole**, and only maintainers change
  them.

## Run your own

Want a Carnival Factory of your own, with you as the maintainer?
[RUN-YOUR-OWN.md](RUN-YOUR-OWN.md) has the steps to fork and set it up.

It's based on [Tessl Carnival](https://github.com/tesslio/tessl-carnival), the
starter repo for the "Build your own software factory with context" workshop.

## License

MIT. See [`LICENSE`](LICENSE).
