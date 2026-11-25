import type { NorthPoleLevel } from '../../../src/northpole/level';

/**
 * The Year in Review: a gallery room with a question about the year on each
 * of its displays (ADR 0047). The old masters' wing, along the upper left
 * wall, looks back on '26: gilded frames behind a velvet rope, with the
 * attractions painted as old masters and expressionists would, and the seven
 * questions on easels. The modern wing, along the upper right wall, looks
 * ahead to '27: a white wall of thin black frames, pop art, a poster, colour
 * fields, and the neon '26 → '27, with the six questions on white plinths.
 * Statues, a turning mobile, a mirrorball over the dance floor, a guard and a
 * visitor with an audio guide in between, and the guestbook of your own
 * questions on the reception desk by the front. Plain data: the engine checks
 * it and draws it (ADR 0035, ADR 0040).
 */
const level: NorthPoleLevel = {
  id: 'the-year-in-review',
  name: 'The Year in Review',
  description:
    'A gallery of the year: a question on every display, looking back on ’26 and ahead to ’27, with visitors’ answers.',
  theme: 'dusk',
  indoor: true,
  size: 19,
  // The dance floor under the mirrorball, and the rug by the reception.
  ground: [{ tile: 'carpet', area: { x: 5, y: 5, w: 9, h: 9 } }],
  props: [
    // The old masters' wing, on the upper left wall: gilded frames, its sign, and the doors home.
    { kind: 'framed-picture', x: 0, y: 1, variant: 0.05 },
    { kind: 'framed-picture', x: 0, y: 2, variant: 0.15 },
    { kind: 'wall-sign', x: 0, y: 3, variant: 0.2 },
    { kind: 'framed-picture', x: 0, y: 6, variant: 0.25 },
    { kind: 'framed-picture', x: 0, y: 7, variant: 0.42 },
    { kind: 'framed-picture', x: 0, y: 8, variant: 0.35 },
    { kind: 'wall-door', x: 0, y: 10 },
    { kind: 'framed-picture', x: 0, y: 13, variant: 0.3 },
    { kind: 'framed-picture', x: 0, y: 15, variant: 0.4 },
    { kind: 'wall-window', x: 0, y: 17, variant: 0.6 },
    // The velvet rope before the old masters.
    { kind: 'velvet-rope', x: 1, y: 1 },
    { kind: 'velvet-rope', x: 1, y: 2 },
    { kind: 'velvet-rope', x: 1, y: 6 },
    { kind: 'velvet-rope', x: 1, y: 7 },
    // The modern wing, on the upper right wall: the neon, its sign, and a white wall of modern art.
    { kind: 'neon-art', x: 1, y: 0 },
    { kind: 'framed-picture', x: 4, y: 0, variant: 0.5 },
    { kind: 'wall-sign', x: 5, y: 0, variant: 0.8 },
    { kind: 'framed-picture', x: 8, y: 0, variant: 0.78 },
    { kind: 'framed-picture', x: 9, y: 0, variant: 0.85 },
    { kind: 'framed-picture', x: 10, y: 0, variant: 0.95 },
    { kind: 'framed-picture', x: 11, y: 0, variant: 0.55 },
    { kind: 'framed-picture', x: 12, y: 0, variant: 0.72 },
    { kind: 'framed-picture', x: 13, y: 0, variant: 0.82 },
    { kind: 'framed-picture', x: 14, y: 0, variant: 0.9 },
    { kind: 'framed-picture', x: 15, y: 0, variant: 0.6 },
    { kind: 'framed-picture', x: 16, y: 0, variant: 0.68 },
    { kind: 'framed-picture', x: 17, y: 0, variant: 0.75 },
    // Statues, the mobile and the mirrorball, the bench, and the signs not to touch.
    { kind: 'statue', x: 6, y: 5, variant: 0.1 },
    { kind: 'statue', x: 11, y: 9, variant: 0.5 },
    { kind: 'statue', x: 17, y: 10, variant: 0.9 },
    { kind: 'mobile', x: 10, y: 10, variant: 0.3 },
    { kind: 'mirrorball', x: 6, y: 11 },
    { kind: 'bench', x: 10, y: 12, variant: 0.4 },
    { kind: 'art-sign', x: 6, y: 2, variant: 0.2 },
    { kind: 'art-sign', x: 15, y: 1, variant: 0.8 },
    // The guard and a visitor with an audio guide.
    { kind: 'gallery-elf', x: 2, y: 12, variant: 0.2 },
    { kind: 'gallery-elf', x: 11, y: 5, variant: 0.7 },
    // The reception's desk, rug and plants, and the party: balloons and confetti.
    { kind: 'desk', x: 13, y: 16, variant: 0.9 },
    { kind: 'rug', x: 10, y: 16, variant: 0.8 },
    { kind: 'plant', x: 17, y: 12, variant: 0.3 },
    { kind: 'plant', x: 17, y: 15, variant: 0.7 },
    { kind: 'balloons', x: 17, y: 17, variant: 0.2 },
    { kind: 'balloons', x: 1, y: 17, variant: 0.6 },
    { kind: 'confetti', x: 8, y: 15, variant: 0.3 },
    { kind: 'confetti', x: 12, y: 11, variant: 0.6 },
    { kind: 'confetti', x: 15, y: 12, variant: 0.9 },
  ],
  arrival: { x: 9, y: 18 },
  exits: [{ x: 1, y: 10 }],
  // Looking back on '26 in the old wing, ahead to '27 in the modern one, and the guestbook at the reception.
  // Each wing's displays step away from its wall on a slant, never in a straight row: in a row, the
  // next display stands in front of the tile east of a door on screen, and the walk can't click it.
  // So each one's door has a clear tile on its east, where no other display stands in front of it on screen.
  squares: [
    { id: 'dumbest-ai-moment', x: 2, y: 2 },
    { id: 'coding-disaster', x: 3, y: 4 },
    { id: 'felt-like-magic', x: 5, y: 6 },
    { id: 'stopped-doing', x: 3, y: 12 },
    { id: 'vibe-code-regret', x: 5, y: 14 },
    { id: 'most-overrated', x: 5, y: 8 },
    { id: 'hands-off', x: 7, y: 10 },
    { id: 'my-day-in-27', x: 12, y: 5 },
    { id: 'finally-fixed', x: 10, y: 3 },
    { id: 'worse-before-better', x: 8, y: 1 },
    { id: 'still-reviewing', x: 12, y: 7 },
    { id: 'buzzword-dies', x: 13, y: 10 },
    { id: 'hot-take', x: 15, y: 2 },
    { id: 'your-questions', x: 14, y: 14 },
  ],
};

export default level;
