// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { the } from './dom';

describe('the', () => {
  it("finds a page's part, and fails saying which when it's missing or another kind", () => {
    const root = document.createElement('div');
    root.innerHTML = '<button class="go">Go</button>';
    expect(the(root, '.go', HTMLButtonElement).textContent).toBe('Go');
    expect(() => the(root, '.stop', HTMLElement)).toThrow('The page has no HTMLElement at .stop');
    expect(() => the(root, '.go', HTMLInputElement)).toThrow(/HTMLInputElement at \.go/);
  });
});
