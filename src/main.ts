import './style.css';
import { attractionRegistry } from '../northpole/attractions';
import { CHANGE_URL, CLAIM_URL } from '../northpole/links';
import { startMap, startPreview } from '../northpole/map';
import type { NorthPoleSquare } from '../northpole/square';
import { applyTheme } from '../northpole/theme';
import { boothRegistry } from '../northpole/booths';

applyTheme();

const app = document.querySelector<HTMLElement>('#app')!;
let stop: (() => void) | undefined;

function renderGuide(
  list: Element,
  squares: NorthPoleSquare[],
  href: string,
  by: (id: string) => string,
) {
  for (const square of squares) {
    const item = document.createElement('li');
    item.innerHTML = `<a><span class="name"></span> <span class="owner"></span></a>`;
    item.querySelector('a')!.href = `#/${href}/${square.id}`;
    item.querySelector('.name')!.textContent = square.name;
    item.querySelector('.owner')!.textContent = by(square.id);
    list.append(item);
  }
}

function renderMap() {
  document.body.dataset.view = 'map';
  app.innerHTML = `
    <section class="map">
      <p class="map-help">
        Welcome to the North Pole midway. The attractions down the middle are part of the
        North Pole itself, and the booths beside them each belong to one person. Click any
        square to see it up close. The open spots along the midway are waiting for a booth:
        <a href="${CLAIM_URL}" target="_blank" rel="noopener">claim your own</a>.
      </p>
      <div class="map-frame">
        <canvas class="map-canvas" aria-label="The North Pole map. Click an attraction or a booth to preview it."></canvas>
      </div>
      <nav class="map-guide" aria-label="Attractions">
        <h2>Attractions</h2>
        <ul class="attractions"></ul>
      </nav>
      <nav class="map-guide" aria-label="Booths">
        <h2>Booths</h2>
        <ul class="booths"></ul>
      </nav>
    </section>`;

  renderGuide(
    app.querySelector('.attractions')!,
    attractionRegistry.all(),
    'attraction',
    () => 'North Pole',
  );
  renderGuide(app.querySelector('.booths')!, boothRegistry.all(), 'booth', (id) => `@${id}`);

  stop = startMap(app.querySelector('canvas')!, {
    attractions: attractionRegistry.all(),
    booths: boothRegistry.all(),
    onOpen: (kind, id) => (location.hash = `#/${kind}/${id}`),
  });
}

function renderBooth(booth: NorthPoleSquare) {
  document.body.dataset.view = 'booth';
  app.innerHTML = `
    <section class="booth">
      <div class="booth-header">
        <a href="#/">← Back to the map</a>
        <h1></h1>
        <p class="owner">Owned by <a target="_blank" rel="noopener"></a></p>
        <p class="description"></p>
      </div>
      <canvas class="booth-canvas"></canvas>
      <p class="booth-help">
        Is this yours? <a href="${CHANGE_URL}" target="_blank" rel="noopener">Ask the factory for a change</a>.
      </p>
    </section>`;
  app.querySelector('h1')!.textContent = booth.name;
  app.querySelector('.description')!.textContent = booth.description;
  const owner = app.querySelector<HTMLAnchorElement>('.owner a')!;
  owner.textContent = `@${booth.id}`;
  owner.href = `https://github.com/${booth.id}`;
  stop = startPreview(app.querySelector('canvas')!, booth);
}

function renderAttraction(attraction: NorthPoleSquare) {
  document.body.dataset.view = 'booth';
  app.innerHTML = `
    <section class="booth">
      <div class="booth-header">
        <a href="#/">← Back to the map</a>
        <h1></h1>
        <p class="owner">An attraction of the North Pole</p>
        <p class="description"></p>
      </div>
      <canvas class="booth-canvas"></canvas>
      <p class="booth-help">
        Attractions belong to the North Pole, so only its maintainers change them.
        <a href="${CLAIM_URL}" target="_blank" rel="noopener">Claim a booth of your own</a> beside it.
      </p>
    </section>`;
  app.querySelector('h1')!.textContent = attraction.name;
  app.querySelector('.description')!.textContent = attraction.description;
  stop = startPreview(app.querySelector('canvas')!, attraction);
}

function renderMissing(title: string, description: string) {
  document.body.dataset.view = 'booth';
  app.innerHTML = `
    <section class="booth">
      <div class="booth-header">
        <a href="#/">← Back to the map</a>
        <h1></h1>
        <p class="description"></p>
      </div>
    </section>`;
  app.querySelector('h1')!.textContent = title;
  app.querySelector('.description')!.textContent = description;
}

function route() {
  stop?.();
  stop = undefined;

  // Booths used to be called plots: keep links shared before the rename working.
  const legacy = location.hash.match(/^#\/plot\/([\w-]+)$/);
  if (legacy) return location.replace(`#/booth/${legacy[1]}`);

  const match = location.hash.match(/^#\/(booth|attraction)\/([\w-]+)$/);
  if (!match) return renderMap();
  const [, kind, id] = match;

  if (kind === 'attraction') {
    const attraction = attractionRegistry.get(id);
    if (attraction) renderAttraction(attraction);
    else renderMissing('No such attraction', `The North Pole has no attraction called "${id}".`);
    return;
  }

  const booth = boothRegistry.get(id);
  if (booth) renderBooth(booth);
  else
    renderMissing(
      'No booth yet',
      `Nobody has built a booth for @${id} yet. Claim it with a new issue, and the factory builds it.`,
    );
}

window.addEventListener('hashchange', route);
route();
