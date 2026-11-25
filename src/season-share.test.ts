// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { offerCopy, offerDownload } from './season-share';

const LINK = 'https://example.test/#/?booth=ana';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('offerDownload', () => {
  it('saves the card as a PNG named for its owner, and lets the file go after', () => {
    const button = document.createElement('button');
    const canvas = document.createElement('canvas');
    const blobs: (Blob | null)[] = [new Blob(['png']), null];
    vi.spyOn(canvas, 'toBlob').mockImplementation((made, type) => {
      expect(type).toBe('image/png');
      made(blobs.shift() ?? null);
    });
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:card');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const saved: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      saved.push(`${this.download} ${this.href}`);
    });
    offerDownload(button, canvas, 'ana');

    button.click();
    expect(saved).toEqual(['north-pole-season-ana.png blob:card']);
    vi.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledWith('blob:card');

    // A canvas that can't make a PNG saves nothing.
    button.click();
    expect(saved).toHaveLength(1);
  });
});

describe('offerCopy', () => {
  const setUp = (writeText: (text: string) => Promise<void>) => {
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const button = document.createElement('button');
    button.textContent = 'Copy link';
    const text = document.createElement('textarea');
    document.body.replaceChildren(button, text);
    return { button, text, stop: offerCopy(button, text, LINK) };
  };

  it('copies the link, says so, and changes back after a while', async () => {
    const written: string[] = [];
    const { button } = setUp((text) => {
      written.push(text);
      return Promise.resolve();
    });
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(written).toEqual([LINK]);
    expect(button.textContent).toBe('Copied!');
    await vi.advanceTimersByTimeAsync(2000);
    expect(button.textContent).toBe('Copy link');
  });

  it('without a clipboard, selects the link in the share text, putting it back if it was taken out', async () => {
    const { button, text, stop } = setUp(() => Promise.reject(new Error('no clipboard')));
    text.value = 'My season  ';
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(text.value).toBe(`My season\n${LINK}`);
    expect(text.value.slice(text.selectionStart, text.selectionEnd)).toBe(LINK);
    expect(button.textContent).toBe('Copy it from the share text');

    text.value = `${LINK} is mine`;
    button.click();
    await vi.advanceTimersByTimeAsync(0);
    expect(text.value).toBe(`${LINK} is mine`);
    expect([text.selectionStart, text.selectionEnd]).toEqual([0, LINK.length]);

    // Stopped, the label stays as it is.
    stop();
    await vi.advanceTimersByTimeAsync(2000);
    expect(button.textContent).toBe('Copy it from the share text');
  });
});
