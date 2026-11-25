import './style.css';
import { applyTheme } from './northpole/theme';
import { startRouter } from './router';
import { keepUpToDate } from './updates';
import { startIntro } from './intro';

/** The owners whose avatars the build downloaded (scripts/download-avatars.ts), set by Vite. */
declare const __AVATARS__: string[];
const AVATARS: ReadonlySet<string> = new Set(typeof __AVATARS__ === 'object' ? __AVATARS__ : []);

/* v8 ignore start -- the page's entry point, which every smoke test loads: src/router.ts holds what it starts, and is unit tested */
applyTheme();
keepUpToDate();

const app = document.querySelector<HTMLElement>('#app');
if (app) startRouter(app, AVATARS);
startIntro(location.hash);
/* v8 ignore stop */
