import './style.css';
import { applyTheme } from './northpole/theme';
import { startRouter } from './router';
import { keepUpToDate } from './updates';
import { startIntro } from './intro';
import { startTopMenu } from './top-menu';

/** The owners whose avatars the build downloaded (scripts/download-avatars.ts), set by Vite in every mode. */
declare const __AVATARS__: string[];

/* v8 ignore start -- the page's entry point, which every smoke test loads: src/router.ts holds what it starts, and is unit tested */
applyTheme();
keepUpToDate();

const app = document.querySelector<HTMLElement>('#app');
if (app) startRouter(app, new Set(__AVATARS__));
// The menu first: its About is the button the intro listens to.
const banner = document.querySelector<HTMLElement>('.banner');
if (banner) startTopMenu(banner);
startIntro(location.hash);
/* v8 ignore stop */
