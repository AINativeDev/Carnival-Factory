/**
 * The North Pole's colours, fonts and sizes. Booths draw with these rather than
 * their own values, so every booth on the map looks like it belongs.
 */
export const theme = {
  colors: {
    night: '#0f1b33',
    surface: '#1c2c4c',
    text: '#f7fbff',
    muted: '#a9bcd6',
    snow: '#eef5fb',
    snowShade: '#cfdeec',
    ice: '#9fd3ef',
    pine: '#1f6b45',
    pineDark: '#144a30',
    berry: '#d7263d',
    gold: '#f4c542',
    wood: '#8a5a3b',
    glow: '#ffe9a8',
    // The northern lights, and the midway's treats.
    aurora: '#5ef2b8',
    violet: '#a98bff',
    mint: '#7fe3c8',
    cocoa: '#5b3521',
    gingerbread: '#c27a3e',
  },
  font: {
    family: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
    small: 14,
    body: 18,
    title: 32,
  },
  radius: 12,
} as const;

/** Canvas font string, e.g. canvasFont('title') → 'bold 32px "Trebuchet MS", …'. */
export function canvasFont(size: 'small' | 'body' | 'title', weight: 'normal' | 'bold' = 'normal') {
  return `${weight} ${theme.font[size]}px ${theme.font.family}`;
}

/** Exposes the theme to CSS as custom properties, e.g. --color-gold. */
export function applyTheme(root: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--color-${name}`, value);
  }
  root.style.setProperty('--font-family', theme.font.family);
  root.style.setProperty('--radius', `${theme.radius}px`);
}
