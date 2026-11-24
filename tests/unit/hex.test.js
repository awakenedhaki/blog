/**
 * Every colour comes from a token: no #rrggbb or rgb() in components and
 * routes, outside comments. Also the WP3 rules that keep the site flat and
 * legible: no font size under 12px, and no box-shadow or backdrop-filter.
 * And the WP7 rules for quieter chrome: no FixIt token name, and no
 * @keyframes apart from the search scrim's fade (the page crossfade uses
 * the browser's own).
 */
import { describe, expect, it } from 'vitest';
import { read, stripCodeComments, walk } from './helpers.js';

const COLOUR = /(?<![&\w])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3})\b|\brgba?\(/gi;

export function literalColours(src) {
	return [...stripCodeComments(src).matchAll(COLOUR)].map((m) => m[0]);
}

const files = [
	...walk('src/routes', (f) => /\.(svelte|js)$/.test(f)),
	...walk('src/lib/components', (f) => /\.(svelte|js)$/.test(f))
];

describe('no literal colours in components and routes', () => {
	it.each(files)('%s', (file) => {
		expect(literalColours(read(file))).toEqual([]);
	});
});

const styled = ['src/app.css', ...files];

/** Font sizes (and --type-* tokens) set in rem or px below 12px. */
export function tinyFontSizes(src) {
	const css = stripCodeComments(src);
	return [...css.matchAll(/(?:font-size|--type-[\w-]+)\s*:\s*([\d.]+)(rem|px)\b/g)]
		.filter(([, n, unit]) => Number(n) * (unit === 'rem' ? 16 : 1) < 12)
		.map((m) => m[0]);
}

describe('flat and legible', () => {
	it.each(styled)('%s has no font size under 12px', (file) => {
		expect(tinyFontSizes(read(file))).toEqual([]);
	});

	it.each(styled)('%s has no box-shadow or backdrop-filter', (file) => {
		expect(stripCodeComments(read(file)).match(/\b(box-shadow|backdrop-filter)\s*:/g)).toBeNull();
	});
});

// FixIt's names, retired in Phase 1. --accent, --ink, --muted and
// --selection carry on under the studio's meaning, so they are not here.
const FIXIT = /--(?:bg|surface|line|link|link-hover|accent-2|accent-strong|code-[\w-]+|table-[\w-]+|quote|corner-[\w-]+|shadow|radius)\b(?![\w-])/g;

const everywhere = [
	'src/app.css',
	'src/app.html',
	...walk('src/lib', (f) => /\.(svelte|js)$/.test(f)),
	...walk('src/routes', (f) => /\.(svelte|js)$/.test(f))
];

describe('quieter chrome', () => {
	it.each(everywhere)('%s reads and defines no FixIt token name', (file) => {
		expect(stripCodeComments(read(file)).match(FIXIT)).toBeNull();
	});

	it('the only @keyframes is the search scrim fade', () => {
		const found = everywhere.flatMap((file) =>
			[...stripCodeComments(read(file)).matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => `${file} ${m[1]}`)
		);
		expect(found).toEqual(['src/lib/components/SearchScrim.svelte fade']);
	});

	// A `--` inside an XML comment makes the whole favicon fail to parse, and
	// the browser silently shows no icon (easy to do when naming a token).
	it('static/favicon.svg has no double hyphen inside a comment', () => {
		const comments = [...read('static/favicon.svg').matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1]);
		expect(comments.filter((c) => c.includes('--'))).toEqual([]);
	});
});
