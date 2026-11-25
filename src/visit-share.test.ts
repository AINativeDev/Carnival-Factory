// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { wireShare } from './visit-share';

function parts() {
  document.body.innerHTML =
    '<button>Share</button><details><summary>Share options</summary><textarea></textarea></details>';
  return {
    copy: document.querySelector('button') as HTMLButtonElement,
    text: document.querySelector('textarea') as HTMLTextAreaElement,
    options: document.querySelector('details') as HTMLDetailsElement,
  };
}

const square = { kind: 'booth' as const, id: 'ana', name: () => "Ana's booth" };
const link = 'https://example.test/share/booth-ana.html';
const clipboard = (writeText: (text: string) => Promise<void>) =>
  vi.stubGlobal('navigator', { clipboard: { writeText } });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('wireShare', () => {
  it('fills in the line with the link, and keeps a line the visitor edited', () => {
    const share = parts();
    const wired = wireShare(share, square, link);
    wired.refresh();
    expect(share.text.value).toContain(link);
    share.text.value = 'My own words';
    share.text.dispatchEvent(new Event('input'));
    wired.refresh();
    expect(share.text.value).toBe('My own words');
  });

  it('copies the line, says so, and goes back to Share after a moment', async () => {
    vi.useFakeTimers();
    const copied: string[] = [];
    clipboard((text) => {
      copied.push(text);
      return Promise.resolve();
    });
    const share = parts();
    const wired = wireShare(share, square, link);
    wired.refresh();
    share.copy.click();
    await vi.waitFor(() => {
      expect(share.copy.textContent).toBe('Copied');
    });
    expect(copied[0]).toContain(link);
    vi.advanceTimersByTime(2000);
    expect(share.copy.textContent).toBe('Share');
    wired.stop();
  });

  it('opens the line and selects it to copy by hand when there is no clipboard', async () => {
    clipboard(() => Promise.reject(new Error('denied')));
    const share = parts();
    wireShare(share, square, link).refresh();
    share.copy.click();
    await vi.waitFor(() => {
      expect(share.options.open).toBe(true);
    });
  });

  it("rewrites the line as the owner's own, ready to edit", () => {
    const share = parts();
    const wired = wireShare(share, square, link);
    wired.refresh();
    const visitorLine = share.text.value;
    wired.shareAsMine();
    expect(share.text.value).not.toBe(visitorLine);
    expect(share.options.open).toBe(true);
  });
});
