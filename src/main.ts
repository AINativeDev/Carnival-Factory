import './style.css';
import { CHANGE_URL, CLAIM_URL } from './northpole/links';
import { startMap, startPreview } from './northpole/map';
import type { NorthPolePlot } from './northpole/plot';
import { applyTheme } from './northpole/theme';
import { registry } from './plots';

applyTheme();

const app = document.querySelector<HTMLElement>('#app')!;
let stop: (() => void) | undefined;

function renderMap() {
  document.body.dataset.view = 'map';
  app.innerHTML = `
    <section class="map">
      <p class="map-help">
        Every square belongs to one person. Click a plot to see it up close.
        <a href="${CLAIM_URL}" target="_blank" rel="noopener">Claim your own plot</a>.
      </p>
      <div class="map-frame">
        <canvas class="map-canvas" aria-label="The North Pole map. Click a plot to preview it."></canvas>
      </div>
      <nav class="map-guide" aria-label="Plots">
        <h2>Plots</h2>
        <ul></ul>
      </nav>
    </section>`;

  const guide = app.querySelector('.map-guide ul')!;
  for (const plot of registry.all()) {
    const item = document.createElement('li');
    item.innerHTML = `<a href="#/plot/${plot.owner}"><span class="name"></span> <span class="owner"></span></a>`;
    item.querySelector('.name')!.textContent = plot.name;
    item.querySelector('.owner')!.textContent = `@${plot.owner}`;
    guide.append(item);
  }

  stop = startMap(app.querySelector('canvas')!, {
    plots: registry.all(),
    onOpen: (owner) => (location.hash = `#/plot/${owner}`),
  });
}

function renderPlot(plot: NorthPolePlot) {
  document.body.dataset.view = 'plot';
  app.innerHTML = `
    <section class="plot">
      <div class="plot-header">
        <a href="#/">← Back to the map</a>
        <h1></h1>
        <p class="owner">Owned by <a target="_blank" rel="noopener"></a></p>
        <p class="description"></p>
      </div>
      <canvas class="plot-canvas"></canvas>
      <p class="plot-help">
        Is this yours? <a href="${CHANGE_URL}" target="_blank" rel="noopener">Ask the factory for a change</a>.
      </p>
    </section>`;
  app.querySelector('h1')!.textContent = plot.name;
  app.querySelector('.description')!.textContent = plot.description;
  const owner = app.querySelector<HTMLAnchorElement>('.owner a')!;
  owner.textContent = `@${plot.owner}`;
  owner.href = `https://github.com/${plot.owner}`;
  stop = startPreview(app.querySelector('canvas')!, plot);
}

function renderMissing(owner: string) {
  document.body.dataset.view = 'plot';
  app.innerHTML = `
    <section class="plot">
      <div class="plot-header">
        <a href="#/">← Back to the map</a>
        <h1>No plot yet</h1>
        <p class="description"></p>
      </div>
    </section>`;
  app.querySelector('.description')!.textContent =
    `Nobody has built a plot for @${owner} yet. Claim it with a new issue, and the factory builds it.`;
}

function route() {
  stop?.();
  stop = undefined;

  const match = location.hash.match(/^#\/plot\/([\w-]+)$/);
  if (!match) return renderMap();
  const plot = registry.get(match[1]);
  if (plot) renderPlot(plot);
  else renderMissing(match[1]);
}

window.addEventListener('hashchange', route);
route();
