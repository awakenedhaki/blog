/**
 * Visual baselines. Every Phase 1 package is reviewed as an image diff
 * against these: each page at phone and laptop width, light and dark, and
 * root font size 100%, 130% and 200%.
 *
 * Update baselines deliberately, after looking at the diff:
 *   npx playwright test --update-snapshots
 */
import { expect, test } from '@playwright/test';

const PAGES = {
	home: '/',
	posts: '/blog',
	// code tabs, callouts and figures
	article: '/blog/iris-quick-eda',
	topics: '/topics',
	tags: '/tags',
	archive: '/archive',
	missing: '/no-such-page'
};

const VIEWPORTS = {
	phone: { width: 360, height: 800 },
	tablet: { width: 768, height: 800 },
	laptop: { width: 1280, height: 800 },
	wide: { width: 1920, height: 800 }
};
const MODES = ['light', 'dark'];
const SCALES = [100, 130, 200];

for (const [name, path] of Object.entries(PAGES)) {
	for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
		for (const mode of MODES) {
			for (const scale of SCALES) {
				test(`${name} ${vpName} ${mode} ${scale}%`, async ({ page }) => {
					await page.setViewportSize(viewport);
					await page.emulateMedia({ colorScheme: mode });
					await page.addInitScript(
						([mode, scale]) => {
							try {
								localStorage.setItem('theme', mode);
							} catch {}
							document.documentElement.style.fontSize = `${scale}%`;
						},
						[mode, scale]
					);
					await page.goto(path);
					await page.evaluate(() => document.fonts.ready);
					await expect(page).toHaveScreenshot(`${name}-${vpName}-${mode}-${scale}.png`, {
						fullPage: true
					});
				});
			}
		}
	}
}
