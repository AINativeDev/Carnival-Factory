/**
 * The words a level's HUD and its map say about it: its name, who it's by and
 * what it's about. A participant's level credits `@<login>`; the North Pole's
 * own say "the North Pole" (ADR 0035). Participant text goes in as plain text,
 * never markup.
 */
interface LevelHudRoot {
  querySelector(selector: string): { textContent: string | null } | null;
}

interface LevelMap {
  setAttribute(name: string, value: string): void;
}

export function labelLevel(
  root: LevelHudRoot,
  map: LevelMap,
  level: { name: string; description: string },
  owner: string,
): void {
  map.setAttribute(
    'aria-label',
    `${level.name}, a level by ${owner}. Walk with WASD or the arrow keys, or click where you'd like to go. Press E at a square to go inside, or at the sleigh to go back to the North Pole.`,
  );
  const show = (selector: string, text: string) => {
    const element = root.querySelector(selector);
    if (element) element.textContent = text;
  };
  show('.level-name', level.name);
  show('.level-owner', `A level by ${owner}`);
  show('.level-description', level.description);
}
