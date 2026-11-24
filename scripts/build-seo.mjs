#!/usr/bin/env node
/**
 * Emit robots.txt and sitemap.xml.
 *
 * Neither existed. For a blog written to be found by an academic audience that
 * is a real gap: without a sitemap, crawlers discover pages only by following
 * links, so a post that nothing links to yet is effectively invisible, and
 * without robots.txt there is no canonical pointer to the sitemap at all.
 *
 * Generated rather than hand-written so the sitemap cannot go stale — it is
 * built from the same post index the site renders from.
 */
import { readFile, writeFile } from 'node:fs/promises';

const site = await readFile('src/lib/site.js', 'utf8');
const url = site.match(/url:\s*"([^"]+)"/)?.[1]?.replace(/\/$/, '') ?? 'https://example.com';

const posts = JSON.parse(await readFile('src/lib/posts.data.json', 'utf8'));

// Static routes, plus one entry per post and per taxonomy term.
const themes = [...new Set(posts.map((p) => p.theme).filter(Boolean))];
const tags = [...new Set(posts.flatMap((p) => p.tags ?? []))];
// Only series registered in site.js get a page; a post naming any other id
// would otherwise put a 404 in the sitemap.
const { series: registered } = await import('../src/lib/site.js');
const known = new Set(registered.map((s) => s.id));
const seriesIds = [...new Set(posts.map((p) => p.series).filter((id) => known.has(id)))];

const routes = [
	{ loc: '/', priority: '1.0' },
	{ loc: '/blog/', priority: '0.9' },
	{ loc: '/about/', priority: '0.6' },
	{ loc: '/topics/', priority: '0.7' },
	{ loc: '/series/', priority: '0.7' },
	{ loc: '/tags/', priority: '0.6' },
	{ loc: '/archive/', priority: '0.6' },
	...posts.map((p) => ({ loc: `/blog/${p.slug}/`, lastmod: p.date, priority: '0.8' })),
	...themes.map((t) => ({ loc: `/topics/${t}/`, priority: '0.5' })),
	...seriesIds.map((s) => ({ loc: `/series/${s}/`, priority: '0.5' })),
	...tags.map((t) => ({ loc: `/tags/${t}/`, priority: '0.4' }))
];

const xml = [
	'<?xml version="1.0" encoding="UTF-8"?>',
	'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
	...routes.map((r) =>
		[
			'  <url>',
			`    <loc>${url}${r.loc}</loc>`,
			r.lastmod ? `    <lastmod>${r.lastmod}</lastmod>` : '',
			`    <priority>${r.priority}</priority>`,
			'  </url>'
		]
			.filter(Boolean)
			.join('\n')
	),
	'</urlset>',
	''
].join('\n');

await writeFile('static/sitemap.xml', xml);
await writeFile(
	'static/robots.txt',
	`User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`
);

console.log(`  seo         : sitemap.xml (${routes.length} urls) + robots.txt -> static/`);
