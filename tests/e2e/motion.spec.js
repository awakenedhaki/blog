/**
 * WP7: nothing moves unless the reader moved it. One second after load,
 * no animation is running on any of the screenshot pages.
 */
import { expect, test } from '@playwright/test';

const PAGES = ['/', '/blog', '/blog/iris-quick-eda', '/topics', '/tags', '/archive', '/no-such-page'];

test.use({ reducedMotion: 'no-preference' });

for (const path of PAGES) {
	test(`no running animations on ${path}`, async ({ page }) => {
		await page.goto(path);
		await page.waitForTimeout(1000);
		const running = await page.evaluate(() =>
			document.getAnimations().map((a) => `${a.animationName ?? a.constructor.name} on ${a.effect?.target?.tagName}`)
		);
		expect(running).toEqual([]);
	});
}
