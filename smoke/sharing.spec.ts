import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from './coverage';
import { SHOTS, frameOf, watch } from './support/carnival';

/**
 * Everything a visitor takes away from a booth: the Share line and the share
 * page it links to, the season card that downloads as a picture, and the Elf
 * Engineer badges served as plain files. Apart from the visit itself because
 * these all leave the map, by clipboard, download or another page.
 */

test("Share copies a friendly line with the booth's share page, which unfurls and leads back", async ({
  page,
  context,
  request,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('#/booth/jedi4ever');
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(
    /^@jedi4ever built .+ at the North Pole Carnival\. Come visit, and build your own: http:\/\/localhost:4173\/share\/booth-jedi4ever\.html$/,
  );
  await page.locator('.visit-more summary').click(); // the owner's links, under More
  await page.getByRole('button', { name: 'share it as yours' }).click();
  await expect(page.getByLabel('The message Share copies')).toHaveValue(/^I built /);

  const share = await request.get('share/booth-jedi4ever.html');
  const html = await share.text();
  expect(html).toContain('<meta property="og:title"');
  expect(html).toContain('<meta property="og:description"');
  expect(html).toContain('<meta property="og:image"');
  expect(html).toContain('<meta name="twitter:card"');
  expect(html).not.toMatch(/<script/i);
  await page.goto('share/booth-jedi4ever.html');
  await expect(page).toHaveURL(/#\/booth\/jedi4ever$/);
  await expect(page.locator('.visit').and(page.getByRole('region', { name: /.+/ }))).toBeVisible();

  await page.locator('.visit-more summary').click(); // the map link, under More
  await page.getByRole('link', { name: 'See it on the map' }).click();
  await expect(page).toHaveURL(/#\/\?booth=jedi4ever$/);
  await expect(page.locator('.visit')).toHaveCount(0);
  await expect(page.locator('.map-canvas')).toBeVisible();
});

test('a booth links to its season card, which downloads as a PNG and copies its map link', async ({
  page,
  context,
}) => {
  const problems = watch(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('#/booth/jedi4ever').then(() => page.locator('.visit-more summary').click());
  await page.locator('.visit').getByRole('link', { name: 'Your season' }).click();
  await expect(page).toHaveURL(/#\/season\/jedi4ever$/);
  await expect(page.getByRole('heading', { name: 'Your season' })).toBeVisible();
  const card = page.locator('canvas.season-card');
  await expect(card).toHaveAttribute('aria-label', /^@jedi4ever's season card: /);
  // The booth's frame opens and the card draws it.
  await expect(frameOf(page, 'booth', 'jedi4ever')).toHaveAttribute('data-state', 'ready');
  await page.waitForTimeout(500);
  await card.screenshot({ path: join(SHOTS, 'season-jedi4ever.png') });

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('north-pole-season-jedi4ever.png');
  const saved = readFileSync(await download.path());
  expect(saved.subarray(1, 4).toString()).toBe('PNG');

  await page.getByRole('button', { name: 'Copy link' }).click();
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    'http://localhost:4173/#/?booth=jedi4ever',
  );
  await expect(page.getByLabel('Share text')).toHaveValue(
    /^My season at the North Pole Carnival as @jedi4ever: .+ Come visit: http:\/\/localhost:4173\/#\/\?booth=jedi4ever$/,
  );
  await expect(
    page.getByRole('link', { name: 'Set up Tessl on your own repository' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Keep me posted' })).toBeVisible();
  expect(problems).toEqual([]);

  await page.goto('#/season/nobody-here-yet');
  await expect(page.getByRole('heading', { name: 'No season yet' })).toBeVisible();
  await expect(page.getByText("@nobody-here-yet doesn't have a booth yet.")).toBeVisible();
});

test('the Elf Engineer badges and their snippets are plain files on the site', async ({
  request,
}) => {
  for (const name of [
    'elf-engineer',
    'elf-engineer-bronze',
    'elf-engineer-silver',
    'elf-engineer-gold',
  ]) {
    const badge = await request.get(`badges/${name}.svg`);
    expect(badge.ok()).toBe(true);
    const svg = await badge.text();
    expect(svg).toContain('Elf Engineer');
    expect(svg).not.toMatch(/<script|href=/i);
  }
  const page = await (await request.get('badges/index.html')).text();
  expect(page).toContain('badges/elf-engineer-gold.svg)]');
  expect(page).not.toMatch(/<script/i);
});
