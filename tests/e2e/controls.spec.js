/**
 * WP4: every control is a 40 × 40 px target, and every keyboard stop in the
 * header, both menus, code tabs and code folds shows a focus ring.
 *
 * The article has code tabs, a code fold and the share row.
 */
import { expect, test } from '@playwright/test';

const ARTICLE = '/blog/iris-quick-eda';

async function openMenu(page, summary) {
	await page.locator(summary).click();
}

async function expectTargets(page, selector) {
	const els = await page.locator(selector).filter({ visible: true }).all();
	expect(els.length, `${selector} matched nothing visible`).toBeGreaterThan(0);
	for (const el of els) {
		const box = await el.boundingBox();
		const name = (await el.getAttribute('aria-label')) ?? (await el.innerText()).trim();
		expect(box.width, `${selector} "${name}" width`).toBeGreaterThanOrEqual(39.5);
		expect(box.height, `${selector} "${name}" height`).toBeGreaterThanOrEqual(39.5);
	}
}

test.describe('40 px targets', () => {
	for (const width of [360, 1280]) {
		test(`header, footer, share row, menus and code tabs at ${width}px`, async ({ page }) => {
			await page.setViewportSize({ width, height: 800 });
			await page.goto(ARTICLE);
			await expectTargets(page, 'header nav > a, header summary, header button');
			await expectTargets(page, 'footer a');
			await expectTargets(page, '.share a, .share button');
			await expectTargets(page, '.codetabs [role="tab"]');
			await expectTargets(page, '.codefold summary');

			await openMenu(page, 'header .menu:not(:has(fieldset)) summary');
			await expectTargets(page, 'header .menu nav a');
			await page.keyboard.press('Escape');

			await openMenu(page, 'header summary[aria-label^="Theme"]');
			await expectTargets(page, 'header fieldset label');
		});
	}
});

/** The focused element's outline, as the reader sees it. */
const focusRing = (page) =>
	page.evaluate(() => {
		const el = document.activeElement;
		const style = getComputedStyle(el);
		return {
			tag: `${el.tagName.toLowerCase()} ${el.getAttribute('aria-label') ?? el.textContent.trim().slice(0, 30)}`,
			inScope: !!el.closest('header, .codetabs, .codefold, .menu'),
			visible:
				style.outlineStyle !== 'none' &&
				parseFloat(style.outlineWidth) >= 2 &&
				style.outlineColor !== 'rgba(0, 0, 0, 0)'
		};
	});

test('keyboard pass: header, both menus, code tabs and code folds show a focus ring', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto(ARTICLE, { waitUntil: 'networkidle' }); // code tabs are built on mount

	const seen = [];
	const check = async () => {
		const ring = await focusRing(page);
		if (!ring.inScope) return;
		seen.push(ring.tag);
		expect(ring.visible, `no focus ring on ${ring.tag}`).toBe(true);
	};

	// The whole page in tab order, once (every code block has a copy button).
	for (let i = 0; i < 400; i++) {
		await page.keyboard.press('Tab');
		if (await page.evaluate(() => document.activeElement === document.body)) break;
		await check();
	}

	// Inside each menu, opened from the keyboard.
	for (const summary of ['header .menu:not(:has(fieldset)) summary', 'header summary[aria-label^="Theme"]']) {
		await page.locator(summary).focus();
		await page.keyboard.press('Enter');
		for (let i = 0; i < 6; i++) {
			await page.keyboard.press('Tab');
			await check();
		}
		await page.keyboard.press('Escape');
	}

	// Code tabs: arrow keys move the selection (focus follows in WP9).
	expect(seen.some((t) => t.startsWith('button') && /python|r\b/i.test(t))).toBe(true);
	expect(seen.some((t) => t.startsWith('summary') && /code|show/i.test(t))).toBe(true);
});
