/**
 * Sharing a season card (src/season-card.ts): Download saves the card as a
 * PNG made in the page, and Copy link copies the booth's link on the map.
 * Nothing is posted anywhere. Kept apart from the card's page so each button's
 * fallbacks are tested on their own.
 */

/** Download saves the card as a PNG made in the page. */
export function offerDownload(
  download: HTMLButtonElement,
  canvas: HTMLCanvasElement,
  login: string,
) {
  download.addEventListener('click', () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const save = document.createElement('a');
      save.href = url;
      save.download = `north-pole-season-${login}.png`;
      save.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    }, 'image/png');
  });
}

/**
 * Copy link copies the booth's link on the map, or, with no clipboard, shows
 * it in the share text, selected, to copy by hand. Returns how to stop its
 * label changing back.
 */
export function offerCopy(copy: HTMLButtonElement, text: HTMLTextAreaElement, mapLink: string) {
  let reset = 0;
  const copied = async () => {
    try {
      await navigator.clipboard.writeText(mapLink);
      copy.textContent = 'Copied!';
    } catch {
      // Putting the link back first if the visitor edited it out.
      if (!text.value.includes(mapLink)) text.value = `${text.value.trimEnd()}\n${mapLink}`.trim();
      const start = text.value.lastIndexOf(mapLink);
      text.focus();
      text.setSelectionRange(start, start + mapLink.length);
      copy.textContent = 'Copy it from the share text';
    }
    window.clearTimeout(reset);
    reset = window.setTimeout(() => {
      copy.textContent = 'Copy link';
    }, 2000);
  };
  copy.addEventListener('click', () => void copied());
  return () => {
    window.clearTimeout(reset);
  };
}
