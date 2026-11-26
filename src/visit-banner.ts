/**
 * The square's name in the top bar while someone is inside it, beside the
 * site's own name, since nothing round the drawing names it any more
 * (docs/adr/0057-a-visit-is-the-booth-not-a-room.md). Names are only ever set
 * as text.
 */

/** Puts the name pill in the page's top bar; `name` updates it, `stop` takes it away. */
export function bannerTitle(owner: string) {
  const pill = document.createElement('p');
  pill.className = 'banner-square';
  const name = document.createElement('span');
  name.className = 'banner-square-name';
  pill.append(name);
  if (owner) {
    const by = document.createElement('span');
    by.className = 'banner-square-by';
    by.textContent = ` by ${owner}`;
    pill.append(by);
  }
  document.querySelector('.banner .brand')?.after(pill);
  return {
    name(text: string) {
      name.textContent = text;
    },
    stop() {
      pill.remove();
    },
  };
}
