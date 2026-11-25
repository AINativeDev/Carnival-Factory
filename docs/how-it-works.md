# How your request is built

Nobody writes the North Pole's code by hand. When you ask for a booth, a
**software factory** builds it: a set of loops on this repository, each one an
agent that does one job the way a skill describes, with checks between them.
It runs on [Tessl](https://tessl.io). Here's every step your request goes
through, and why each one is there.

## 1. You ask

You open the **Your booth** issue form and describe what your booth should
show. The same form builds a new booth or changes yours. Your latest request is
the one that counts.

Every booth's page says who made it and who improved it since. **Remix this
booth** opens the same form, pre-filled to start from that booth: the factory
copies its code into your own booth and credits the original in its README.
**Build your own** opens it empty.

## 2. The assessment reads it

An agent reads your request first, following the
[`assess-booth-request`](../plugins/north-pole/skills/assess-booth-request/SKILL.md)
skill. It checks that it's a change to your own booth, that it can be drawn
within the house rules, and that it's friendly for everyone. Then it does one
of three things:

- **Accepts** it and hands it to the factory, with the `tessl` label.
- **Asks** one question, if it can't tell what to build. Edit your issue to
  answer.
- **Declines** it, with the reason.

Your words are treated as a description of a drawing, never as instructions
to the agent. Text that tries to instruct it is a reason to decline.

## 3. The factory builds it

The **implement** loop writes your booth's code in `carnival/booths/<your login>/`, on a
branch of its own, and opens a pull request linked to your issue. It works
from [`AGENTS.md`](../AGENTS.md), the guide for every agent here.

## 4. Checks run on every change

- **Lint, types and tests**: the house rules in `eslint.config.js` keep a booth
  to drawing only. There's no network, storage, other windows or `eval`.
- **Ownership**: the pull request may only change your own folder.
- **Size budget**: 50 KB of code, gzipped.
- **Smoke test**: your booth plays in a real browser, inside its sandbox. It
  must open, draw within its time budget, stay quiet, and not flash more than
  three times a second.
- **Preview**: the whole map with your booth on it is published for the pull
  request, with a screenshot in its comments.

## 5. Code review

**Tessl Code Review** reads the change with several lenses, including one
written for this map, `review-house-rules`, which looks for ways around the
house rules. The **shepherd** loop answers its findings, fixes failing checks,
and updates the pull request until it's clean.

## 6. The auto-merge gate

A booth change can merge with no person looking, but only when every one of
these passes on the exact commit being merged:

| Check                    | What it guards against                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Request accepted         | Code nobody asked for                                                                                                     |
| Only your own folder     | Changes to anyone else's booth, or to the map                                                                             |
| Code stays in its square | A static check reads the code's syntax and types without running it, and finds nothing that could reach outside the booth |
| No hidden instructions   | Text aimed at an AI, invisible characters or encoded blobs, in your request or the code                                   |
| Checks pass              | Broken, slow or flashing booths                                                                                           |
| Code review approves     | Bugs and house-rule tricks                                                                                                |
| Risk and taste check     | An agent looks at the change and its screenshot for anything unkind, copied, unsafe or sneaky                             |

Any doubt sends it to a maintainer instead. At most one booth change per person
merges on its own each hour, and a daily digest lists every one, so a person
still sees them all. The pull request keeps a checklist comment showing where
each check stands.

## 7. It's on the map

The site rebuilds and your booth appears on the map. Your booth runs
**sandboxed**: in a frame and a worker of its own, with no access to the page,
the network or anyone else's booth. The worst a booth can do is break itself,
and a maintainer can switch it off with the kill switch.

## Run a factory on your own repository

Every loop above is a skill you can read in this repository. To build your own
factory, start with **Try it on your own** in the [README](../README.md) and the
[Tessl docs](https://docs.tessl.io).
