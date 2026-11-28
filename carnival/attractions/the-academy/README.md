# The Academy

An attraction of the North Pole: it belongs to the map, not to a participant.

It's the landmark for The Academy, the North Pole's own level
([`carnival/levels/the-academy/`](../../levels/the-academy/)). On the home map
it stands as its schoolhouse landmark. Its own page,
`#/attraction/the-academy`, plays this drawing: a hands-on trip through the
factory that turns a request into a booth, where the visitor is the ticket.
The Factory explains why a software factory; the Academy shows how.

## What it shows

A workshop hall at dusk, drawn as a diorama: a plank wall with windows on the
snowy night and hanging lamps that throw warm pools on the floor, a plank
floor with a long runner, and a bay for each station with its own furniture.
When the ticket moves on to the next station the camera slides along the
hall and the ticket hops along the runner with it.

Over the hall sit three layers, as in all the Tessl places: a slim header (an
eyebrow such as "Station 4 of 7 · Check" over a short gold bar, seven pips for
the stations, the step's title and its line), the scene, and a footer with
**Back** (never on the first screen), the one gold button that says what the
next tap does, a short hint naming the tap and the key, and one quiet link.

The ticket is a little paper ticket with googly eyes and a grin, carrying its
booth's picture and "My booth: …" (a line of handwriting when it's too small
to read), with its labels hanging off it.

## The journey

Nothing moves on by itself: every beat waits for a tap on the gold button or
the scene, or for →, Enter or Space. ← goes back where there is a Back.

1. **The Academy** (the entrance, under a chalkboard). "You're the ticket.
   Let's make a booth!" The ticket bobs on a lit podium among twinkles, and
   the gold button breathes: **Tap to start**. This is what the map shows.
2. **Write your ticket** (station 1, Ask, by the writing desk under the Your
   booth form). Pick a booth from three cards: a Penguin DJ, a Cocoa volcano
   or a Snowball cannon (or **Surprise me**, or →).
3. **Now pick a look**: Diorama, Pixel art or Papercut, the looks the Your
   booth form offers, each drawn on your booth.
4. **Hello, ticket!** The ticket pops into life on the desk in a burst of
   stars, labelled `booth-request`.
5. **The assessment** (station 2). The elf by its desk reads it ("Hmm… a
   booth? Let's see."); **Stamp it!** thunks ACCEPTED onto the ticket with a
   ring of ink, the ticket jolts and the `tessl` label swings on. It could also
   have asked one question, or declined.
6. **The implement loop** (station 3). A bot waits by its workbench; **Build
   it!** sends parts flying in to make the booth, on its own branch, and a
   pull request pops out.
7. **The checks** (station 4). Three bugs scuttle about the test mat: tap each
   one (or **Squash!**, or →) for a SPLAT, a soft ring, a little spray and a
   short shake; then the seven checks on the board above (lint, types, tests,
   ownership, size, smoke test and preview) tick green one after another, and
   a smoke test plays it in a real browser.
8. **Code review** (station 5). Tessl Code Review's magnifying glass sweeps
   the code on the easel, finds one thing (a stray sock), and the shepherd, a
   sheep with a crook, trots in and fixes it.
9. **The auto-merge gate** (station 6). Seven lamps hang from the gate's
   lintel and a board beside it names each check: Request accepted, Only your
   own folder, Code stays in its square, Nothing hidden in the text, Checks
   pass, Code review approves, Risk and taste check. Each tap lights one with
   a pop and a soft ring. All seven lit, the doors swing open on a warm light
   in a gentle burst, and the ticket hops in the doorway: it merges on its own.
   Any doubt, and a maintainer looks instead.
10. **You're on the map!** (station 7). The hall's big doors open on the snowy
    dusk, and the booth springs up on a patch of snow in its look, under
    drifting confetti, with the ways on (below). **Your repo ▶** in the
    header's corner, a tap on the scene, or → goes on.
11. **Same loop, your repo.** One card over the dimmed hall sets the North
    Pole beside any repository: the Your booth form and a GitHub or Linear
    issue; the factory's loops and your loops in `tessl.json`; review with the
    shepherd and review with lenses; a booth on the map and a reviewed pull
    request. Each loop is an agent, a skill and the event that starts it.
    **Start over** goes back to the first screen.

**Back** goes back a beat, or a step (the bugs come back with the checks).
After a minute with nobody playing, the first screen comes back for the next
visitor. Nothing flashes: the squash and the gate move small things and fade
them, and the only loops are slow ones.

## The ways on

The drawing can't open anything itself: it runs sandboxed. A tap on a way on
makes `ask()` answer for that one frame, `{ open: n }` for the page's link n
or `{ visit: 'the-factory' }`, and moves nothing.

- During the journey there is one quiet link in the footer's corner, **Start
  the Academy ↗** (`{ open: 0 }`).
- On the "you're on the map" card, once it has been up for a moment (so a
  quick double tap or key can't hit one): the gold hero, **Want a real one?
  Ask for a booth ↗** (`{ open: 1 }`); two secondary buttons side by side,
  **Start the Academy ↗** (`{ open: 0 }`) and **Why a factory? →**
  (`{ visit: 'the-factory' }`); and a quiet line of links, **Keep in touch:
  AI DevCon · Blog · Podcast** (`{ open: 2 }`, `{ open: 3 }`, `{ open: 4 }`).

Everything tappable is at least 9 units tall, a finger's width on a phone.
The Academy keeps its state in memory for one visit only, and moves only from
`time`.

## Files

- `attraction.ts`: the square, putting the parts together, and `ask()`.
- `steps.ts`: the journey's steps and beats, the booths, the looks and the
  gate's checks.
- `state.ts` and `journey.ts`: what the Academy remembers, and the rules that
  move it on a tap or a key; `bugs.ts`: where the bugs are and which one a
  tap hits.
- `layout.ts` and `nudges.ts`: where everything tappable is, and what a tap
  asks of the page.
- `camera.ts`: which bay each step stands in, where the camera looks and
  where the ticket stands as it walks (plain functions).
- `stage.ts`, `hall.ts`, `bays.ts` and `props.ts`: the hall, its bays and
  their furniture; `traveller.ts`: the ticket on its way, its labels and its
  stamp; `scenes-ask.ts`, `scenes-make.ts`, `scenes-check.ts`,
  `scenes-end.ts` and `scenes-live.ts`: what happens at each station;
  `ticket.ts`, `folk.ts` and `icons.ts`: the ticket, the helpers and the
  booths.
- `header.ts`, `footer.ts` and `ui.ts`: the header, the footer, and the
  shared panels, buttons and links; `moment.ts`: the speech bubble;
  `juice.ts`: the shake, the ring and the burst; `kit.ts`: the type scale,
  lettering and easing.
