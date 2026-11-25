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
    // The diorama at dusk: its sky, its hills, its warm lights and the HUD's panels.
    dusk: '#3a3f6b',
    duskLow: '#8a6f93',
    horizon: '#e9b8a3',
    mountain: '#4d5a85',
    mountainFar: '#6f7aa3',
    hill: '#9fb0cc',
    cloud: '#d9dcec',
    lantern: '#ffc874',
    slab: '#b8c8dd',
    slabShade: '#8796b3',
    cream: '#fbf3e1',
    ink: '#2b2a3d',
    // A square's diorama: snow in the warm light, and the cool shadows things cast.
    snowLit: '#fff4e2',
    shadow: '#283255',
  },
  font: {
    family: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
    /** The lettering families signs choose from, each a web-safe stack. */
    signs: {
      sans: '"Trebuchet MS", "Segoe UI", system-ui, sans-serif',
      condensed: '"Avenir Next Condensed", "Arial Narrow", "Roboto Condensed", sans-serif',
      serif: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
      slab: 'Rockwell, "Roboto Slab", "Courier New", serif',
      rounded: '"Arial Rounded MT Bold", "Varela Round", "Trebuchet MS", sans-serif',
    },
    small: 14,
    body: 18,
    title: 32,
  },
  radius: 12,
} as const;

/** One of the sign lettering families. */
export type SignFamily = keyof typeof theme.font.signs;

/** A sign's canvas font: its family at `px` pixels, bold or not, italic or not. */
export function signFont(family: SignFamily, px: number, bold = true, italic = false) {
  return `${italic ? 'italic ' : ''}${bold ? 'bold' : 'normal'} ${String(px)}px ${theme.font.signs[family]}`;
}

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
