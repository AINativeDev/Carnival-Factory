import { expect, test, type Page } from './coverage';
import { NO_ANSWERS } from '../src/year-in-review-panel';
import { YEAR_IN_REVIEW_URL } from '../src/northpole/links';

/**
 * The Year in Review, end to end (docs/specs/year-in-review.md, ADR 0047): its
 * gallery on the home map takes the sleigh into the gallery room, whose panel
 * links to the form for your answer, and a question's panel shows its words,
 * the link, and the answers, which a preview has none of yet. On a laptop and
 * a phone; the phone opens the items by their own links (ADR 0040).
 */

/** Collects what the page did wrong. */
function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
  return problems;
}

/** Checks a panel's link to the form: a button, to the form, in a new tab. */
async function expectAnswerLink(page: Page, panel: string) {
  const link = page.locator(`${panel} .level-links a.level-link`);
  await expect(link).toHaveCount(1);
  await expect(link).toHaveText('Add your answer');
  await expect(link).toHaveAttribute('href', YEAR_IN_REVIEW_URL);
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(link).toBeVisible();
}

for (const viewport of [
  { name: 'laptop', width: 1500, height: 900 },
  { name: 'phone', width: 390, height: 844 },
])
  test(`The Year in Review's gallery opens its room and a question's answers (${viewport.name})`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(viewport);
    const problems = watch(page);
    const canvas = page.locator('.map-canvas');

    await test.step('the gallery on the map takes the sleigh in', async () => {
      await page.goto('#/?attraction=the-year-in-review');
      await expect(canvas).toHaveAttribute('data-selected', 'attraction:the-year-in-review');
      await expect(page.locator('.map-prompt')).toContainText('The Year in Review');
      await canvas.focus();
      await page.keyboard.press('e');
      await expect(page).toHaveURL(/#\/level\/the-year-in-review$/);
      await expect(page.locator('.hud-level')).toContainText('The Year in Review');
      await expect(page.locator('.hud-level')).toContainText('A level by the North Pole');
      await expectAnswerLink(page, '.hud-level');
    });

    await test.step("a question's panel shows its words and asks for the first answer", async () => {
      await page.goto('#/level/the-year-in-review/hot-take');
      const panel = page.locator('.visit');
      await expect(panel.locator('.visit-title')).toHaveText('Hot take');
      await expect(panel.locator('.visit-description')).toHaveText("One hot take you'd bet on?");
      await expectAnswerLink(page, '.visit');
      await expect(panel.locator('.year-answers')).toContainText('Your answers');
      await expect(panel.locator('.year-answers-empty')).toHaveText(NO_ANSWERS);
      await expect(panel.locator('.year-answers-empty')).toBeVisible();
    });

    await test.step('the guestbook holds your own questions', async () => {
      await page.goto('#/level/the-year-in-review/your-questions');
      const panel = page.locator('.visit');
      await expect(panel.locator('.visit-title')).toHaveText('Your questions');
      await expect(panel.locator('.year-answers')).toContainText(
        'Your questions, and your answers',
      );
    });
    expect(problems).toEqual([]);
  });
