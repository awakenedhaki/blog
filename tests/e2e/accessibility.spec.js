/**
 * WP9: accessibility fixes that do not depend on the look, and an axe-core
 * scan of every screenshot page in both modes.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ARTICLE = '/blog/iris-quick-eda';

test('figures are named on the svg itself', async ({ page }) => {
	await page.goto(ARTICLE);
	const svgs = page.locator('figure .svg-host > svg');
	expect(await svgs.count()).toBeGreaterThan(0);
	for (const svg of await svgs.all()) {
		await expect(svg).toHaveAttribute('role', 'img');
		expect((await svg.getAttribute('aria-label'))?.trim()).toBeTruthy();
	}
	await expect(page.locator('.svg-host[aria-label]')).toHaveCount(0);
	expect(await page.getByRole('img', { name: /petal width against petal length/i }).count()).toBe(1);
});

test.describe('search', () => {
	test('results are links, announced by a status line, with Up and Down', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' }); // "/" is handled once hydrated
		await page.keyboard.press('/');
		const field = page.getByRole('textbox', { name: 'Search query' });
		await expect(field).toBeFocused();
		await expect(page.locator('.search').getByRole('status')).toBeAttached(); // live before any query

		await field.fill('pca');
		await expect(page.locator('.search').getByRole('status')).toHaveText(/^\d+ posts? found$/);
		await expect(page.getByRole('listbox')).toHaveCount(0);
		const links = page.getByRole('list', { name: 'Search results' }).getByRole('link');
		expect(await links.count()).toBeGreaterThan(1);
		await expect(links.first()).toHaveAttribute('href', /^\/blog\//);

		await field.press('ArrowDown');
		await expect(links.nth(0)).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(links.nth(1)).toBeFocused();
		await page.keyboard.press('ArrowUp');
		await expect(links.nth(0)).toBeFocused();
		await page.keyboard.press('ArrowUp');
		await expect(field).toBeFocused();

		await field.fill('zzqqxx');
		await expect(page.locator('.search').getByRole('status')).toHaveText('No matches for “zzqqxx”.');
	});
});

test('code tabs: focus follows the selection, Home and End, named panels', async ({ page }) => {
	await page.goto(ARTICLE);
	const tablist = page.getByRole('tablist').first();
	const tabs = tablist.getByRole('tab');
	await expect(tabs.first()).toBeVisible(); // the tab row is built after mount
	const count = await tabs.count();
	expect(count).toBeGreaterThan(1);

	await tabs.first().focus();
	await page.keyboard.press('ArrowRight');
	await expect(tabs.nth(1)).toBeFocused();
	await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
	await page.keyboard.press('Home');
	await expect(tabs.first()).toBeFocused();
	await page.keyboard.press('End');
	await expect(tabs.nth(count - 1)).toBeFocused();
	await page.keyboard.press('ArrowRight'); // wraps
	await expect(tabs.first()).toBeFocused();

	// The visible panel is a tabpanel named by the chosen tab.
	const label = (await tabs.first().innerText()).trim();
	await expect(page.getByRole('tabpanel', { name: label }).first()).toBeVisible();
});

test.describe('contents rail', () => {
	test('wide: the summary is out of the tab order', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto(ARTICLE);
		await expect(page.locator('.toc summary')).toHaveAttribute('tabindex', '-1');
	});

	test('narrow: the collapsible card can still be toggled by keyboard', async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 800 });
		await page.goto(ARTICLE);
		await expect(page.locator('.toc summary')).not.toHaveAttribute('tabindex', '-1');
	});
});

test('skip link: first stop, visible when focused, moves focus to the content', async ({ page }) => {
	await page.goto(ARTICLE);
	await page.keyboard.press('Tab');
	const skip = page.getByRole('link', { name: 'Skip to content' });
	await expect(skip).toBeFocused();
	const box = await skip.boundingBox();
	expect(box.y).toBeGreaterThanOrEqual(0);
	await page.keyboard.press('Enter');
	await expect(page.locator('main')).toBeFocused();
});

test('the About page has no note addressed to the author', async ({ page }) => {
	await page.goto('/about');
	await expect(page.locator('main')).not.toContainText('src/routes/about');
});

/*
 * axe-core: no serious or critical issue on any screenshot page, in either
 * mode. Colour contrast is part of the scan, so it needs the WP1 token
 * values to pass: until then the page and on-accent colours are undefined.
 */
const PAGES = ['/', '/blog', ARTICLE, '/topics', '/tags', '/archive', '/no-such-page'];

for (const mode of ['light', 'dark']) {
	for (const path of PAGES) {
		test(`axe: ${path} in ${mode} mode`, async ({ page }) => {
			await page.addInitScript((m) => localStorage.setItem('theme', m), mode);
			await page.goto(path, { waitUntil: 'networkidle' });
			const { violations } = await new AxeBuilder({ page }).analyze();
			const serious = violations
				.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes[0].target.join(' ')}`);
			expect(serious).toEqual([]);
		});
	}
}
