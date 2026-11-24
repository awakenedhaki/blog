/**
 * GitHub Pages deployment: the domain is configured consistently, and every
 * address the site advertises or links to exists in ./build.
 */
import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { site } from '../../src/lib/site.js';
import { read, ROOT, walk } from './helpers.js';

const BUILD = join(ROOT, 'build');
if (!existsSync(BUILD)) throw new Error('No ./build directory: run `npm run build` first.');

/** Does a site path resolve to a built page, the way GitHub Pages resolves it? */
function resolves(pathname) {
	const target = join(BUILD, decodeURIComponent(pathname));
	if (existsSync(target) && statSync(target).isFile()) return true;
	return existsSync(join(target, 'index.html'));
}

describe('domain', () => {
	it('static/CNAME names the host in site.url', () => {
		expect(read('static/CNAME').trim()).toBe(new URL(site.url).host);
	});

	it('the build carries CNAME, .nojekyll and 404.html', () => {
		for (const f of ['CNAME', '.nojekyll', '404.html']) expect(existsSync(join(BUILD, f)), f).toBe(true);
	});
});

describe('sitemap', () => {
	const locs = [...read('build/sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

	it('lists the site under site.url, with trailing slashes', () => {
		expect(locs.length).toBeGreaterThan(20);
		for (const loc of locs) {
			expect(loc.startsWith(`${site.url}/`), loc).toBe(true);
			expect(loc.endsWith('/'), loc).toBe(true);
		}
	});

	it('every address exists in the build', () => {
		const missing = locs.map((l) => new URL(l).pathname).filter((p) => !resolves(p));
		expect(missing).toEqual([]);
	});
});

describe('internal links', () => {
	it('every same-site link in every built page leads to a page', () => {
		const broken = new Set();
		for (const file of walk('build', (f) => f.endsWith('.html'))) {
			for (const [, href] of read(file).matchAll(/<a\b[^>]*\shref="(\/[^"#?]*)/g)) {
				if (!resolves(href)) broken.add(`${href}  (in ${file.replace('build/', '')})`);
			}
		}
		expect([...broken]).toEqual([]);
	});
});
