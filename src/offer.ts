import { signupOffer } from '../northpole/links';

/**
 * The free credits offer for new Tessl sign-ups, beside a "Run this on your
 * own repo" link: one short line, its terms in small print, hidden while
 * `TESSL_SIGNUP_URL` or `TESSL_SIGNUP_OFFER` in northpole/links.ts is empty.
 */
export const SIGNUP_OFFER = `<div class="history-offer" hidden>
        <p><span class="history-offer-tag">Offer</span> <a class="history-offer-link" target="_blank" rel="noopener"></a></p>
        <p class="history-terms">Terms apply, as set out on Tessl's sign-up page. Tessl makes this offer, not the carnival.</p>
      </div>`;

/** Fills in and shows the offer `SIGNUP_OFFER` put inside `root`, once both its halves are set. */
export function showSignupOffer(root: ParentNode, offer = signupOffer()) {
  const box = root.querySelector<HTMLElement>('.history-offer');
  const link = root.querySelector<HTMLAnchorElement>('.history-offer-link');
  if (!offer || !box || !link) return;
  link.href = offer.url;
  link.textContent = offer.text;
  box.hidden = false;
}
