/**
 * WP8: centred and capped. At every width: prose keeps to the 48rem
 * measure, the wordmark and the article text share a left edge, and the
 * page never scrolls sideways. On wide screens the text column is 53rem
 * beside the 16rem contents rail.
 */
import { expect, test } from '@playwright/test';

const ARTICLE = '/blog/iris-quick-eda';
const REM = 16;
const MEASURE = 48; // rem, --measure in app.css

for (const width of [360, 768, 1280, 1920]) {
	test.describe(`${width}px`, () => {
		test.use({ viewport: { width, height: 900 } });

		test(`prose paragraphs keep to the ${MEASURE}rem measure`, async ({ page }) => {
			await page.goto(ARTICLE);
			const widths = await page.locator('.prose p').evaluateAll((ps) =>
				ps.map((p) => p.getBoundingClientRect().width)
			);
			expect(widths.length).toBeGreaterThan(5);
			expect(Math.max(...widths)).toBeLessThanOrEqual(MEASURE * REM + 0.5);
		});

		test('the wordmark and the article text start at the same x', async ({ page }) => {
			await page.goto(ARTICLE);
			const wordmark = await page.locator('header .wordmark').boundingBox();
			const text = await page.locator('article header .meta').first().boundingBox();
			expect(Math.abs(wordmark.x - text.x)).toBeLessThanOrEqual(1);
		});

		test('no horizontal scroll', async ({ page }) => {
			for (const path of ['/', ARTICLE, '/tags', '/archive']) {
				await page.goto(path);
				const overflow = await page.evaluate(
					() => document.documentElement.scrollWidth - document.documentElement.clientWidth
				);
				expect(overflow, path).toBeLessThanOrEqual(0);
			}
		});
	});
}

test.describe('wide screens', () => {
	test.use({ viewport: { width: 1920, height: 900 } });

	test('content is capped at 72rem, with a 53rem column beside a 16rem rail', async ({ page }) => {
		await page.goto(ARTICLE);
		const main = await page.locator('main').evaluate((el) => {
			const style = getComputedStyle(el);
			return el.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
		});
		expect(main).toBeCloseTo(72 * REM, 0);
		const article = await page.locator('article.prose').boundingBox();
		const rail = await page.locator('aside').boundingBox();
		expect(article.width).toBeCloseTo(53 * REM, 0);
		expect(rail.width).toBeCloseTo(16 * REM, 0);
	});
});

test.describe('tables', () => {
	for (const width of [360, 1280]) {
		test(`at ${width}px the card hugs the table, up to the column`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto('/blog/beta-binomial-composition');
			const column = await page.locator('article.prose').evaluate((el) => el.clientWidth);
			const tables = await page.locator('.prose table').evaluateAll((ts) =>
				ts.map((t) => ({
					box: t.getBoundingClientRect().width,
					rows: t.querySelector('tr').getBoundingClientRect().width
				}))
			);
			expect(tables.length).toBeGreaterThan(0);
			for (const { box, rows } of tables) {
				// The card is the rows plus its 1px border either side, or the
				// column when the rows are wider (and then it scrolls inside).
				expect(box).toBeLessThanOrEqual(Math.min(rows + 2, column) + 0.5);
				expect(box).toBeLessThanOrEqual(column + 0.5);
			}
		});
	}
});

test.describe('one column', () => {
	for (const width of [360, 768, 1280, 1920]) {
		test(`at ${width}px prose, code, figures and callouts share both edges`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 });
			await page.goto(ARTICLE, { waitUntil: 'networkidle' });
			const edges = await page
				.locator('article.prose > :is(p, .code-block, .codetabs, figure, .callout, .codefold)')
				.evaluateAll((els) =>
					els
						.filter((el) => el.offsetParent)
						.map((el) => {
							const r = el.getBoundingClientRect();
							return { tag: el.className || el.tagName, left: r.left, right: r.right };
						})
				);
			expect(new Set(edges.map((e) => e.tag.split(' ')[0])).size).toBeGreaterThan(3);
			const [first] = edges;
			for (const e of edges) {
				expect(Math.abs(e.left - first.left), `${e.tag} left`).toBeLessThanOrEqual(0.5);
				expect(Math.abs(e.right - first.right), `${e.tag} right`).toBeLessThanOrEqual(0.5);
			}
			const column = Math.min(MEASURE * REM, await page.locator('article.prose').evaluate((el) => el.clientWidth));
			expect(first.right - first.left).toBeCloseTo(column, 0);
		});
	}
});
