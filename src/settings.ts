/**
 * The settings the whole site shares, in one place: its name and edition,
 * its repository, how its links out are tagged, and the addresses of Tessl,
 * AI DevCon and GitHub. Change them here, never inline: the page, the
 * build's scripts and index.html (through `fillEdition` in edition.ts) all
 * read them from this file. Plain data, so Node's scripts and the browser
 * share it.
 */
export const SETTINGS = {
  /** The product's name, the same every edition, and this edition's. */
  site: { name: 'Carnival Factory', edition: 'Christmas edition' },
  /** The repository the factory runs on, where every booth starts as an issue. */
  repo: 'AINativeDev/Carnival-Factory',
  /** How a link out is tagged, so Tessl can tell the carnival sent the visit; the medium is the link's place. */
  utm: { source: 'carnival-factory', campaign: 'christmas-edition' },
  /** Tessl's own places: its site, signing up, the Academy, the podcast and its channel. */
  tessl: {
    home: 'https://tessl.io',
    signup: 'https://tessl.io/login',
    academy: 'https://tessl.io/academy',
    podcast: 'https://tessl.io/podcast/',
    youtube: 'https://www.youtube.com/@tessl-ai',
  },
  /** What's on next, as the billboard says it, and where its tickets are. */
  aiDevcon: {
    title: 'AI DevCon',
    next: 'Next in London',
    when: '7–8 June 2027 · The Brewery',
    tickets: 'https://luma.com/aidevcon-ldn2027',
  },
  /** GitHub's web and API addresses; a workflow's GITHUB_API_URL still wins for the API. */
  github: { web: 'https://github.com', api: 'https://api.github.com' },
} as const;

/** The repository's page on GitHub. */
export const REPO_URL = `${SETTINGS.github.web}/${SETTINGS.repo}`;
