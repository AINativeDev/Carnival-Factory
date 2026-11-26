# Visit Santa

Owned by [@adrianfluckiger](https://github.com/adrianfluckiger).

A line of kids waits outdoors at the North Pole to meet Santa, who sits in a
big red chair under a "Meet Santa" sign, with an elf on one side and a
reindeer with a glowing red nose on the other.

- **The line**: the elf walks out from Santa's side to the head of the queue,
  takes the next child by the hand and brings them to Santa. The queue shuffles
  forward as they go.
- **The visit**: the child sits on Santa's lap and asks for presents.
- **The carrot**: when the child hops down, Santa hands the reindeer a carrot
  that arcs through the air, the reindeer munches, and the child waves and
  walks off.
- **The family dog**: every fourth child arrives with a dog trotting behind.
- **The stall**: a gazebo with a berry-red roof and snow trim.

Everything is drawn from `time` alone, so nothing is remembered between frames.

- `story.ts` is the timeline of one child's turn (pure functions, tested).
- `figures.ts` draws the kids, the elf, the dog, the reindeer and the carrot.
- `santa.ts` draws the chair, Santa, the sign and the clearing.
- `booth.ts` puts it together back to front.
