/**
 * WP2: the System · Light · Dark choice. Each test starts from a fresh
 * browser context, so nothing is stored unless the test stores it.
 */
import { expect, test } from '@playwright/test';

const isDark = (page) => page.evaluate(() => document.documentElement.classList.contains('dark'));
const themeColor = (page) =>
	page.locator('meta[name="theme-color"]').getAttribute('content');
const summary = (page) => page.locator('header summary[aria-label^="Theme"]');

async function choose(page, label) {
	// The panel stays open after a choice, so only open it if it is shut.
	if (!(await page.getByRole('group', { name: 'Theme' }).isVisible())) await summary(page).click();
	await page.getByRole('radio', { name: label }).check();
}

test('no stored choice and a dark OS: dark on first paint', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	// Record the class the moment the body is parsed, before any bundle runs.
	await page.addInitScript(() => {
		document.addEventListener('DOMContentLoaded', () => {
			window.__darkAtParse = document.documentElement.classList.contains('dark');
		});
	});
	await page.goto('/');
	expect(await page.evaluate(() => window.__darkAtParse)).toBe(true);
	expect((await themeColor(page)).toUpperCase()).toBe('#0F111A');
	await expect(summary(page)).toHaveAttribute('aria-label', 'Theme: System');
});

test('choosing Light with a dark OS survives a reload', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await page.goto('/');
	await choose(page, 'Light');
	expect(await isDark(page)).toBe(false);
	await page.reload();
	expect(await isDark(page)).toBe(false);
	await expect(summary(page)).toHaveAttribute('aria-label', 'Theme: Light');
});

test('System follows an OS switch without a reload', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
	await choose(page, 'Dark');
	await choose(page, 'System');
	expect(await isDark(page)).toBe(false);
	await page.emulateMedia({ colorScheme: 'dark' });
	await expect.poll(() => isDark(page)).toBe(true);
	await page.emulateMedia({ colorScheme: 'light' });
	await expect.poll(() => isDark(page)).toBe(false);
});

test("a stored 'dark' from today's site opens dark, with Dark checked", async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
	await page.goto('/');
	expect(await isDark(page)).toBe(true);
	await summary(page).click();
	await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
});

test('the menu works by keyboard alone', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('/');
	await summary(page).focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('group', { name: 'Theme' })).toBeVisible();

	await page.keyboard.press('Tab');
	await expect(page.getByRole('radio', { name: 'System' })).toBeFocused();
	await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked();
	await page.keyboard.press('ArrowDown');
	await expect(page.getByRole('radio', { name: 'Dark' })).toBeChecked();
	expect(await isDark(page)).toBe(true);

	await page.keyboard.press('Escape');
	await expect(page.getByRole('group', { name: 'Theme' })).toBeHidden();
	await expect(summary(page)).toBeFocused();
	await expect(summary(page)).toHaveAttribute('aria-label', 'Theme: Dark');
});

test('a click outside closes the menu', async ({ page }) => {
	await page.goto('/');
	await summary(page).click();
	await expect(page.getByRole('group', { name: 'Theme' })).toBeVisible();
	await page.locator('main').click({ position: { x: 5, y: 5 } });
	await expect(page.getByRole('group', { name: 'Theme' })).toBeHidden();
});
