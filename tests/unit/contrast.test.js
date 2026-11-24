/**
 * Contrast guard. Parses both token blocks in app.css and checks the studio's
 * core pairs against WCAG: 4.5:1 for text, 3:1 for hairlines around
 * pressables and for the accent. Code colours (WP5) are read from the built
 * pages, so `npm test` builds first. Figure data colours (WP6) need 3:1;
 * figures.test.js checks the marks inside each figure.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrast, read, ROOT, themeTokens, walk } from './helpers.js';

const CORE = [
	'--page',
	'--ink',
	'--muted',
	'--tile',
	'--tappable',
	'--outline',
	'--divider',
	'--accent',
	'--on-accent',
	'--highlight',
	'--error'
];

const PAIRS = [
	...['--ink', '--muted'].flatMap((fg) =>
		['--page', '--tile', '--tappable'].map((bg) => [fg, bg, 4.5])
	),
	...['--outline', '--accent'].flatMap((fg) => ['--page', '--tile'].map((bg) => [fg, bg, 3])),
	['--on-accent', '--accent', 4.5],
	['--error', '--page', 4.5]
];

const FIGURE_TOKENS = [
	...[1, 2, 3, 4, 5, 6].map((n) => `--cat-${n}`),
	...[1, 2, 3, 4, 5].map((n) => `--seq-${n}`)
];

const themes = themeTokens();

describe.each(['light', 'dark'])('%s mode', (mode) => {
	const tokens = themes[mode];

	it.each(CORE)('defines %s as a solid hex colour', (name) => {
		expect(tokens[name], `${name} missing`).toBeDefined();
		expect(tokens[name]).toMatch(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
	});

	it.each(PAIRS)('%s on %s is at least %d:1', (fg, bg, min) => {
		const ratio = contrast(tokens[fg], tokens[bg]);
		expect(ratio, `${fg} ${tokens[fg]} on ${bg} ${tokens[bg]}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
	});

	// Figure data colours (WP6): marks need 3:1 against the tile they sit on.
	it.each(FIGURE_TOKENS)('%s is at least 3:1 on --tile', (name) => {
		const ratio = contrast(tokens[name], tokens['--tile']);
		expect(ratio, `${name} ${tokens[name]} on --tile ${tokens['--tile']}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
	});
});

/*
 * Every syntax colour Shiki wrote into the built pages, per mode, with how
 * often it appears. A var() (the comment override) resolves through the
 * mode's tokens.
 */
function codeColours() {
	if (!existsSync(join(ROOT, 'build'))) {
		throw new Error('No ./build directory: run `npm run build` first (npm test does this).');
	}
	const found = { light: new Map(), dark: new Map() };
	for (const file of walk('build', (f) => f.endsWith('.html'))) {
		for (const [, mode, value] of read(file).matchAll(/--shiki-(light|dark):([^;"]+)/g)) {
			const key = value.trim().toLowerCase();
			found[mode].set(key, (found[mode].get(key) ?? 0) + 1);
		}
	}
	return found;
}

describe('code colours on the tile', () => {
	const found = codeColours();

	it('finds highlighted code in the build', () => {
		expect(found.light.size).toBeGreaterThan(3);
		expect(found.dark.size).toBeGreaterThan(3);
	});

	describe.each(['light', 'dark'])('%s mode', (mode) => {
		const tokens = themes[mode];
		const resolve = (value) => value.replace(/^var\((--[\w-]+)\)$/, (_, name) => tokens[name] ?? value);

		it.each([...found[mode].keys()])('%s is at least 4.5:1', (value) => {
			const ratio = contrast(resolve(value), tokens['--tile']);
			expect(ratio, `${value} on --tile ${tokens['--tile']}: ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
		});
	});
});
