/**
 * Private by default: every resource a built page loads is same-origin.
 * Scripts, stylesheets, icons, preloads, images, media, frames, inline
 * styles and CSS url()/@import are checked. Plain <a href> links are allowed.
 *
 * Reads ./build, so `npm test` builds the site first.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { read, ROOT, walk } from './helpers.js';

const BUILD = 'build';

if (!existsSync(join(ROOT, BUILD))) {
	throw new Error('No ./build directory: run `npm run build` first (npm test does this).');
}

// <link rel> values that are links, not loads
const NON_LOADING_RELS = /\b(canonical|alternate|me|author|license|next|prev)\b/i;

const isForeign = (url) => /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url.trim()) && !/^data:/i.test(url);

function cssUrls(css) {
	return [
		...[...css.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)].map((m) => m[2]),
		...[...css.matchAll(/@import\s+(['"])([^'"]+)\1/g)].map((m) => m[2])
	];
}

function attr(tag, name) {
	const m = new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(tag);
	return m ? (m[2] ?? m[3] ?? m[4]) : null;
}

export function loadedUrls(html) {
	const urls = [];
	for (const [tag, name] of html.matchAll(/<([a-z]+)\b[^>]*>/gi)) {
		const el = name.toLowerCase();
		if (el === 'a') continue;
		if (el === 'link') {
			const rel = attr(tag, 'rel') ?? '';
			if (!NON_LOADING_RELS.test(rel)) urls.push(attr(tag, 'href'));
			continue;
		}
		for (const a of ['src', 'data', 'poster', 'href', 'xlink:href']) {
			if (a === 'href' && !['image', 'use', 'feimage'].includes(el)) continue;
			urls.push(attr(tag, a));
		}
		const srcset = attr(tag, 'srcset');
		if (srcset) urls.push(...srcset.split(',').map((s) => s.trim().split(/\s+/)[0]));
		const style = attr(tag, 'style');
		if (style) urls.push(...cssUrls(style));
	}
	for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) urls.push(...cssUrls(css));
	return urls.filter(Boolean);
}

const pages = walk(BUILD, (f) => f.endsWith('.html'));
const sheets = walk(BUILD, (f) => f.endsWith('.css'));

describe('no third-party requests', () => {
	it('finds built pages', () => {
		expect(pages.length).toBeGreaterThan(10);
	});

	it.each(pages)('%s', (file) => {
		expect(loadedUrls(read(file)).filter(isForeign)).toEqual([]);
	});

	it.each(sheets)('%s', (file) => {
		expect(cssUrls(read(file)).filter(isForeign)).toEqual([]);
	});
});
