/**
 * Bundle budget. Every post once downloaded every figure as JavaScript
 * (~2MB), because one eager glob put all the SVGs in a shared chunk. Each
 * post now imports only its own figures (figure-imports.js); these checks
 * keep it that way.
 */
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { read, ROOT, walk } from './helpers.js';

const MAX_CHUNK_KB = 512;

// A figure file's root element. Every exported figure declares the SVG
// namespace exactly once; the site's inline icons (copy buttons, nav) don't.
const FIGURE_ROOT = /<svg[^>]*xmlns=\\?["']http:\/\/www\.w3\.org\/2000\/svg/g;

const chunks = walk('build/_app/immutable', (f) => f.endsWith('.js'));
const mostFiguresInAPost = Math.max(
	...walk('src/posts', (f) => f.endsWith('/index.md')).map((f) => (read(f).match(/<Figure\b/g) ?? []).length)
);

describe('bundle budget', () => {
	it('finds the built chunks', () => {
		expect(chunks.length).toBeGreaterThan(10);
	});

	it(`no JavaScript chunk is over ${MAX_CHUNK_KB} KB`, () => {
		const big = chunks
			.map((f) => [f, statSync(join(ROOT, f)).size / 1024])
			.filter(([, kb]) => kb > MAX_CHUNK_KB)
			.map(([f, kb]) => `${f}: ${kb.toFixed(0)} KB`);
		expect(big).toEqual([]);
	});

	it('no chunk carries more figures than the post with the most', () => {
		const crowded = chunks
			.map((f) => [f, (read(f).match(FIGURE_ROOT) ?? []).length])
			.filter(([, n]) => n > mostFiguresInAPost)
			.map(([f, n]) => `${f}: ${n} figures`);
		expect(crowded).toEqual([]);
	});
});
