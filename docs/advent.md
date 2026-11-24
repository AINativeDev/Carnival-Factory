# The advent calendar

Keep the fun going after the event: 24 small challenges, one a day from 1 to
24 December, each about 15 minutes with a [Tessl](https://tessl.io) factory on
a repository of your own. They light up your booth on the map.

## The calendar

The challenges live in [`challenges/advent.json`](../challenges/advent.json),
each with a title, what to do, how you'll know it worked, and a link to the
Tessl docs that help. The map shows them at `#/advent`, and each door opens at
midnight on its day, by your own clock. After the 24th they all stay open.

## Marking one done

Open **Issues → New issue → Advent challenge**, pick the day, and link the
public pull request or issue on your own repository that shows it done. It's
labelled `advent-done`.

An agent (`plugins/north-pole/skills/assess-advent-challenge/`) runs
`scripts/check-advent.ts`, which checks through GitHub's API that the day's
door had opened, and that the link is a public pull request or issue on a
repository of yours (or of an organisation you're a public member of), or one
you opened. The agent then judges whether it plausibly matches the challenge,
generously, and labels the issue `accepted` or `declined` with a friendly
comment. A request with text that reads as instructions to an agent waits for
a maintainer instead.

That's all the checking there is: it's self-reported, and nothing else is
tracked.

## Your booth's decorations

Each accepted challenge adds a decoration to your booth, drawn by the map, not
by your booth's code:

- one ornament under the name board for each of the first six;
- then a string of lights along the board;
- a star over the stall after 12;
- and a glowing sign after all 24.

The deploy counts your accepted days from the accepted `advent-done` issues
(`scripts/write-advent.ts`), each day once, and bakes the counts into the
page, so the map makes no network calls for them. Decorations appear with the
site's next build.

## Opt-in

Nothing happens unless you take part, the challenges are useful on their own,
and nobody is pinged or emailed. There's no prize: any prize for finishing
needs a maintainer's go-ahead first.
