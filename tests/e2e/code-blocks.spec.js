/**
 * Code blocks: line numbers, the copy button, and the animated language
 * switch in code tabs.
 */
import { expect, test } from '@playwright/test';

const ARTICLE = '/blog/iris-quick-eda';

test.beforeEach(async ({ page }) => {
	await page.goto(ARTICLE, { waitUntil: 'networkidle' });
});

test('every line is numbered, and the numbers are not part of the text', async ({ page }) => {
	const block = page.locator('.code-block:visible').first();
	const lines = block.locator('.line');
	const count = await lines.count();
	expect(count).toBeGreaterThan(3);
	const numbers = await lines.evaluateAll((els) =>
		els.map((el) => getComputedStyle(el, '::before').content)
	);
	expect(numbers[0]).toMatch(/counter\(line\)|^"?1"?$/);
	expect(await block.locator('code').textContent()).not.toMatch(/^1/);
});

test.describe('copy button', () => {
	test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

	test('copies the code exactly, announces it, and shows a tick', async ({ page }) => {
		const block = page.locator('.code-block:visible').first();
		const button = block.getByRole('button', { name: 'Copy code' });
		await expect(button).not.toHaveAttribute('hidden');
		await block.hover();
		await expect(button).toBeVisible();
		const box = await button.boundingBox();
		expect(box.width).toBeGreaterThanOrEqual(40);

		await button.click();
		const copied = await page.evaluate(() => navigator.clipboard.readText());
		expect(copied).toBe(await block.locator('code').textContent());
		expect(copied).toContain('import pandas as pd');
		await expect(page.getByRole('status').filter({ hasText: 'Code copied' })).toBeAttached();
		await expect(button).toHaveAttribute('data-copied', '');
	});

	test('can be reached and used from the keyboard', async ({ page }) => {
		const button = page.locator('.code-block:visible').first().getByRole('button', { name: 'Copy code' });
		await button.focus();
		await expect(button).toBeVisible();
		await page.keyboard.press('Enter');
		await expect(button).toHaveAttribute('data-copied', '');
	});
});

test.describe('switching language', () => {
	test.describe('with motion allowed', () => {
		// playwright.config.js runs everything with reduced motion by default.
		test.use({ reducedMotion: 'no-preference' });

	test('the pill slides, the box eases and the new code fades in', async ({ page }) => {
		const tabs = page.getByRole('tablist').first().getByRole('tab');
		await tabs.nth(1).click();
		const running = await page.evaluate(() => document.getAnimations().length);
		expect(running).toBeGreaterThan(0);

		await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
		await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBe(0);

		// Once settled, the pill sits exactly behind the chosen tab.
		const thumb = await page.locator('.tabs .thumb').first().boundingBox();
		const tab = await tabs.nth(1).boundingBox();
		expect(Math.abs(thumb.x - tab.x)).toBeLessThan(1);
		expect(Math.abs(thumb.width - tab.width)).toBeLessThan(1);
	});
	});

	test.describe('with reduced motion', () => {
		test.use({ reducedMotion: 'reduce' });

		test('the switch is instant', async ({ page }) => {
			const tabs = page.getByRole('tablist').first().getByRole('tab');
			await tabs.nth(1).click();
			// Nothing in the code tabs animates (other parts of the page, like
			// the contents rail's scrollspy, have their own near-instant fades).
			const inTabs = await page.evaluate(
				() => document.getAnimations().filter((a) => a.effect?.target?.closest?.('.codetabs')).length
			);
			expect(inTabs).toBe(0);
			await expect(page.getByRole('tabpanel', { name: (await tabs.nth(1).innerText()).trim() }).first()).toBeVisible();
		});
	});
});
