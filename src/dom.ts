/**
 * Finding a page's own parts. Each page here writes its markup and then looks
 * its parts up, so a part that isn't there is a mistake in that markup: it
 * fails at once, saying which, rather than later as a null somewhere else
 * (docs/adr/0027-strict-typescript.md: no non-null assertions).
 */

/** The first element in `root` matching `selector`, which must be a `kind`. */
export function the<T extends Element>(
  root: ParentNode,
  selector: string,
  kind: abstract new () => T,
): T {
  const found = root.querySelector(selector);
  if (found instanceof kind) return found;
  throw new Error(`The page has no ${kind.name} at ${selector}`);
}
