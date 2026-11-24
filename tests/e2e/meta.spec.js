/**
 * WP3: the `#` that opens meta rows and tags is decoration, so a screen
 * reader must not say "number". Checked through the accessibility tree.
 */
import { expect, test } from '@playwright/test';

test("a post card's meta row and tags are read without '#'", async ({ page }) => {
	await page.goto('/blog');
	const card = page.locator('article').first();
	const tree = await card.ariaSnapshot();
	expect(tree).not.toContain('#');
	expect(tree).toMatch(/\d{4}/); // the date is still read
});

test('page eyebrows and the footer are read without "#"', async ({ page }) => {
	for (const path of ['/', '/tags', '/archive', '/blog/iris-quick-eda']) {
		await page.goto(path);
		for (const row of await page.locator('.meta').all()) {
			expect(await row.ariaSnapshot(), `${path}`).not.toMatch(/(^|[\s"])#/);
		}
	}
});
