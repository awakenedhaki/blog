/**
 * GitHub Pages behaviour, through scripts/serve-pages.mjs: trailing-slash
 * addresses, redirects for addresses without one, and the site's own 404.
 */
import { expect, test } from '@playwright/test';

for (const [from, to] of [
	['/blog', '/blog/'],
	['/tags', '/tags/'],
	['/blog/iris-quick-eda', '/blog/iris-quick-eda/'],
	['/topics/tutorial', '/topics/tutorial/']
]) {
	test(`${from} redirects to ${to} and loads`, async ({ page }) => {
		const response = await page.goto(from);
		expect(response.status()).toBe(200);
		expect(new URL(page.url()).pathname).toBe(to);
		await expect(page.locator('h1')).toBeVisible();
	});
}

test('an unknown address is a 404 with the site’s own page', async ({ page }) => {
	const response = await page.goto('/no-such-page/');
	expect(response.status()).toBe(404);
	await expect(page.locator('h1')).toHaveText('That page is not here');
	await expect(page.getByRole('link', { name: 'all posts' })).toHaveAttribute('href', '/blog/');
});

test('navigating inside the site keeps the trailing slash', async ({ page }) => {
	await page.goto('/', { waitUntil: 'networkidle' });
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Posts' }).click();
	await expect(page).toHaveURL(/\/blog\/$/);
	await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Posts' })).toHaveAttribute('aria-current', 'page');
});
